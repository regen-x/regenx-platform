import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  OwnershipEntity,
  OwnershipSettlementStatus,
  OwnershipSource,
} from '../../infrastructure/persistence/entities/ownership.entity';
import { OwnershipTransactionEntity } from '../../infrastructure/persistence/entities/ownership-transaction.entity';
import { ContractService } from '../../../contract/application/service/contract.service';
import { TransactionService } from '../../../transaction/application/service/transaction.service';
import { TRANSACTION_STATUS } from '../../../transaction/domain/transaction-status.enum';
import { TRANSACTION_TYPE } from '../../../transaction/domain/transaction-type.enum';
import {
  PROJECT_REPOSITORY_KEY,
  IProjectRepository,
} from '../../../project/application/repository/project.repository.interface';
import { InvestorVerificationService } from '../../../investor-verification/investor-verification.service';
import { OrderService } from '../../../order/application/service/order.service';

@Injectable()
export class OwnershipService {
  constructor(
    @InjectRepository(OwnershipEntity)
    private readonly ownershipRepo: Repository<OwnershipEntity>,

    @InjectRepository(OwnershipTransactionEntity)
    private readonly txRepo: Repository<OwnershipTransactionEntity>,

    private readonly contractService: ContractService,

    @Inject(PROJECT_REPOSITORY_KEY)
    private readonly projectRepository: IProjectRepository,

    private readonly investorVerificationService: InvestorVerificationService,
    private readonly transactionService: TransactionService,
    private readonly orderService: OrderService,

    private readonly dataSource: DataSource,
  ) {}

  private getOwnershipSource(
    custodyType: 'self_custody' | 'regenx_custody',
  ): OwnershipSource {
    return custodyType === 'self_custody' ? 'ON_CHAIN' : 'INTERNAL_LEDGER';
  }

  private resolveCustodyType(
    custodyType?: 'self_custody' | 'regenx_custody' | null,
  ): 'self_custody' | 'regenx_custody' {
    return custodyType === 'self_custody' ? 'self_custody' : 'regenx_custody';
  }

  private getLegacyTransactionStatus(
    settlementStatus: OwnershipSettlementStatus,
  ): OwnershipTransactionEntity['status'] {
    switch (settlementStatus) {
      case 'SUBMITTED':
        return 'submitted';
      case 'SETTLED':
        return 'confirmed';
      case 'FAILED':
      case 'CANCELLED':
        return 'failed';
      default:
        return 'built';
    }
  }

  private async resolveSellerWalletAddress(input: {
    projectId: number;
    sellerWalletAddress?: string | null;
  }) {
    const project = await this.projectRepository.getOneByFilter({
      id: input.projectId,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const resolvedSellerWallet =
      input.sellerWalletAddress ??
      (project as any).distributorWalletPublic ??
      null;

    const requiresExplicitInventory =
      ['issued', 'live'].includes(String((project as any).status ?? 'draft')) ||
      Boolean((project as any).distributorWalletPublic);

    if (requiresExplicitInventory && !resolvedSellerWallet) {
      throw new BadRequestException(
        'Project distributor inventory wallet is not configured',
      );
    }

    return {
      project,
      sellerWalletAddress: resolvedSellerWallet,
    };
  }

  private async resolveBuyContext(input: {
    projectId: number;
    sellerWalletAddress?: string | null;
  }) {
    const { project, sellerWalletAddress } = await this.resolveSellerWalletAddress(
      input,
    );

    if (String((project as any).status ?? 'draft') !== 'live') {
      throw new BadRequestException('Only live projects can be purchased');
    }

    const assetCode = String(
      (project as any).assetCode ?? (project as any).tokenSymbol ?? '',
    ).trim();
    const assetIssuer = String((project as any).assetIssuer ?? '').trim();
    const distributorWalletPublic = String(
      (project as any).distributorWalletPublic ?? sellerWalletAddress ?? '',
    ).trim();
    const tokenAddress = String((project as any).tokenAddress ?? '').trim();
    const seriesId = Number((project as any).seriesId ?? 0);

    if (!assetCode || !assetIssuer || !distributorWalletPublic) {
      throw new BadRequestException(
        'Project asset metadata is incomplete for purchase',
      );
    }

    return {
      project,
      sellerWalletAddress: distributorWalletPublic,
      assetCode,
      assetIssuer,
      tokenAddress,
      seriesId,
    };
  }

  async getProjectOwnership(projectId: number, seriesId?: number) {
    const where: any = { projectId };
    if (seriesId) where.seriesId = seriesId;

    return this.ownershipRepo.find({
      where,
      order: { id: 'ASC' as any },
    });
  }

  async buyPosition(input: {
    buyerUserId: number;
    projectId: number;
    seriesId: number;
    tokenSymbol: string;
    amount: number;
    cashAmount?: number;
    feeAmount?: number;
    custodyType?: 'self_custody' | 'regenx_custody' | null;
    walletAddress?: string | null;
    custodyAccountRef?: string | null;
    sellerWalletAddress?: string | null;
  }) {
    await this.investorVerificationService.assertInvestorCanInvest(
      String(input.buyerUserId),
    );

    await this.resolveBuyContext({
      projectId: input.projectId,
      sellerWalletAddress: input.sellerWalletAddress,
    });

    const custodyType = this.resolveCustodyType(input.custodyType);
    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (custodyType === 'self_custody') {
      throw new BadRequestException(
        'Investor self custody is not enabled in the current product flow.',
      );
    }

    const { project, sellerWalletAddress, assetCode, seriesId } =
      await this.resolveBuyContext({
        projectId: input.projectId,
        sellerWalletAddress: input.sellerWalletAddress,
      });

    const order = await this.orderService.createPendingSignatureOrder({
      userId: input.buyerUserId,
      projectId: input.projectId,
      projectName: String((project as any)?.name ?? `Project ${input.projectId}`),
      tokenSymbol: input.tokenSymbol || assetCode,
      orderType: 'BUY',
      currencyAmount: Number(input.cashAmount ?? 0),
      tokenAmount: amount,
    });

    await this.orderService.markSubmitted(order.id, input.buyerUserId);

    const txRecord = this.txRepo.create({
      userId: input.buyerUserId,
      projectId: input.projectId,
      seriesId: input.seriesId || seriesId,
      tokenSymbol: input.tokenSymbol || assetCode,
      amount,
      custodyType,
      ownershipSource: this.getOwnershipSource(custodyType),
      buyerWalletAddress: input.walletAddress ?? null,
      sellerWalletAddress,
      signedXdr: null,
      txHash: null,
      settlementStatus: 'SETTLED',
      status: this.getLegacyTransactionStatus('SETTLED'),
      failureReason: null,
    });

    await this.txRepo.save(txRecord);

    await this.orderService.markSettling({
      orderId: order.id,
      userId: input.buyerUserId,
      txHash: null,
      reference: order.reference ?? null,
    });

    const ledger = await this.applyLedgerTransferTransactional({
      buyerUserId: input.buyerUserId,
      projectId: input.projectId,
      seriesId: input.seriesId || seriesId,
      tokenSymbol: input.tokenSymbol || assetCode,
      amount,
      custodyType,
      walletAddress: null,
      custodyAccountRef: input.custodyAccountRef ?? null,
      sellerWalletAddress,
    });

    const completedAt = new Date();
    const cashAmount = Number(input.cashAmount ?? 0);
    const feeAmount = Number(input.feeAmount ?? 0);
    let resultingTransactionId: number | null = null;

    if (Number.isFinite(cashAmount) && cashAmount > 0) {
      const createdBuyTx = await this.transactionService.createTransaction({
        userId: input.buyerUserId,
        projectId: input.projectId,
        amount: cashAmount,
        tokenAmount: amount,
        currency: 'AUD',
        type: TRANSACTION_TYPE.BUY,
        status: TRANSACTION_STATUS.COMPLETED,
        reference: order.reference ?? null,
        description: `Primary investment into ${(project as any).name ?? 'project'}`,
        settledAt: completedAt,
      });

      resultingTransactionId = Number((createdBuyTx as any)?.data?.id ?? 0) || null;
    }

    if (Number.isFinite(feeAmount) && feeAmount > 0) {
      await this.transactionService.createTransaction({
        userId: input.buyerUserId,
        projectId: input.projectId,
        amount: feeAmount,
        currency: 'AUD',
        type: TRANSACTION_TYPE.FEE,
        status: TRANSACTION_STATUS.COMPLETED,
        reference: order.reference ?? null,
        description: `RegenX transaction fee for ${(project as any).name ?? 'project'}`,
        settledAt: completedAt,
      });
    }

    const completedOrder = await this.orderService.markCompleted({
      orderId: order.id,
      userId: input.buyerUserId,
      txHash: null,
      reference: order.reference ?? null,
      resultingTransactionId,
      settledAt: completedAt,
    });

    return {
      success: true,
      custodyType,
      order: completedOrder,
      txHash: null,
      ...ledger,
    };
  }

  async buildBuyTransaction(input: {
    buyerUserId: number;
    projectId: number;
    seriesId: number;
    tokenSymbol: string;
    amount: number;
    cashAmount?: number;
    feeAmount?: number;
    orderId?: number;
    custodyType?: 'self_custody' | 'regenx_custody' | null;
    walletAddress?: string | null;
    sellerWalletAddress?: string | null;
  }) {
    await this.investorVerificationService.assertInvestorCanInvest(
      String(input.buyerUserId),
    );

    const { project, sellerWalletAddress, tokenAddress, assetCode } =
      await this.resolveBuyContext({
      projectId: input.projectId,
      sellerWalletAddress: input.sellerWalletAddress,
    });

    const custodyType = this.resolveCustodyType(input.custodyType);

    if (custodyType !== 'self_custody') {
      throw new BadRequestException('Only self custody uses transaction build');
    }

    if (!input.walletAddress) {
      throw new BadRequestException('Wallet required');
    }

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (!tokenAddress) {
      throw new BadRequestException('Project token address is not configured');
    }

    const res = await this.contractService.buildTransferTransaction(
      tokenAddress,
      input.walletAddress,
      amount,
    );

    const order = await this.orderService.createPendingSignatureOrder({
      userId: input.buyerUserId,
      projectId: input.projectId,
      projectName: String((project as any)?.name ?? `Project ${input.projectId}`),
      tokenSymbol: input.tokenSymbol || assetCode,
      orderType: 'BUY',
      currencyAmount: Number(input.cashAmount ?? 0),
      tokenAmount: amount,
    });

    return {
      success: true,
      unsignedXdr:
        (res as any)?.data?.transactionXdr ??
        (res as any)?.data?.attributes?.transactionXdr,
      orderId: order.id,
      order,
      sellerPositionId: null,
      sellerWalletAddress,
    };
  }

  async submitBuyTransaction(input: {
    buyerUserId: number;
    projectId: number;
    seriesId: number;
    tokenSymbol: string;
    amount: number;
    cashAmount?: number;
    feeAmount?: number;
    orderId?: number;
    custodyType?: 'self_custody' | 'regenx_custody' | null;
    walletAddress?: string | null;
    sellerWalletAddress?: string | null;
    signedXdr: string;
  }) {
    await this.investorVerificationService.assertInvestorCanInvest(
      String(input.buyerUserId),
    );

    const { project, sellerWalletAddress, assetCode, seriesId } =
      await this.resolveBuyContext({
        projectId: input.projectId,
        sellerWalletAddress: input.sellerWalletAddress,
      });

    const custodyType = this.resolveCustodyType(input.custodyType);

    if (custodyType !== 'self_custody') {
      throw new BadRequestException('Invalid flow');
    }

    if (!input.walletAddress) {
      throw new BadRequestException('Wallet required');
    }

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const resolvedOrderId =
      input.orderId ??
      (
        await this.orderService.createPendingSignatureOrder({
          userId: input.buyerUserId,
          projectId: input.projectId,
          projectName: String((project as any)?.name ?? `Project ${input.projectId}`),
          tokenSymbol: input.tokenSymbol || assetCode,
          orderType: 'BUY',
          currencyAmount: Number(input.cashAmount ?? 0),
          tokenAmount: amount,
        })
      ).id;

    await this.orderService.markSubmitted(resolvedOrderId, input.buyerUserId);

    const existingSubmission = await this.txRepo.findOne({
      where: {
        userId: input.buyerUserId,
        projectId: input.projectId,
        seriesId: input.seriesId || seriesId,
        tokenSymbol: input.tokenSymbol || assetCode,
        signedXdr: input.signedXdr,
      } as any,
      order: { id: 'DESC' as any },
    });

    if (
      existingSubmission &&
      ['SUBMITTED', 'SETTLED'].includes(existingSubmission.settlementStatus)
    ) {
      throw new BadRequestException(
        'This signed transaction has already been submitted',
      );
    }

    const txRecord = this.txRepo.create({
      userId: input.buyerUserId,
      projectId: input.projectId,
      seriesId: input.seriesId || seriesId,
      tokenSymbol: input.tokenSymbol || assetCode,
      amount,
      custodyType,
      ownershipSource: this.getOwnershipSource(custodyType),
      buyerWalletAddress: input.walletAddress ?? null,
      sellerWalletAddress,
      signedXdr: input.signedXdr,
      txHash: null,
      settlementStatus: 'SUBMITTED',
      status: this.getLegacyTransactionStatus('SUBMITTED'),
      failureReason: null,
    });

    await this.txRepo.save(txRecord);

    try {
      const tx = await this.contractService.submitTransferTransaction({
        signedXdr: input.signedXdr,
        projectUuid: (project as any).uuid,
        amount,
        buyerAddress: input.walletAddress,
      });

      txRecord.txHash =
        (tx as any)?.txHash ??
        (tx as any)?.hash ??
        (tx as any)?.data?.txHash ??
        null;
      await this.orderService.markSettling({
        orderId: resolvedOrderId,
        userId: input.buyerUserId,
        txHash: txRecord.txHash,
        reference: txRecord.txHash,
      });

      const ledger = await this.applyLedgerTransferTransactional({
        buyerUserId: input.buyerUserId,
        projectId: input.projectId,
        seriesId: input.seriesId || seriesId,
        tokenSymbol: input.tokenSymbol || assetCode,
        amount,
        custodyType,
        walletAddress: input.walletAddress ?? null,
        custodyAccountRef: null,
        sellerWalletAddress,
      });

      const completedAt = new Date();
      const cashAmount = Number(input.cashAmount ?? 0);
      const feeAmount = Number(input.feeAmount ?? 0);
      let resultingTransactionId: number | null = null;

      if (Number.isFinite(cashAmount) && cashAmount > 0) {
        const createdBuyTx = await this.transactionService.createTransaction({
          userId: input.buyerUserId,
          projectId: input.projectId,
          amount: cashAmount,
          tokenAmount: amount,
          currency: 'AUD',
          type: TRANSACTION_TYPE.BUY,
          status: TRANSACTION_STATUS.COMPLETED,
          reference: txRecord.txHash,
          description: `Primary investment into ${(project as any).name ?? 'project'}`,
          settledAt: completedAt,
        });

        resultingTransactionId = Number((createdBuyTx as any)?.data?.id ?? 0) || null;
      }

      if (Number.isFinite(feeAmount) && feeAmount > 0) {
        await this.transactionService.createTransaction({
          userId: input.buyerUserId,
          projectId: input.projectId,
          amount: feeAmount,
          currency: 'AUD',
          type: TRANSACTION_TYPE.FEE,
          status: TRANSACTION_STATUS.COMPLETED,
          reference: txRecord.txHash,
          description: `RegenX transaction fee for ${(project as any).name ?? 'project'}`,
          settledAt: completedAt,
        });
      }

      txRecord.settlementStatus = 'SETTLED';
      txRecord.status = this.getLegacyTransactionStatus('SETTLED');
      await this.txRepo.save(txRecord);

      const completedOrder = await this.orderService.markCompleted({
        orderId: resolvedOrderId,
        userId: input.buyerUserId,
        txHash: txRecord.txHash,
        reference: txRecord.txHash,
        resultingTransactionId,
        settledAt: completedAt,
      });

      return {
        success: true,
        tx,
        txHash: txRecord.txHash,
        order: completedOrder,
        ...ledger,
      };
    } catch (error: any) {
      txRecord.settlementStatus = 'FAILED';
      txRecord.status = this.getLegacyTransactionStatus('FAILED');
      txRecord.failureReason = error?.message ?? 'Unknown error';
      await this.txRepo.save(txRecord);
      await this.orderService.markFailed({
        orderId: resolvedOrderId,
        userId: input.buyerUserId,
        reason: error?.message ?? 'Unknown error',
        txHash: txRecord.txHash,
      });
      throw error;
    }
  }

  private async applyLedgerTransferTransactional(input: {
    buyerUserId: number;
    projectId: number;
    seriesId: number;
    tokenSymbol: string;
    amount: number;
    custodyType: 'self_custody' | 'regenx_custody';
    walletAddress?: string | null;
    custodyAccountRef?: string | null;
    sellerWalletAddress?: string | null;
  }) {
    const amount = Number(input.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Ownership transfer amount must be greater than zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OwnershipEntity);

      let seller: OwnershipEntity | null = null;

      if (input.sellerWalletAddress) {
        seller = await repo
          .createQueryBuilder('ownership')
          .setLock('pessimistic_write')
          .where('ownership.project_id = :projectId', {
            projectId: input.projectId,
          })
          .andWhere('ownership.series_id = :seriesId', {
            seriesId: input.seriesId,
          })
          .andWhere('ownership.token_symbol = :tokenSymbol', {
            tokenSymbol: input.tokenSymbol,
          })
          .andWhere('ownership.status = :status', { status: 'active' })
          .andWhere('ownership.settlement_status = :settlementStatus', {
            settlementStatus: 'SETTLED',
          })
          .andWhere('ownership.wallet_address = :walletAddress', {
            walletAddress: input.sellerWalletAddress,
          })
          .orderBy('ownership.id', 'ASC')
          .getOne();

        if (!seller) {
          throw new NotFoundException('Seller not found');
        }

        if (Number(seller.amount) < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        seller.amount = Number(seller.amount) - amount;
        if (Number(seller.amount) < 0) {
          throw new BadRequestException('Ownership cannot go negative');
        }
        if (Number(seller.amount) === 0) {
          seller.status = 'inactive';
        }
        seller.updatedAt = new Date();
        await repo.save(seller);
      }

      const buyerWhere: any = {
        userId: input.buyerUserId,
        projectId: input.projectId,
        seriesId: input.seriesId,
        tokenSymbol: input.tokenSymbol,
        custodyType: input.custodyType,
        status: 'active',
      };

      if (input.walletAddress) buyerWhere.walletAddress = input.walletAddress;
      if (input.custodyAccountRef) {
        buyerWhere.custodyAccountRef = input.custodyAccountRef;
      }

      let buyer = await repo
        .createQueryBuilder('ownership')
        .setLock('pessimistic_write')
        .where('ownership.user_id = :userId', {
          userId: input.buyerUserId,
        })
        .andWhere('ownership.project_id = :projectId', {
          projectId: input.projectId,
        })
        .andWhere('ownership.series_id = :seriesId', {
          seriesId: input.seriesId,
        })
        .andWhere('ownership.token_symbol = :tokenSymbol', {
          tokenSymbol: input.tokenSymbol,
        })
        .andWhere('ownership.custody_type = :custodyType', {
          custodyType: input.custodyType,
        })
        .andWhere('ownership.status = :status', { status: 'active' })
        .andWhere(
          input.walletAddress
            ? 'ownership.wallet_address = :walletAddress'
            : 'ownership.wallet_address IS NULL',
          {
            walletAddress: input.walletAddress ?? undefined,
          },
        )
        .andWhere(
          input.custodyAccountRef
            ? 'ownership.custody_account_ref = :custodyAccountRef'
            : 'ownership.custody_account_ref IS NULL',
          {
            custodyAccountRef: input.custodyAccountRef ?? undefined,
          },
        )
        .getOne();

      if (!buyer) {
        buyer = repo.create({
          userId: input.buyerUserId,
          projectId: input.projectId,
          seriesId: input.seriesId,
          tokenSymbol: input.tokenSymbol,
          amount: 0,
          custodyType: input.custodyType,
          ownershipSource: this.getOwnershipSource(input.custodyType),
          settlementStatus: 'SETTLED',
          walletAddress: input.walletAddress ?? null,
          custodyAccountRef: input.custodyAccountRef ?? null,
          status: 'active',
        });
      }

      buyer.amount = Number(buyer.amount) + amount;
      buyer.ownershipSource = this.getOwnershipSource(input.custodyType);
      buyer.settlementStatus = 'SETTLED';
      buyer.updatedAt = new Date();
      const savedBuyer = await repo.save(buyer);

      return {
        sellerPositionId: seller?.id ?? null,
        buyerPositionId: savedBuyer.id,
        custodyType: input.custodyType,
      };
    });
  }

  async getOwnershipByUser(userId: number) {
    const rows = await this.ownershipRepo
      .createQueryBuilder('o')
      .leftJoin('project', 'p', 'p.id = o.project_id')
      .select('o.project_id', 'projectId')
      .addSelect('o.series_id', 'seriesId')
      .addSelect('o.token_symbol', 'tokenSymbol')
      .addSelect('o.custody_type', 'custodyType')
      .addSelect('o.ownership_source', 'ownershipSource')
      .addSelect('o.settlement_status', 'settlementStatus')
      .addSelect('SUM(o.amount)', 'totalTokens')
      .addSelect(
        'SUM(CASE WHEN COALESCE(p.token_price, 0) > 0 THEN o.amount * p.token_price ELSE 0 END)',
        'totalValue',
      )
      .addSelect('MAX(COALESCE(p.token_price, 0))', 'tokenPrice')
      .addSelect('COALESCE(p.name, CONCAT(\'Project \', o.project_id))', 'projectName')
      .addSelect('COALESCE(p.asset_code, p.token_symbol)', 'assetCode')
      .addSelect('p.asset_issuer', 'assetIssuer')
      .addSelect('p.status', 'projectStatus')
      .where('o.user_id = :userId', { userId })
      .andWhere('o.status = :status', { status: 'active' })
      .andWhere('o.settlement_status = :settlementStatus', {
        settlementStatus: 'SETTLED',
      })
      .groupBy('o.project_id')
      .addGroupBy('o.series_id')
      .addGroupBy('o.token_symbol')
      .addGroupBy('o.custody_type')
      .addGroupBy('o.ownership_source')
      .addGroupBy('o.settlement_status')
      .addGroupBy('p.name')
      .addGroupBy('p.asset_code')
      .addGroupBy('p.token_symbol')
      .addGroupBy('p.asset_issuer')
      .addGroupBy('p.status')
      .orderBy('o.project_id', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      projectId: Number(row.projectId),
      seriesId: Number(row.seriesId),
      projectName: row.projectName,
      tokenSymbol: row.tokenSymbol,
      assetCode: row.assetCode ?? null,
      assetIssuer: row.assetIssuer ?? null,
      projectStatus: row.projectStatus ?? null,
      custodyType: row.custodyType,
      ownershipSource: row.ownershipSource,
      settlementStatus: row.settlementStatus,
      totalTokens: Number(row.totalTokens),
      totalValue: Number(row.totalValue),
      tokenPrice: Number(row.tokenPrice ?? 0),
    }));
  }
}
