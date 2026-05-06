import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { InvestorVerificationEntity } from '../../../investor-verification/entities/investor-verification.entity';
import { UserEntity } from '../../../iam/user/infrastructure/persistence/entities/user.entity';
import { ProjectEntity } from '../../../project/infrastructure/persistence/entities/project.entity';
import { OrderEntity } from '../../../order/infrastructure/persistence/entities/order.entity';
import { InvestorCustodyAccountEntity } from '../../infrastructure/persistence/entities/investor-custody-account.entity';
import { CustodyTransactionEntity } from '../../infrastructure/persistence/entities/custody-transaction.entity';
import { SystemCustodyAccountEntity } from '../../infrastructure/persistence/entities/system-custody-account.entity';
import {
  CustodyAccountStatus,
  CustodyTransactionStatus,
  CustodyTransactionType,
  SystemCustodyPurpose,
} from '../../infrastructure/persistence/entities/custody.enums';
import { CustodyProviderFactory } from './custody-provider.factory';

@Injectable()
export class CustodyAccountService {
  private readonly logger = new Logger(CustodyAccountService.name);

  constructor(
    @InjectRepository(InvestorCustodyAccountEntity)
    private readonly investorCustodyRepo: Repository<InvestorCustodyAccountEntity>,

    @InjectRepository(CustodyTransactionEntity)
    private readonly custodyTxRepo: Repository<CustodyTransactionEntity>,

    @InjectRepository(SystemCustodyAccountEntity)
    private readonly systemCustodyRepo: Repository<SystemCustodyAccountEntity>,

    @InjectRepository(InvestorVerificationEntity)
    private readonly verificationRepo: Repository<InvestorVerificationEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,

    private readonly providerFactory: CustodyProviderFactory,
  ) {}

  private isApproved(row?: InvestorVerificationEntity | null) {
    return (
      row?.investorEligibilityStatus === 'approved' ||
      (row?.sumsubStatus === 'approved' &&
        row?.adminReviewStatus === 'approved')
    );
  }

  private async findInvestorAccount(
    investorId: number,
    fundId?: number | null,
  ) {
    return this.investorCustodyRepo.findOne({
      where: {
        investorId,
        fundId: fundId ?? IsNull(),
      } as any,
      order: { id: 'DESC' },
    });
  }

  async getInvestorCustodySummary(investorId: string) {
    const investorIdNumber = Number(investorId);
    if (!Number.isFinite(investorIdNumber)) {
      throw new BadRequestException('Invalid investor id');
    }

    const account = await this.findInvestorAccount(investorIdNumber);
    const lastTransaction = await this.custodyTxRepo.findOne({
      where: { investorId: investorIdNumber } as any,
      order: { id: 'DESC' },
    });
    const hasTransactions = await this.hasInvestorCustodyTransactions(
      investorIdNumber,
      account?.fundId,
    );

    return this.toInvestorSummary(account, lastTransaction, hasTransactions);
  }

  async getOrCreateInvestorCustodyAccount(input: {
    investorId: string | number;
    userId?: string | number | null;
    fundId?: string | number | null;
    provider?: string | null;
    mode?: string | null;
    forceRetry?: boolean;
    metadata?: Record<string, any>;
    requireExplicitProvider?: boolean;
  }) {
    const investorId = Number(input.investorId);
    const userId = input.userId == null ? investorId : Number(input.userId);
    const fundId = input.fundId == null ? null : Number(input.fundId);
    const providerName = this.normalizeProvider(
      input.provider,
      input.requireExplicitProvider,
    );
    const setupType = this.normalizeSetupType(input.mode);

    if (!Number.isFinite(investorId)) {
      throw new BadRequestException('Invalid investor id');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } as any });
    if (!user) {
      throw new NotFoundException('Investor user not found');
    }

    const verification = await this.verificationRepo.findOne({
      where: { userId: String(userId) },
    });

    if (!this.isApproved(verification)) {
      throw new BadRequestException('Investor verification is not approved');
    }

    const existing = await this.findInvestorAccount(investorId, fundId);
    if (
      existing &&
      existing.status !== CustodyAccountStatus.FAILED &&
      !input.forceRetry
    ) {
      return this.toInvestorSummary(
        existing,
        await this.getLastTransaction(investorId),
      );
    }

    if (existing) {
      await this.assertProviderCanBeChanged(existing, providerName, setupType);
    }

    if (providerName === 'fireblocks' || providerName === 'zodia') {
      return await this.createPlaceholderInvestorCustodyAccount({
        existing,
        investorId,
        userId,
        fundId,
        providerName,
        setupType,
        metadata: input.metadata,
        forceRetry: input.forceRetry,
      });
    }

    const provider = this.providerFactory.getProvider(providerName);
    const tx = this.custodyTxRepo.create({
      investorId,
      userId,
      fundId,
      custodyProvider: providerName,
      transactionType: input.forceRetry
        ? CustodyTransactionType.MANUAL_ADMIN_RETRY
        : CustodyTransactionType.INVESTOR_ACCOUNT_CREATE,
      status: CustodyTransactionStatus.PENDING,
      metadataJson: {
        legalRegistry: 'FundBase / FB Corp',
        setupType,
        ...input.metadata,
      },
    });
    const savedTx = await this.custodyTxRepo.save(tx);

    try {
      const created = await provider.createInvestorAccount({
        investorId: String(investorId),
        userId: String(userId),
        fundId: fundId == null ? undefined : String(fundId),
      });

      const account =
        existing ??
        this.investorCustodyRepo.create({
          investorId,
          userId,
          fundId,
          metadataJson: {},
        });

      account.custodyProvider = created.custodyProvider;
      account.setupType = setupType;
      account.custodyAccountId = created.custodyAccountId;
      account.publicAddress = created.publicAddress ?? null;
      account.status = created.status ?? CustodyAccountStatus.CREATED;
      account.whitelisted = true;
      account.operational = true;
      account.metadataJson = {
        legalRegistry: 'FundBase / FB Corp',
        operational: true,
        setupType,
        ...(account.metadataJson ?? {}),
        ...input.metadata,
      };

      const savedAccount = await this.investorCustodyRepo.save(account);
      savedTx.status = CustodyTransactionStatus.CONFIRMED;
      savedTx.destinationCustodyAccountId = savedAccount.custodyAccountId;
      savedTx.completedAt = new Date();
      await this.custodyTxRepo.save(savedTx);

      return {
        ...this.toInvestorSummary(savedAccount, savedTx),
        warning: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Custody account setup failed investorId=${investorId}: ${message}`,
      );

      const account =
        existing ??
        this.investorCustodyRepo.create({
          investorId,
          userId,
          fundId,
          custodyProvider: providerName,
          custodyAccountId: `failed:${investorId}:${fundId ?? 'default'}`,
          metadataJson: {},
        });

      account.custodyProvider = providerName;
      account.setupType = setupType;
      account.status = CustodyAccountStatus.FAILED;
      account.whitelisted = false;
      account.operational = false;
      account.metadataJson = {
        legalRegistry: 'FundBase / FB Corp',
        operational: false,
        setupType,
        setupError: message,
        ...(account.metadataJson ?? {}),
        ...input.metadata,
      };
      const savedAccount = await this.investorCustodyRepo.save(account);

      savedTx.status = CustodyTransactionStatus.FAILED;
      savedTx.errorMessage = message;
      await this.custodyTxRepo.save(savedTx);

      return {
        ...this.toInvestorSummary(savedAccount, savedTx),
        warning:
          'Investor approval succeeded, but custody setup failed. Retry custody setup from admin.',
      };
    }
  }

  private normalizeProvider(provider?: string | null, required = false) {
    const normalized = String(provider ?? '')
      .trim()
      .toLowerCase();
    if (!normalized) {
      if (required) {
        throw new BadRequestException('Custody provider is required');
      }
      return this.providerFactory.resolveProvider() ?? 'testnet';
    }

    if (!['testnet', 'fireblocks', 'zodia'].includes(normalized)) {
      throw new BadRequestException('Unsupported custody provider');
    }

    return normalized;
  }

  private normalizeSetupType(mode?: string | null) {
    const normalized = String(mode ?? 'custody_account')
      .trim()
      .toLowerCase();
    if (!['wallet', 'custody_account'].includes(normalized)) {
      throw new BadRequestException('Unsupported custody setup type');
    }
    return normalized;
  }

  private async hasInvestorCustodyTransactions(
    investorId: number,
    fundId?: number | null,
  ) {
    const query = this.custodyTxRepo
      .createQueryBuilder('tx')
      .where('tx.investorId = :investorId', { investorId })
      .andWhere(fundId == null ? 'tx.fundId IS NULL' : 'tx.fundId = :fundId', {
        fundId,
      })
      .andWhere('tx.transactionType NOT IN (:...setupTypes)', {
        setupTypes: [
          CustodyTransactionType.INVESTOR_ACCOUNT_CREATE,
          CustodyTransactionType.MANUAL_ADMIN_RETRY,
        ],
      });

    return (await query.getCount()) > 0;
  }

  private async assertProviderCanBeChanged(
    existing: InvestorCustodyAccountEntity,
    providerName: string,
    setupType: string,
  ) {
    const providerChanged = String(existing.custodyProvider) !== providerName;
    const modeChanged =
      String(existing.setupType ?? 'custody_account') !== setupType;
    if (!providerChanged && !modeChanged) return;

    if (
      await this.hasInvestorCustodyTransactions(
        existing.investorId,
        existing.fundId,
      )
    ) {
      throw new ConflictException(
        'Cannot change custody provider after transactions have been created.',
      );
    }
  }

  private async createPlaceholderInvestorCustodyAccount(input: {
    existing?: InvestorCustodyAccountEntity | null;
    investorId: number;
    userId: number;
    fundId?: number | null;
    providerName: 'fireblocks' | 'zodia' | string;
    setupType: string;
    forceRetry?: boolean;
    metadata?: Record<string, any>;
  }) {
    const providerLabel =
      input.providerName === 'fireblocks' ? 'Fireblocks' : 'Zodia';
    const note = `${providerLabel} integration not connected yet`;
    const custodyAccountId = `pending_${input.providerName}_${input.investorId}`;

    const account =
      input.existing ??
      this.investorCustodyRepo.create({
        investorId: input.investorId,
        userId: input.userId,
        fundId: input.fundId,
        metadataJson: {},
      });

    account.custodyProvider = input.providerName;
    account.setupType = input.setupType;
    account.custodyAccountId = custodyAccountId;
    account.publicAddress = null;
    account.status = CustodyAccountStatus.PENDING_PROVIDER_CONNECTION;
    account.whitelisted = false;
    account.operational = false;
    account.metadataJson = {
      legalRegistry: 'FundBase / FB Corp',
      ...(account.metadataJson ?? {}),
      ...input.metadata,
      operational: false,
      note,
      setupType: input.setupType,
    };

    const savedAccount = await this.investorCustodyRepo.save(account);

    const tx = await this.custodyTxRepo.save(
      this.custodyTxRepo.create({
        investorId: input.investorId,
        userId: input.userId,
        fundId: input.fundId,
        custodyProvider: input.providerName,
        destinationCustodyAccountId: custodyAccountId,
        transactionType: input.forceRetry
          ? CustodyTransactionType.MANUAL_ADMIN_RETRY
          : CustodyTransactionType.INVESTOR_ACCOUNT_CREATE,
        status: CustodyTransactionStatus.SUBMITTED,
        metadataJson: {
          legalRegistry: 'FundBase / FB Corp',
          operational: false,
          note,
          setupType: input.setupType,
          ...input.metadata,
        },
      }),
    );

    return {
      ...this.toInvestorSummary(savedAccount, tx),
      warning: note,
    };
  }

  async createAssetWallet(input: {
    investorId: string;
    assetCode: string;
    issuer?: string;
  }) {
    const account = await this.findInvestorAccount(Number(input.investorId));
    if (!account || !account.whitelisted) {
      throw new BadRequestException(
        'Investor custody account is missing or not whitelisted',
      );
    }

    const provider = this.providerFactory.getProvider(account.custodyProvider);
    const result = await provider.createAssetWallet({
      custodyAccountId: account.custodyAccountId,
      assetCode: input.assetCode,
      issuer: input.issuer,
    });

    const tx = await this.custodyTxRepo.save(
      this.custodyTxRepo.create({
        investorId: account.investorId,
        userId: account.userId,
        fundId: account.fundId,
        destinationCustodyAccountId: account.custodyAccountId,
        custodyProvider: account.custodyProvider,
        providerTransactionId: result.custodyAssetId,
        txHash: result.txHash,
        assetCode: input.assetCode,
        issuer: input.issuer ?? null,
        transactionType: CustodyTransactionType.ASSET_WALLET_CREATE,
        status:
          result.status === 'active'
            ? CustodyTransactionStatus.CONFIRMED
            : CustodyTransactionStatus.SUBMITTED,
        completedAt: result.status === 'active' ? new Date() : null,
        metadataJson: { legalRegistry: 'FundBase / FB Corp' },
      }),
    );

    return { result, transactionId: tx.id };
  }

  async transferAsset(input: {
    sourceAccountId?: string;
    toInvestorId: string | number;
    projectId?: string | number | null;
    orderId?: string | number | null;
    assetCode: string;
    issuer?: string;
    amount: string;
    reference?: string;
    metadata?: Record<string, any>;
  }) {
    const investorAccount = await this.findInvestorAccount(
      Number(input.toInvestorId),
    );
    if (!investorAccount || !investorAccount.whitelisted) {
      await this.markOrderPendingCustody(input.orderId);
      throw new BadRequestException(
        'Investor custody account is pending setup',
      );
    }

    const source =
      input.sourceAccountId ??
      (await this.getSystemDistributionAccount(investorAccount.custodyProvider))
        .custodyAccountId;

    const provider = this.providerFactory.getProvider(
      investorAccount.custodyProvider,
    );
    const result = await provider.transferAsset({
      fromAccountId: source,
      toAccountId: investorAccount.custodyAccountId,
      assetCode: input.assetCode,
      issuer: input.issuer,
      amount: input.amount,
      reference: input.reference,
      metadata: input.metadata,
    });

    const tx = await this.custodyTxRepo.save(
      this.custodyTxRepo.create({
        investorId: investorAccount.investorId,
        userId: investorAccount.userId,
        projectId: input.projectId == null ? null : Number(input.projectId),
        fundId: investorAccount.fundId,
        sourceCustodyAccountId: source,
        destinationCustodyAccountId: investorAccount.custodyAccountId,
        custodyProvider: investorAccount.custodyProvider,
        providerTransactionId: result.providerTransactionId,
        txHash: result.txHash,
        assetCode: input.assetCode,
        issuer: input.issuer ?? null,
        amount: input.amount,
        transactionType: CustodyTransactionType.TOKEN_DISTRIBUTION,
        status: this.normalizeProviderStatus(result.status),
        metadataJson: {
          legalRegistry: 'FundBase / FB Corp',
          projectId: input.projectId ?? null,
          investorId: input.toInvestorId,
          orderId: input.orderId ?? null,
          ...input.metadata,
        },
      }),
    );

    await this.updateOrderCustodyFields(input.orderId, investorAccount, tx);
    return tx;
  }

  async handleFireblocksWebhook(payload: Record<string, any>) {
    /*
     * Fireblocks transaction webhooks are asynchronous and must drive custody
     * transaction lifecycle updates. Signature verification belongs at the
     * controller edge once the exact tenant webhook scheme is configured.
     */
    const providerTransactionId =
      payload.id ??
      payload.transactionId ??
      payload.txId ??
      payload.externalTxId;
    const txHash =
      payload.txHash ?? payload.blockchainTxHash ?? payload.transactionHash;
    const status = this.normalizeProviderStatus(
      payload.status ?? payload.subStatus,
    );

    const tx = providerTransactionId
      ? await this.custodyTxRepo.findOne({
          where: {
            providerTransactionId: String(providerTransactionId),
          } as any,
        })
      : txHash
        ? await this.custodyTxRepo.findOne({
            where: { txHash: String(txHash) } as any,
          })
        : null;

    if (!tx) {
      return { updated: false, reason: 'transaction_not_found' };
    }

    tx.status = status;
    tx.txHash = txHash ? String(txHash) : tx.txHash;
    tx.errorMessage = [
      CustodyTransactionStatus.FAILED,
      CustodyTransactionStatus.REJECTED,
      CustodyTransactionStatus.CANCELLED,
    ].includes(status as CustodyTransactionStatus)
      ? String(
          payload.errorMessage ?? payload.reason ?? payload.subStatus ?? '',
        )
      : tx.errorMessage;
    tx.completedAt =
      status === CustodyTransactionStatus.CONFIRMED
        ? new Date()
        : tx.completedAt;
    tx.metadataJson = {
      ...(tx.metadataJson ?? {}),
      lastWebhookPayload: payload,
    };
    await this.custodyTxRepo.save(tx);

    return { updated: true, transactionId: tx.id, status: tx.status };
  }

  async getLastTransaction(investorId: number) {
    return this.custodyTxRepo.findOne({
      where: { investorId } as any,
      order: { id: 'DESC' },
    });
  }

  private async getSystemDistributionAccount(provider: string) {
    const account = await this.systemCustodyRepo.findOne({
      where: [
        {
          custodyProvider: provider,
          purpose: SystemCustodyPurpose.DISTRIBUTION,
        } as any,
        {
          custodyProvider: provider,
          purpose: SystemCustodyPurpose.TREASURY,
        } as any,
      ],
      order: { id: 'ASC' },
    });

    if (!account) {
      throw new BadRequestException(
        'System distribution/treasury custody account is not configured',
      );
    }

    return account;
  }

  private normalizeProviderStatus(status?: string | null) {
    const normalized = String(status ?? '').toLowerCase();
    if (
      ['completed', 'confirmed', 'success', 'broadcasting'].includes(normalized)
    ) {
      return CustodyTransactionStatus.CONFIRMED;
    }
    if (
      [
        'blocked',
        'pending_authorization',
        'pending_signature',
        'policy_pending',
      ].includes(normalized)
    ) {
      return CustodyTransactionStatus.POLICY_PENDING;
    }
    if (['failed', 'error'].includes(normalized))
      return CustodyTransactionStatus.FAILED;
    if (['rejected'].includes(normalized))
      return CustodyTransactionStatus.REJECTED;
    if (['cancelled', 'canceled'].includes(normalized))
      return CustodyTransactionStatus.CANCELLED;
    if (['submitted', 'pending', 'queued'].includes(normalized))
      return CustodyTransactionStatus.SUBMITTED;
    return CustodyTransactionStatus.PENDING;
  }

  private async markOrderPendingCustody(orderId?: string | number | null) {
    if (orderId == null) return;
    await this.orderRepo.update(Number(orderId), {
      onchainStatus: 'pending_custody_account',
    } as any);
  }

  private async updateOrderCustodyFields(
    orderId: string | number | null | undefined,
    account: InvestorCustodyAccountEntity,
    tx: CustodyTransactionEntity,
  ) {
    if (orderId == null) return;
    await this.orderRepo.update(Number(orderId), {
      investorCustodyAccountId: account.id,
      custodyProvider: account.custodyProvider,
      providerTransactionId: tx.providerTransactionId,
      tokenTransferTxHash: tx.txHash,
      onchainStatus: tx.status,
      onchainError: tx.errorMessage,
    } as any);
  }

  private toInvestorSummary(
    account?: InvestorCustodyAccountEntity | null,
    lastTransaction?: CustodyTransactionEntity | null,
    hasTransactions = false,
  ) {
    return {
      legalRegistry: 'FundBase / FB Corp',
      custodyProvider: account?.custodyProvider ?? null,
      setupType: account?.setupType ?? null,
      custodyAccountId: account?.custodyAccountId ?? null,
      publicAddress: account?.publicAddress ?? null,
      custodyStatus: account?.status ?? null,
      whitelisted: Boolean(account?.whitelisted),
      operational: Boolean(account?.operational),
      createdAt: account?.createdAt ?? null,
      hasTransactions,
      lastTransactionStatus: lastTransaction?.status ?? null,
      lastTxHash: lastTransaction?.txHash ?? null,
      lastProviderTransactionId: lastTransaction?.providerTransactionId ?? null,
      metadata: account?.metadataJson ?? {},
    };
  }
}
