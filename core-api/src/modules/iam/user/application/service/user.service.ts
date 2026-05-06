import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY_KEY,
} from '../repository/user.repository.interface';
import { UserMapper } from '../mapper/user.mapper';
import { UserResponseAdapter } from '../adapter/user-responser.adapter';
import { User } from '../../domain/user.domain';
import { IGetAllOptions } from '../../../../../common/application/interface/get-all-options.interface';
import { UserResponseDto } from '../dto/user-response.dto';
import { ManySerializedResponseDto } from '../../../../../common/application/dto/many-serialized-response.dto';
import { CollectionDto } from '../../../../../common/application/dto/collection.dto';
import { USER_ENTITY_NAME } from '../../domain/user.name';
import { UpdateSelfDto } from '../dto/update-self.dto';
import { OneSerializedResponseDto } from '../../../../../common/application/dto/one-serialized-response.dto';
import { StellarTransactionAdapter } from '../../../../../common/infrastructure/stellar/stellar.transaction.adapter';
import { UserType } from '../../domain/user-type.enum';
import { UserNotFoundException } from '../../infrastructure/database/exception/user-not-found.exception';
import { UserWalletNotFoundException } from '../../infrastructure/database/exception/user-wallet-not-found.exception';
import { IncorrectUserTypeException } from '../../infrastructure/database/exception/incorrect-user-type.exception';
import { BuildTransactionResponseDto } from '../../../../../common/infrastructure/stellar/dto/build-transaction-response.dto';
import { ProjectResponseDto } from '../../../../project/application/dto/project-response.dto';
import { ProjectMapper } from '../../../../project/application/mapper/project.mapper';
import {
  IProjectRepository,
  PROJECT_REPOSITORY_KEY,
} from '../../../../project/application/repository/project.repository.interface';
import { GetUserPortfolioParamsDto } from '../dto/get-user-portfolio-params.dto';
import { UserWalletAlreadyExistsException } from '../../infrastructure/database/exception/user-wallet-already-exists.exception';
import { OwnershipService } from '../../../../ownership/application/service/ownership.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_KEY)
    private readonly userRepository: IUserRepository,
    private readonly userMapper: UserMapper,
    private readonly userResponseAdapter: UserResponseAdapter,
    private readonly stellarTransactionAdapter: StellarTransactionAdapter,
    @Inject(PROJECT_REPOSITORY_KEY)
    private readonly projectRepository: IProjectRepository,
    private readonly projectMapper: ProjectMapper,
    private readonly ownershipService: OwnershipService,
  ) {}

  async getAll(
    options: IGetAllOptions<User>,
  ): Promise<ManySerializedResponseDto<UserResponseDto>> {
    const collection = await this.userRepository.getAll(options);
    const collectionDto = new CollectionDto({
      ...collection,
      data: collection.data.map((user) =>
        this.userMapper.fromUserToUserResponseDto(user),
      ),
    });

    return this.userResponseAdapter.manyEntitiesResponse(
      USER_ENTITY_NAME,
      collectionDto,
    );
  }

  async updateSelf(
    { id }: User,
    userUpdates: UpdateSelfDto,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    if (userUpdates.walletAddress) {
      const existingWallet = await this.userRepository.getOneByFilter({
        walletAddress: userUpdates.walletAddress,
      });

      if (existingWallet && existingWallet.id !== id) {
        throw new UserWalletAlreadyExistsException({
          message: `Wallet ${userUpdates.walletAddress} is already connected to a user`,
        });
      }
    }

    const updatedUser = await this.userRepository.updateOneOrFail(
      id,
      userUpdates,
    );

    return this.userResponseAdapter.oneEntityResponse(
      USER_ENTITY_NAME,
      this.userMapper.fromUserToUserResponseDto(updatedUser),
    );
  }

  async createAddManagerTransaction(
    userPublicKey: string,
    managerUuid: string,
  ): Promise<OneSerializedResponseDto<BuildTransactionResponseDto>> {
    if (!userPublicKey) {
      throw new UserWalletNotFoundException({
        message: "User doesn't have a connected wallet",
      });
    }

    const manager = await this.userRepository.getOneByFilter({
      uuid: managerUuid,
    });

    if (!manager) {
      throw new UserNotFoundException({ message: 'Manager not found' });
    }

    if (manager.type !== UserType.WEALTH_MANAGER) {
      throw new IncorrectUserTypeException({
        message: 'Target user is not a Wealth Manager',
      });
    }

    if (!manager.walletAddress) {
      throw new UserWalletNotFoundException({
        message: "Manager doesn't have a connected wallet",
      });
    }

    const transactionXdr =
      await this.stellarTransactionAdapter.createCosignerTransaction(
        userPublicKey,
        manager.walletAddress,
      );

    return this.userResponseAdapter.oneEntityResponse('transaction', {
      transactionXdr,
    });
  }

  async submitAddManagerTransaction(
    { id }: User,
    managerUuid: string,
    transaction: string,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    await this.stellarTransactionAdapter.submitTransaction(transaction);

    const manager = await this.userRepository.getOneByFilter({
      uuid: managerUuid,
    });

    if (!manager) {
      throw new UserNotFoundException({ message: 'Manager not found' });
    }

    if (manager.type !== UserType.WEALTH_MANAGER) {
      throw new IncorrectUserTypeException({
        message: 'Target user is not a Wealth Manager',
      });
    }

    if (!manager.walletAddress) {
      throw new UserWalletNotFoundException({
        message: "Manager doesn't have a connected wallet",
      });
    }

    await this.userRepository.updateOneOrFail(id, {
      walletManager: { id: manager.id } as User,
    });

    return this.userResponseAdapter.oneEntityResponse(
      USER_ENTITY_NAME,
      this.userMapper.fromUserToUserResponseDto(
        await this.userRepository.getOneByFilter({ id }),
      ),
    );
  }

  async getUserPortfolio({
    userAddress,
  }: GetUserPortfolioParamsDto): Promise<
    ManySerializedResponseDto<ProjectResponseDto>
  > {
    const user = await this.userRepository.getOneByFilter({
      walletAddress: userAddress,
    });

    if (!user?.id) {
      return this.userResponseAdapter.manyEntitiesResponse('project', {
        data: [],
        itemCount: 0,
        pageCount: 1,
        pageNumber: 1,
        pageSize: 0,
      });
    }

    const holdings = await this.ownershipService.getOwnershipByUser(user.id);

    if (!holdings.length) {
      return this.userResponseAdapter.manyEntitiesResponse('project', {
        data: [],
        itemCount: 0,
        pageCount: 1,
        pageNumber: 1,
        pageSize: 0,
      });
    }

    const uniqueProjects = await Promise.all(
      holdings.map(async (holding) => {
        const project = await this.projectRepository.getOneByFilter({
          id: holding.projectId,
        });

        return {
          ...(project as any),
          id: holding.projectId,
          seriesId: holding.seriesId,
          tokenSymbol:
            holding.tokenSymbol || (project as any)?.tokenSymbol || undefined,
          assetCode:
            holding.assetCode || (project as any)?.assetCode || undefined,
          assetIssuer:
            holding.assetIssuer || (project as any)?.assetIssuer || undefined,
          purchasedAmount: holding.totalTokens,
          tokenPrice:
            Number(holding.tokenPrice ?? 0) > 0
              ? Number(holding.tokenPrice)
              : (project as any)?.tokenPrice,
          status: holding.projectStatus || (project as any)?.status,
          ownershipSource: holding.ownershipSource,
          settlementStatus: holding.settlementStatus,
          totalValue: holding.totalValue,
        };
      }),
    );

    return this.userResponseAdapter.manyEntitiesResponse('project', {
      data: uniqueProjects.map((project) =>
        this.projectMapper.fromProjectToProjectResponseDto(project),
      ),
      itemCount: uniqueProjects.length,
      pageCount: 1,
      pageNumber: 1,
      pageSize: uniqueProjects.length,
    });
  }
}
