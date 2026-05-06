import { Asset } from '@stellar/stellar-sdk';
import { StellarPaymentAdapter } from '../../../../common/infrastructure/stellar/stellar.payment.adapter';
import { SubmitXlmPaymentTransactionDto } from '../dto/submit-xlm-payment-transaction.dto';
import { Injectable } from '@nestjs/common';
import { ContractResponseAdapter } from '../adapter/contract-response.adapter';
import { SorobanContractAdapter } from '../../../../common/infrastructure/stellar/soroban.contract.adapter';
import { StellarAccountAdapter } from '../../../../common/infrastructure/stellar/stellar.account.adapter';
import { StellarTransactionAdapter } from '../../../../common/infrastructure/stellar/stellar.transaction.adapter';
import { ConfigService } from '@nestjs/config';
import { OneSerializedResponseDto } from '../../../../common/application/dto/one-serialized-response.dto';
import { BuildTransactionResponseDto } from '../../../../common/infrastructure/stellar/dto/build-transaction-response.dto';
import { TransactionService } from '../../../transaction/application/service/transaction.service';
import { TRANSACTION_TYPE } from '../../../transaction/domain/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../../transaction/domain/transaction-status.enum';
import { SubmitTransferTransactionDto } from '../dto/submit-transfer-transaction.dto';
import { Inject } from '@nestjs/common';
import { PROJECT_REPOSITORY_KEY } from '../../../project/application/repository/project.repository.interface';
import { IProjectRepository } from '../../../project/application/repository/project.repository.interface';
import { TransactionResponseDto } from '../../../transaction/application/dto/transaction-response.dto';
import { ProjectNotFoundException } from '../../../project/infrastructure/database/exception/project-not-found.exception';
import { IUserRepository } from '../../../iam/user/application/repository/user.repository.interface';
import { USER_REPOSITORY_KEY } from '../../../iam/user/application/repository/user.repository.interface';
import { UserNotFoundException } from '../../../iam/user/infrastructure/database/exception/user-not-found.exception';

@Injectable()
export class ContractService {
  private readonly distributorPublicKey: string;
  private readonly distributorSecretKey: string;

  constructor(
    private readonly stellarPaymentService: StellarPaymentAdapter,
    private readonly environmentConfig: ConfigService,
    private readonly contractResponseAdapter: ContractResponseAdapter,
    private readonly contractAdapter: SorobanContractAdapter,
    private readonly stellarAccountService: StellarAccountAdapter,
    private readonly stellarTransactionService: StellarTransactionAdapter,
    private readonly transactionService: TransactionService,
    @Inject(PROJECT_REPOSITORY_KEY)
    private readonly projectRepository: IProjectRepository,
    @Inject(USER_REPOSITORY_KEY)
    private readonly userRepository: IUserRepository,
  ) {
    this.distributorPublicKey = this.environmentConfig.get(
      'stellar.distributorPublicKey',
    );
    this.distributorSecretKey = this.environmentConfig.get(
      'stellar.distributorSecretKey',
    );
  }

  async issueToken(
    ownerAddress: string,
    tokenAddress: string,
    price: number,
    supply: number,
  ): Promise<void> {
    const distributorAccount = await this.stellarAccountService.getAccount(
      this.distributorPublicKey,
    );

    const distributorKeypair = this.stellarAccountService.getKeypair(
      this.distributorSecretKey,
    );

    const transaction = await this.contractAdapter.issueToken(
      distributorAccount,
      distributorKeypair,
      tokenAddress,
      price,
      supply,
      ownerAddress,
    );

    await this.stellarTransactionService.submitSorobanTransaction(transaction);
  }

  async buildTransferTransaction(
    tokenAddress: string,
    investorAddress: string,
    amount: number,
  ): Promise<OneSerializedResponseDto<BuildTransactionResponseDto>> {
    const investorAccount =
      await this.stellarAccountService.getAccount(investorAddress);

    const transactionXdr =
      await this.contractAdapter.buildTransferTokenTransaction(
        investorAccount,
        investorAddress,
        tokenAddress,
        amount,
      );

    return this.contractResponseAdapter.oneEntityResponse('transaction', {
      transactionXdr,
    });
  }

  async buildXlmPaymentTransaction(
    investorAddress: string,
    amount: number,
  ): Promise<OneSerializedResponseDto<BuildTransactionResponseDto>> {
    const investorAccount =
      await this.stellarAccountService.getAccount(investorAddress);

    const paymentOperation = this.stellarPaymentService.buildPaymentOperation(
      this.distributorPublicKey,
      Asset.native(),
      String(amount),
    );

    const transactionXdr = await this.stellarTransactionService.buildTransaction(
      investorAccount,
      [paymentOperation],
    );

    return this.contractResponseAdapter.oneEntityResponse('transaction', {
      transactionXdr,
    });
  }

  async submitTransferTransaction({
    signedXdr,
    projectUuid,
    amount,
    buyerAddress,
  }: SubmitTransferTransactionDto): Promise<
    OneSerializedResponseDto<TransactionResponseDto>
  > {
    const buyer = await this.userRepository.getOneByFilter({
      walletAddress: buyerAddress,
    });

    if (!buyer) {
      throw new UserNotFoundException({
        message: `User with ${buyerAddress} not found`,
      });
    }

    const project = await this.projectRepository.getOneByFilter({
      uuid: projectUuid,
    });

    if (!project) {
      throw new ProjectNotFoundException({
        message: `Project with ${projectUuid} not found`,
      });
    }

    const tx = await this.stellarTransactionService.submitSorobanTransaction(signedXdr);

    const tokenAmount = Number(amount);
    const cashAmount =
      Number(project.tokenPrice ?? 0) > 0
        ? tokenAmount * Number(project.tokenPrice)
        : tokenAmount;

    const created = await this.transactionService.createTransaction({
      userId: buyer.id,
      projectId: project.id,
      amount: cashAmount,
      tokenAmount,
      currency: 'AUD',
      type: TRANSACTION_TYPE.BUY,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: (tx as any)?.hash ?? null,
      description: `Legacy contract purchase into ${project.name ?? 'project'}`,
      settledAt: new Date(),
    });

    return {
      ...(created as any),
      txHash: (tx as any)?.hash ?? null,
    } as any;
  }


  async submitXlmPaymentTransaction({
    signedXdr,
    projectUuid,
    amount,
    buyerAddress,
  }: SubmitXlmPaymentTransactionDto): Promise<
    OneSerializedResponseDto<TransactionResponseDto>
  > {
    const buyer = await this.userRepository.getOneByFilter({
      walletAddress: buyerAddress,
    });

    if (!buyer) {
      throw new UserNotFoundException({
        message: `User with ${buyerAddress} not found`,
      });
    }

    const project = await this.projectRepository.getOneByFilter({
      uuid: projectUuid,
    });

    if (!project) {
      throw new ProjectNotFoundException({
        message: `Project with ${projectUuid} not found`,
      });
    }

    await this.stellarTransactionService.submitTransaction(signedXdr);

    const tokenAmount = Number(amount);
    const cashAmount =
      Number(project.tokenPrice ?? 0) > 0
        ? tokenAmount * Number(project.tokenPrice)
        : tokenAmount;

    return await this.transactionService.createTransaction({
      userId: buyer.id,
      projectId: project.id,
      amount: cashAmount,
      tokenAmount,
      currency: 'AUD',
      type: TRANSACTION_TYPE.BUY,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Legacy XLM payment purchase into ${project.name ?? 'project'}`,
      settledAt: new Date(),
    });
  }

}
