import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OneSerializedResponseDto } from '../../../../common/application/dto/one-serialized-response.dto';
import {
  IOfferRepository,
  OFFER_REPOSITORY_KEY,
} from '../repository/offer.repository.interface';
import { OfferResponseAdapter } from '../adapter/offer-responser.adapter';
import { OfferResponseDto } from '../dto/offer-response.dto';
import { OfferNotFoundException } from '../../infrastructure/database/exception/offer-not-found.exception';
import { OFFER_ENTITY_NAME } from '../../domain/offer.name';
import { OfferMapper } from '../mapper/offer.mapper';
import { CreateTokenOfferParamsDto } from '../dto/create-token-offer-params.dto';
import { StellarTransactionAdapter } from '../../../../common/infrastructure/stellar/stellar.transaction.adapter';
import { SorobanContractAdapter } from '../../../../common/infrastructure/stellar/soroban.contract.adapter';
import { StellarAccountAdapter } from '../../../../common/infrastructure/stellar/stellar.account.adapter';
import {
  IProjectRepository,
  PROJECT_REPOSITORY_KEY,
} from '../../../project/application/repository/project.repository.interface';
import { ProjectNotFoundException } from '../../../project/infrastructure/database/exception/project-not-found.exception';
import { scValToNative, xdr } from '@stellar/stellar-sdk';
import { OfferData } from '../interfaces/offer-data.interface';
import { OwnerAddressNotFoundException } from '../../infrastructure/database/exception/owner-address-not-found.exception';
import { OwnerAccountNotFoundException } from '../../infrastructure/database/exception/owner-account-not-found.exception';
import { OfferTransactionType } from '../enum/offer-transaction-type.enum';
import { UpdateTokenOfferParamsDto } from '../dto/update-token-offer-params.dto';
import { OfferNotActiveException } from '../../infrastructure/database/exception/offer-not-active.exception';
import {
  IUserRepository,
  USER_REPOSITORY_KEY,
} from '../../../iam/user/application/repository/user.repository.interface';
import { OfferOwnerException } from '../../infrastructure/database/exception/offer-owner.exception';
import { IGetAllOptions } from '../../../../common/application/interface/get-all-options.interface';
import { Offer } from '../../domain/offer.domain';
import { CollectionDto } from '../../../../common/application/dto/collection.dto';
import { ManySerializedResponseDto } from '../../../../common/application/dto/many-serialized-response.dto';
import { TransactionService } from '../../../transaction/application/service/transaction.service';
import { TRANSACTION_TYPE } from '../../../transaction/domain/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../../transaction/domain/transaction-status.enum';
import { UserNotFoundException } from '../../../iam/user/infrastructure/database/exception/user-not-found.exception';
import { User } from '../../../iam/user/domain/user.domain';
import { NotificationService } from '../../../notification/application/service/notification.service';
import { NotificationType } from '../../../notification/infrastructure/persistence/entities/notification.entity';
import { OfferEntity } from '../../infrastructure/persistence/entities/offer.entity';
import { OwnershipEntity } from '../../../ownership/infrastructure/persistence/entities/ownership.entity';

@Injectable()
export class OfferService {
  constructor(
    @Inject(OFFER_REPOSITORY_KEY)
    private readonly offerRepository: IOfferRepository,
    private readonly offerResponseAdapter: OfferResponseAdapter,
    private readonly offerMapper: OfferMapper,
    private readonly sorobanContractAdapter: SorobanContractAdapter,
    private readonly stellarAccountService: StellarAccountAdapter,
    @Inject(PROJECT_REPOSITORY_KEY)
    private readonly projectRepository: IProjectRepository,
    @Inject(USER_REPOSITORY_KEY)
    private readonly userRepository: IUserRepository,
    private readonly stellarTransactionService: StellarTransactionAdapter,
    private readonly transactionService: TransactionService,
    private readonly notificationService: NotificationService,

    @InjectRepository(OfferEntity)
    private readonly offerEntityRepo: Repository<OfferEntity>,

    @InjectRepository(OwnershipEntity)
    private readonly ownershipRepo: Repository<OwnershipEntity>,
  ) {}

  private normalizeOfferAmount(value: unknown) {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) ? amount : 0;
  }

  private async assertSellerHasAvailableBalance(params: {
    userId: number;
    projectId: number;
    walletAddress: string;
    requestedAmount: number;
  }) {
    const heldRow = await this.ownershipRepo
      .createQueryBuilder('ownership')
      .select('COALESCE(SUM(ownership.amount), 0)', 'heldAmount')
      .where('ownership.user_id = :userId', { userId: params.userId })
      .andWhere('ownership.project_id = :projectId', {
        projectId: params.projectId,
      })
      .andWhere('ownership.custody_type = :custodyType', {
        custodyType: 'self_custody',
      })
      .andWhere('ownership.settlement_status = :settlementStatus', {
        settlementStatus: 'SETTLED',
      })
      .andWhere('ownership.status = :status', { status: 'active' })
      .andWhere('ownership.wallet_address = :walletAddress', {
        walletAddress: params.walletAddress,
      })
      .getRawOne();

    const reservedRow = await this.offerEntityRepo
      .createQueryBuilder('offer')
      .select('COALESCE(SUM(offer.amount), 0)', 'reservedAmount')
      .where('offer.user_id = :userId', { userId: params.userId })
      .andWhere('offer.project_id = :projectId', {
        projectId: params.projectId,
      })
      .andWhere('offer.is_active = true')
      .andWhere('offer.deleted_at IS NULL')
      .getRawOne();

    const heldAmount = this.normalizeOfferAmount(heldRow?.heldAmount);
    const reservedAmount = this.normalizeOfferAmount(reservedRow?.reservedAmount);
    const availableAmount = Math.max(heldAmount - reservedAmount, 0);

    if (availableAmount < params.requestedAmount) {
      throw new BadRequestException(
        'Sell quantity exceeds your available unencumbered holdings',
      );
    }
  }

  async findAll(
    options: IGetAllOptions<
      Offer & {
        tokenSymbol?: string;
        userAddress?: string;
        excludeAddress?: string;
      }
    >,
  ): Promise<ManySerializedResponseDto<OfferResponseDto>> {
    const collection = await this.offerRepository.getAll(options);

    const collectionDto = new CollectionDto({
      ...collection,
      data: collection.data.map((offer) =>
        this.offerMapper.fromOfferToOfferResponseDto(offer),
      ),
    });

    return this.offerResponseAdapter.manyEntitiesResponse(
      OFFER_ENTITY_NAME,
      collectionDto,
    );
  }

  async findOneByUuid(
    uuid: string,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const offer = await this.offerRepository.getOneByFilter({ uuid });

    if (!offer) {
      throw new OfferNotFoundException({
        message: `Offer with ${uuid} not found`,
      });
    }

    return this.offerResponseAdapter.oneEntityResponse(
      OFFER_ENTITY_NAME,
      this.offerMapper.fromOfferToOfferResponseDto(offer),
    );
  }

  async createTokenOfferXdr({
    userAddress: ownerAddress,
    ...createOfferDto
  }: CreateTokenOfferParamsDto): Promise<
    OneSerializedResponseDto<OfferResponseDto>
  > {
    if (!ownerAddress) {
      throw new OwnerAddressNotFoundException('Owner address is required');
    }

    const ownerAccount =
      await this.stellarAccountService.getAccount(ownerAddress);

    if (!ownerAccount) {
      throw new OwnerAccountNotFoundException('Owner account not found');
    }

    const project = await this.projectRepository.getOneByFilter({
      uuid: createOfferDto.projectUuid,
    });

    if (!project) {
      throw new ProjectNotFoundException({
        message: `Project with ${createOfferDto.projectUuid} not found`,
      });
    }

    const user = await this.userRepository.getOneByFilter({
      walletAddress: ownerAddress,
    });

    if (!user) {
      throw new UserNotFoundException({
        message: `User with ${ownerAddress} not found`,
      });
    }

    await this.assertSellerHasAvailableBalance({
      userId: Number(user.id),
      projectId: Number(project.id),
      walletAddress: ownerAddress,
      requestedAmount: this.normalizeOfferAmount(createOfferDto.amount),
    });

    const tokenAddress = project.tokenAddress;

    const transactionXdr =
      await this.sorobanContractAdapter.buildCreateTokenOfferTransaction(
        ownerAccount,
        tokenAddress,
        createOfferDto.amount,
        createOfferDto.price,
        ownerAddress,
      );

    return this.offerResponseAdapter.oneEntityResponse('offer', {
      transactionXdr,
    });
  }

  async updateTokenOfferPriceXdr(
    { price }: UpdateTokenOfferParamsDto,
    offerUuid: string,
    ownerAddress: string,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const ownerAccount =
      await this.stellarAccountService.getAccount(ownerAddress);

    if (!ownerAccount) {
      throw new OwnerAccountNotFoundException('Owner account not found');
    }

    const offer = await this.offerRepository.getOneByFilter({
      uuid: offerUuid,
    });

    if (!offer) {
      throw new OfferNotFoundException({
        message: `Offer with ${offerUuid} not found`,
      });
    }

    if (!offer.isActive) {
      throw new OfferNotActiveException({
        message: `Offer with ${offerUuid} is not active`,
      });
    }

    const transactionXdr =
      await this.sorobanContractAdapter.buildUpdateTokenOfferPriceTransaction(
        ownerAccount,
        offer.externalId,
        price,
      );

    return this.offerResponseAdapter.oneEntityResponse('offer', {
      transactionXdr,
    });
  }

  async cancelTokenOfferXdr(
    offerUuid: string,
    ownerAddress: string,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const ownerAccount =
      await this.stellarAccountService.getAccount(ownerAddress);

    const offer = await this.offerRepository.getOneByFilter({
      uuid: offerUuid,
    });

    if (!offer) {
      throw new OfferNotFoundException({
        message: `Offer with ${offerUuid} not found`,
      });
    }

    const transactionXdr =
      await this.sorobanContractAdapter.buildCancelTokenOfferTransaction(
        ownerAccount,
        offer.externalId,
      );

    return this.offerResponseAdapter.oneEntityResponse('offer', {
      transactionXdr,
    });
  }

  async buyTokenOfferXdr(
    offerUuid: string,
    buyerAddress: string,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const buyerAccount =
      await this.stellarAccountService.getAccount(buyerAddress);

    if (!buyerAccount) {
      throw new OwnerAccountNotFoundException('Buyer account not found');
    }

    const offer = await this.offerRepository.getOneByFilter({
      uuid: offerUuid,
    });

    if (!offer) {
      throw new OfferNotFoundException({
        message: `Offer with ${offerUuid} not found`,
      });
    }

    if (offer.isActive === false || offer.amount === 0) {
      throw new OfferNotActiveException({
        message: `Offer with ${offerUuid} is not active`,
      });
    }

    const { walletAddress: ownerWalletAddress } =
      await this.userRepository.getOneByFilter({
        uuid: offer.user.uuid,
      });

    if (ownerWalletAddress === buyerAddress) {
      throw new OfferOwnerException({
        message: `Offer with ${offerUuid} is owned by the buyer`,
      });
    }

    const transactionXdr =
      await this.sorobanContractAdapter.buildBuyTokenOfferTransaction(
        buyerAccount,
        offer.externalId,
        buyerAddress,
      );

    return this.offerResponseAdapter.oneEntityResponse('offer', {
      transactionXdr,
    });
  }

  async submitTokenOfferXdr(
    xdr: string,
    userAddress: string,
    type: OfferTransactionType,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const user = await this.userRepository.getOneByFilter({
      walletAddress: userAddress,
    });

    if (!user) {
      throw new UserNotFoundException({
        message: `User with ${userAddress} not found`,
      });
    }

    const { txHash } =
      await this.stellarTransactionService.submitSorobanTransaction(xdr);

    const { returnValue } =
      await this.stellarTransactionService.getSorobanTransaction(txHash);
    const txReturnValue = returnValue as unknown as xdr.ScVal;

    switch (type) {
      case OfferTransactionType.CREATE_OFFER:
        return this.CreateTokenOffer(txReturnValue, user);
      case OfferTransactionType.UPDATE_OFFER:
        return this.updateTokenOfferPrice(txReturnValue);
      case OfferTransactionType.CANCEL_OFFER:
        return this.cancelTokenOffer(txReturnValue);
      case OfferTransactionType.BUY_OFFER:
        return this.buyTokenOffer(txReturnValue, user.id, txHash);
    }
  }

  private async CreateTokenOffer(
    txReturnValue: xdr.ScVal,
    user: User,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const [offerId, offerData]: [bigint, OfferData] =
      scValToNative(txReturnValue);

    const offer: OfferData = {
      offerId: Number(offerId as bigint),
      amount: Number(offerData.amount),
      is_active: offerData.is_active,
      owner: offerData.owner,
      token_address: offerData.token_address,
      total_price: Number(offerData.total_price),
    };

    const project = await this.projectRepository.getOneByFilter({
      tokenAddress: offer.token_address,
    });

    const existingOffer = await this.offerRepository.getOneByFilter({
      externalId: offer.offerId,
    });

    if (existingOffer) {
      return this.offerResponseAdapter.oneEntityResponse(
        OFFER_ENTITY_NAME,
        this.offerMapper.fromOfferToOfferResponseDto(existingOffer),
      );
    }

    await this.assertSellerHasAvailableBalance({
      userId: Number(user.id),
      projectId: Number(project.id),
      walletAddress: String(user.walletAddress ?? ''),
      requestedAmount: Number(offer.amount),
    });

    const newOffer = await this.offerRepository.saveOne({
      externalId: offer.offerId,
      amount: offer.amount,
      price: offer.total_price,
      isActive: offer.is_active,
      user,
      project: project,
    });

    await this.notificationService.createNotification(
      Number(user.id),
      NotificationType.SELL_ORDER_CREATED,
      'Sell offer created',
      `Your sell offer for ${project?.name ?? 'this project'} is now live.`,
      'offer',
      Number(newOffer.id),
    );

    return this.offerResponseAdapter.oneEntityResponse(
      OFFER_ENTITY_NAME,
      this.offerMapper.fromOfferToOfferResponseDto(newOffer),
    );
  }

  private async updateTokenOfferPrice(
    txReturnValue: xdr.ScVal,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const [offerId, offerData]: [bigint, OfferData] =
      scValToNative(txReturnValue);

    const offerToUpdate = await this.offerRepository.getOneByFilter({
      externalId: Number(offerId),
    });

    if (!offerToUpdate) {
      throw new OfferNotFoundException({
        message: `Offer with ${offerToUpdate.uuid} not found`,
      });
    }

    await this.offerRepository.updateOneOrFail(offerToUpdate.id, {
      price: Number(offerData.total_price),
    });

    const updatedOffer = await this.offerRepository.getOneByFilter({
      externalId: Number(offerId),
    });

    return this.offerResponseAdapter.oneEntityResponse(
      OFFER_ENTITY_NAME,
      this.offerMapper.fromOfferToOfferResponseDto(updatedOffer),
    );
  }

  private async cancelTokenOffer(
    txReturnValue: xdr.ScVal,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const [offerId]: [bigint, OfferData] = scValToNative(txReturnValue);

    const offerToCancel = await this.offerRepository.getOneByFilter({
      externalId: Number(offerId),
    });

    if (!offerToCancel) {
      throw new OfferNotFoundException({
        message: `Offer with ${offerToCancel.uuid} not found`,
      });
    }

    if (!offerToCancel.isActive) {
      return this.offerResponseAdapter.oneEntityResponse(
        OFFER_ENTITY_NAME,
        this.offerMapper.fromOfferToOfferResponseDto(offerToCancel),
      );
    }

    await this.offerRepository.updateOneOrFail(offerToCancel.id, {
      isActive: false,
    });

    const canceledOffer = await this.offerRepository.getOneByFilter({
      externalId: Number(offerId),
    });

    await this.notificationService.createNotification(
      Number(canceledOffer.user.id),
      NotificationType.SELL_ORDER_CANCELLED,
      'Sell offer cancelled',
      `Your sell offer for ${canceledOffer.project?.name ?? 'this project'} has been cancelled.`,
      'offer',
      Number(canceledOffer.id),
    );

    return this.offerResponseAdapter.oneEntityResponse(
      OFFER_ENTITY_NAME,
      this.offerMapper.fromOfferToOfferResponseDto(canceledOffer),
    );
  }

  private async buyTokenOffer(
    txReturnValue: xdr.ScVal,
    buyerId: number,
    txHash?: string | null,
  ): Promise<OneSerializedResponseDto<OfferResponseDto>> {
    const [offerId, offerData]: [bigint, OfferData] =
      scValToNative(txReturnValue);

    const offerToBuy = await this.offerRepository.getOneByFilter({
      externalId: Number(offerId),
    });

    if (!offerToBuy) {
      throw new OfferNotFoundException({
        message: `Offer with ${offerToBuy.uuid} not found`,
      });
    }

    if (!offerToBuy.isActive || Number(offerToBuy.amount) <= 0) {
      throw new OfferNotActiveException({
        message: `Offer with ${offerToBuy.uuid} is not active`,
      });
    }

    const capitalAmount = Number(offerToBuy.amount) * Number(offerToBuy.price);
    const settledAt = new Date();

    await this.transactionService.createTransaction({
      userId: buyerId,
      projectId: offerToBuy.project.id,
      amount: capitalAmount,
      tokenAmount: Number(offerToBuy.amount),
      currency: 'AUD',
      type: TRANSACTION_TYPE.BUY,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: txHash ?? null,
      description: `Secondary-market purchase of ${offerToBuy.project?.name ?? 'project'} tokens`,
      settledAt,
    });

    await this.transactionService.createTransaction({
      userId: offerToBuy.user.id,
      projectId: offerToBuy.project.id,
      amount: capitalAmount,
      tokenAmount: Number(offerToBuy.amount),
      currency: 'AUD',
      type: TRANSACTION_TYPE.SELL,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: txHash ?? null,
      description: `Secondary-market sale of ${offerToBuy.project?.name ?? 'project'} tokens`,
      settledAt,
    });

    await this.offerRepository.updateOneOrFail(offerToBuy.id, {
      amount: Number(offerData.amount),
      isActive: Number(offerData.amount) > 0,
    });

    const offer = await this.offerRepository.getOneByFilter({
      externalId: Number(offerId),
    });

    if (Number(offer.amount) <= 0) {
      await this.notificationService.createNotification(
        Number(offer.user.id),
        NotificationType.SELL_ORDER_FILLED,
        'Sell offer filled',
        `Your sell offer for ${offer.project?.name ?? 'this project'} has been filled.`,
        'offer',
        Number(offer.id),
      );
    }

    await this.notificationService.createNotification(
      Number(buyerId),
      NotificationType.TRANSACTION_COMPLETED,
      'Purchase completed',
      `Your purchase of ${offer.project?.name ?? 'this project'} has completed.`,
      'transaction',
      null,
    );

    return this.offerResponseAdapter.oneEntityResponse(
      OFFER_ENTITY_NAME,
      this.offerMapper.fromOfferToOfferResponseDto(offer),
    );
  }
}
