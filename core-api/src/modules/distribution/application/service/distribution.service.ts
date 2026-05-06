import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DistributionCustodyScope,
  DistributionEventEntity,
  DistributionPayoutRail,
} from '../../infrastructure/persistence/entities/distribution-event.entity';
import { DistributionEntitlementEntity } from '../../infrastructure/persistence/entities/distribution-entitlement.entity';
import { DistributionPayoutEntity } from '../../infrastructure/persistence/entities/distribution-payout.entity';
import {
  DistributionRecordEntity,
  DistributionRecordStatus,
} from '../../infrastructure/persistence/entities/distribution-record.entity';
import { NotificationService } from '../../../notification/application/service/notification.service';
import { NotificationType } from '../../../notification/infrastructure/persistence/entities/notification.entity';
import { OwnershipEntity } from '../../../ownership/infrastructure/persistence/entities/ownership.entity';
import { ProjectEntity } from '../../../project/infrastructure/persistence/entities/project.entity';
import { TransactionEntity } from '../../../transaction/infrastructure/persistence/entities/transaction.entity';
import { TRANSACTION_STATUS } from '../../../transaction/domain/transaction-status.enum';
import { TRANSACTION_TYPE } from '../../../transaction/domain/transaction-type.enum';

@Injectable()
export class DistributionService {
  constructor(
    @InjectRepository(DistributionEventEntity)
    private readonly eventRepo: Repository<DistributionEventEntity>,

    @InjectRepository(DistributionEntitlementEntity)
    private readonly entitlementRepo: Repository<DistributionEntitlementEntity>,

    @InjectRepository(DistributionPayoutEntity)
    private readonly payoutRepo: Repository<DistributionPayoutEntity>,

    @InjectRepository(DistributionRecordEntity)
    private readonly recordRepo: Repository<DistributionRecordEntity>,

    @InjectRepository(OwnershipEntity)
    private readonly ownershipRepo: Repository<OwnershipEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,

    private readonly notificationService: NotificationService,
  ) {}

  private toNumber(value: unknown) {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
  }

  private resolveNetAmount(input: {
    cashInflowAmount?: number | null;
    grossAmount?: number | null;
    feeAmount?: number | null;
    netAmount?: number | null;
  }) {
    if (input.netAmount != null && Number.isFinite(Number(input.netAmount))) {
      return this.toNumber(input.netAmount);
    }

    const gross =
      input.grossAmount != null
        ? this.toNumber(input.grossAmount)
        : this.toNumber(input.cashInflowAmount);
    const fee = this.toNumber(input.feeAmount);
    return Math.max(gross - fee, 0);
  }

  private mapEvent(event: DistributionEventEntity) {
    return {
      ...event,
      cashInflowAmount: this.toNumber(event.cashInflowAmount),
      grossAmount: this.toNumber(event.grossAmount),
      feeAmount: this.toNumber(event.feeAmount),
      netAmount: this.toNumber(event.netAmount),
    };
  }

  private mapRecord(
    record: DistributionRecordEntity & {
      projectName?: string;
      tokenSymbol?: string;
    },
  ) {
    return {
      id: record.id,
      uuid: record.uuid,
      projectId: record.projectId,
      userId: record.userId,
      ownershipId: record.ownershipId ?? null,
      type: record.type,
      grossAmount: this.toNumber(record.grossAmount),
      feeAmount:
        record.feeAmount == null ? null : this.toNumber(record.feeAmount),
      netAmount: this.toNumber(record.netAmount),
      currency: record.currency,
      periodStart: record.periodStart ?? null,
      periodEnd: record.periodEnd ?? null,
      distributionDate: record.distributionDate ?? null,
      status: record.status,
      reference: record.reference ?? null,
      notes: record.notes ?? null,
      createdAt: String(record.createdAt ?? ''),
      projectName: record.projectName ?? null,
      tokenSymbol: record.tokenSymbol ?? null,
    };
  }

  private resolveDistributionCurrency(event: DistributionEventEntity) {
    if (event.payoutRail === 'AUDD') return 'AUDD';
    return 'AUD';
  }

  private resolveDistributionStatus(
    payout: DistributionPayoutEntity,
    event: DistributionEventEntity,
  ): DistributionRecordStatus {
    if (payout.status === 'SETTLED') return 'PAID';
    if (payout.status === 'FAILED' || payout.status === 'CANCELLED') {
      return 'FAILED';
    }

    const payableAt = event.payableDate ? new Date(event.payableDate) : null;
    if (payableAt && !Number.isNaN(payableAt.getTime()) && payableAt > new Date()) {
      return 'SCHEDULED';
    }

    return 'PENDING';
  }

  private async syncRecordsForEvent(
    event: DistributionEventEntity,
    entitlements: DistributionEntitlementEntity[],
    payouts: DistributionPayoutEntity[],
  ) {
    if (!entitlements.length) {
      await this.recordRepo.delete({ eventId: event.id } as any);
      return;
    }

    const payoutByEntitlement = new Map<number, DistributionPayoutEntity>();
    for (const payout of payouts) {
      payoutByEntitlement.set(Number(payout.entitlementId), payout);
    }

    const existing = await this.recordRepo.find({
      where: { eventId: event.id } as any,
    });
    const existingByOwnership = new Map<number, DistributionRecordEntity>();
    for (const record of existing) {
      if (record.ownershipId != null) {
        existingByOwnership.set(Number(record.ownershipId), record);
      }
    }
    const activeOwnershipIds = new Set<number>();

    const rowsToSave: DistributionRecordEntity[] = [];
    const shouldNotifyPaidByOwnershipId = new Set<number>();

    for (const entitlement of entitlements) {
      if (entitlement.userId == null) {
        continue;
      }

      if (this.toNumber(entitlement.netAmount) <= 0) {
        continue;
      }

      const payout = payoutByEntitlement.get(Number(entitlement.id));
      activeOwnershipIds.add(Number(entitlement.ownershipId));
      const record =
        existingByOwnership.get(Number(entitlement.ownershipId)) ??
        this.recordRepo.create();
      const previousStatus = record.status ?? null;

      record.projectId = event.projectId;
      record.userId = Number(entitlement.userId);
      record.ownershipId = entitlement.ownershipId ?? null;
      record.eventId = event.id;
      record.payoutId = payout?.id ?? null;
      record.type = 'DISTRIBUTION';
      record.grossAmount = this.toNumber(entitlement.grossAmount);
      record.feeAmount = this.toNumber(entitlement.feeAmount);
      record.netAmount = this.toNumber(entitlement.netAmount);
      record.currency = this.resolveDistributionCurrency(event);
      record.periodStart = event.recordDate ?? null;
      record.periodEnd = event.payableDate ?? event.recordDate ?? null;
      record.distributionDate = event.payableDate ?? event.recordDate ?? null;
      record.status = payout
        ? this.resolveDistributionStatus(payout, event)
        : 'PENDING';
      record.reference =
        payout?.txHash ??
        payout?.externalReference ??
        event.sourceReference ??
        null;
      record.notes = event.notes ?? null;

      rowsToSave.push(record);

      if (previousStatus !== 'PAID' && record.status === 'PAID') {
        shouldNotifyPaidByOwnershipId.add(Number(entitlement.ownershipId));
      }
    }

    const savedRows = await this.recordRepo.save(rowsToSave);

    for (const savedRecord of savedRows) {
      if (
        savedRecord.ownershipId != null &&
        shouldNotifyPaidByOwnershipId.has(Number(savedRecord.ownershipId))
      ) {
        await this.notificationService.createNotification(
          Number(savedRecord.userId),
          NotificationType.DISTRIBUTION_PAID,
          'Distribution paid',
          'A distribution has been paid on one of your holdings.',
          'distribution',
          Number(savedRecord.id),
        );
      }
    }

    const staleRecordIds = existing
      .filter(
        (record) =>
          record.ownershipId != null &&
          !activeOwnershipIds.has(Number(record.ownershipId)),
      )
      .map((record) => Number(record.id));

    if (staleRecordIds.length > 0) {
      await this.recordRepo.delete(staleRecordIds);
    }
  }

  private async ensureDistributionLedgerBackfilled() {
    const events = await this.eventRepo.find({
      where: [{ status: 'CALCULATED' } as any, { status: 'COMPLETED' } as any],
      order: { id: 'ASC' as any },
    });

    for (const event of events) {
      const existingCount = await this.recordRepo.count({
        where: { eventId: event.id } as any,
      });

      if (existingCount > 0) {
        continue;
      }

      const entitlements = await this.entitlementRepo.find({
        where: { eventId: event.id } as any,
      });
      const payouts = await this.payoutRepo.find({
        where: { eventId: event.id } as any,
      });

      await this.syncRecordsForEvent(event, entitlements, payouts);
    }
  }

  private async getInvestedCapitalByProject(userId: number) {
    const rows = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('tx.project_id', 'projectId')
      .addSelect('SUM(tx.amount)', 'investedCapital')
      .where('tx.user_id = :userId', { userId })
      .andWhere('tx.type = :type', { type: TRANSACTION_TYPE.BUY })
      .andWhere('tx.status = :status', { status: TRANSACTION_STATUS.COMPLETED })
      .groupBy('tx.project_id')
      .getRawMany();

    const map = new Map<number, number>();
    for (const row of rows) {
      map.set(Number(row.projectId), this.toNumber(row.investedCapital));
    }
    return map;
  }

  private async getPortfolioEstimatedValue(userId: number) {
    const row = await this.ownershipRepo
      .createQueryBuilder('o')
      .leftJoin(ProjectEntity, 'p', 'p.id = o.project_id')
      .select(
        'SUM(CASE WHEN COALESCE(p.token_price, 0) > 0 THEN o.amount * p.token_price ELSE 0 END)',
        'portfolioEstimatedValue',
      )
      .addSelect(
        'SUM(CASE WHEN COALESCE(p.token_price, 0) > 0 THEN 1 ELSE 0 END)',
        'pricedPositions',
      )
      .where('o.user_id = :userId', { userId })
      .andWhere('o.status = :status', { status: 'active' })
      .andWhere('o.settlement_status = :settlementStatus', {
        settlementStatus: 'SETTLED',
      })
      .getRawOne();

    const pricedPositions = this.toNumber(row?.pricedPositions);
    if (pricedPositions <= 0) {
      return null;
    }

    return this.toNumber(row?.portfolioEstimatedValue);
  }

  async getUserDistributions(userId: number) {
    await this.ensureDistributionLedgerBackfilled();

    const rows = await this.recordRepo
      .createQueryBuilder('distribution')
      .leftJoin(ProjectEntity, 'project', 'project.id = distribution.project_id')
      .select('distribution.id', 'id')
      .addSelect('distribution.uuid', 'uuid')
      .addSelect('distribution.project_id', 'projectId')
      .addSelect('distribution.user_id', 'userId')
      .addSelect('distribution.ownership_id', 'ownershipId')
      .addSelect('distribution.type', 'type')
      .addSelect('distribution.gross_amount', 'grossAmount')
      .addSelect('distribution.fee_amount', 'feeAmount')
      .addSelect('distribution.net_amount', 'netAmount')
      .addSelect('distribution.currency', 'currency')
      .addSelect('distribution.period_start', 'periodStart')
      .addSelect('distribution.period_end', 'periodEnd')
      .addSelect('distribution.distribution_date', 'distributionDate')
      .addSelect('distribution.status', 'status')
      .addSelect('distribution.reference', 'reference')
      .addSelect('distribution.notes', 'notes')
      .addSelect('distribution.created_at', 'createdAt')
      .addSelect('project.name', 'projectName')
      .addSelect('COALESCE(project.asset_code, project.token_symbol)', 'tokenSymbol')
      .where('distribution.user_id = :userId', { userId })
      .andWhere('distribution.deleted_at IS NULL')
      .orderBy('distribution.distribution_date', 'DESC', 'NULLS LAST')
      .addOrderBy('distribution.created_at', 'DESC')
      .getRawMany();

    return rows.map((row) => this.mapRecord(row as any));
  }

  async getProjectDistributions(projectId: number, userId: number, isAdmin: boolean) {
    await this.ensureDistributionLedgerBackfilled();

    const query = this.recordRepo
      .createQueryBuilder('distribution')
      .leftJoin(ProjectEntity, 'project', 'project.id = distribution.project_id')
      .select('distribution.id', 'id')
      .addSelect('distribution.uuid', 'uuid')
      .addSelect('distribution.project_id', 'projectId')
      .addSelect('distribution.user_id', 'userId')
      .addSelect('distribution.ownership_id', 'ownershipId')
      .addSelect('distribution.type', 'type')
      .addSelect('distribution.gross_amount', 'grossAmount')
      .addSelect('distribution.fee_amount', 'feeAmount')
      .addSelect('distribution.net_amount', 'netAmount')
      .addSelect('distribution.currency', 'currency')
      .addSelect('distribution.period_start', 'periodStart')
      .addSelect('distribution.period_end', 'periodEnd')
      .addSelect('distribution.distribution_date', 'distributionDate')
      .addSelect('distribution.status', 'status')
      .addSelect('distribution.reference', 'reference')
      .addSelect('distribution.notes', 'notes')
      .addSelect('distribution.created_at', 'createdAt')
      .addSelect('project.name', 'projectName')
      .addSelect('COALESCE(project.asset_code, project.token_symbol)', 'tokenSymbol')
      .where('distribution.project_id = :projectId', { projectId })
      .andWhere('distribution.deleted_at IS NULL');

    if (!isAdmin) {
      query.andWhere('distribution.user_id = :userId', { userId });
    }

    const rows = await query
      .orderBy('distribution.distribution_date', 'DESC', 'NULLS LAST')
      .addOrderBy('distribution.created_at', 'DESC')
      .getRawMany();

    return rows.map((row) => this.mapRecord(row as any));
  }

  async getUserSummary(userId: number) {
    await this.ensureDistributionLedgerBackfilled();

    const distributions = await this.getUserDistributions(userId);
    const investedCapitalByProject = await this.getInvestedCapitalByProject(userId);
    const portfolioEstimatedValue = await this.getPortfolioEstimatedValue(userId);
    const trailingStart = new Date();
    trailingStart.setUTCFullYear(trailingStart.getUTCFullYear() - 1);
    const now = new Date();

    const totals = {
      totalIncomeReceived: 0,
      pendingIncome: 0,
      trailing12MonthIncome: 0,
      nextExpectedDistributionDate: null as string | null,
    };

    const byProject = new Map<
      number,
      {
        projectId: number;
        projectName: string | null;
        tokenSymbol: string | null;
        totalIncomeReceived: number;
        pendingIncome: number;
        trailing12MonthIncome: number;
        latestDistributionDate: string | null;
        nextExpectedDistributionDate: string | null;
        estimatedYield: number | null;
        investedCapital: number;
      }
    >();

    for (const distribution of distributions) {
      const projectId = Number(distribution.projectId);
      const current =
        byProject.get(projectId) ??
        {
          projectId,
          projectName: distribution.projectName ?? null,
          tokenSymbol: distribution.tokenSymbol ?? null,
          totalIncomeReceived: 0,
          pendingIncome: 0,
          trailing12MonthIncome: 0,
          latestDistributionDate: null,
          nextExpectedDistributionDate: null,
          estimatedYield: null,
          investedCapital: investedCapitalByProject.get(projectId) ?? 0,
        };

      const distributionDate = distribution.distributionDate
        ? new Date(distribution.distributionDate)
        : null;
      const netAmount = this.toNumber(distribution.netAmount);

      if (distribution.status === 'PAID') {
        current.totalIncomeReceived += netAmount;
        totals.totalIncomeReceived += netAmount;

        if (
          distributionDate &&
          !Number.isNaN(distributionDate.getTime()) &&
          distributionDate >= trailingStart
        ) {
          current.trailing12MonthIncome += netAmount;
          totals.trailing12MonthIncome += netAmount;
        }

        if (
          distribution.distributionDate &&
          (!current.latestDistributionDate ||
            distribution.distributionDate > current.latestDistributionDate)
        ) {
          current.latestDistributionDate = distribution.distributionDate;
        }
      }

      if (distribution.status === 'PENDING' || distribution.status === 'SCHEDULED') {
        current.pendingIncome += netAmount;
        totals.pendingIncome += netAmount;

        if (
          distribution.distributionDate &&
          (!current.nextExpectedDistributionDate ||
            distribution.distributionDate < current.nextExpectedDistributionDate)
        ) {
          current.nextExpectedDistributionDate = distribution.distributionDate;
        }

        if (
          distributionDate &&
          !Number.isNaN(distributionDate.getTime()) &&
          distributionDate >= now &&
          (!totals.nextExpectedDistributionDate ||
            distribution.distributionDate < totals.nextExpectedDistributionDate)
        ) {
          totals.nextExpectedDistributionDate = distribution.distributionDate;
        }
      }

      byProject.set(projectId, current);
    }

    const projectSummaries = Array.from(byProject.values()).map((project) => {
      const estimatedYield =
        project.investedCapital > 0
          ? (project.trailing12MonthIncome / project.investedCapital) * 100
          : null;

      return {
        ...project,
        estimatedYield,
      };
    });

    const investedCapitalTotal = Array.from(investedCapitalByProject.values()).reduce(
      (sum, value) => sum + this.toNumber(value),
      0,
    );
    const currentYieldEstimate =
      investedCapitalTotal > 0
        ? (totals.trailing12MonthIncome / investedCapitalTotal) * 100
        : null;
    const averageYieldAcrossHoldings =
      projectSummaries.filter((item) => item.estimatedYield != null).length > 0
        ? projectSummaries
            .filter((item) => item.estimatedYield != null)
            .reduce((sum, item) => sum + this.toNumber(item.estimatedYield), 0) /
          projectSummaries.filter((item) => item.estimatedYield != null).length
        : null;

    const lastDistribution = distributions.find((item) => item.status === 'PAID') ?? null;

    return {
      totalIncomeReceived: totals.totalIncomeReceived,
      pendingIncome: totals.pendingIncome,
      trailing12MonthIncome: totals.trailing12MonthIncome,
      currentYieldEstimate,
      averageYieldAcrossHoldings,
      nextExpectedDistributionDate: totals.nextExpectedDistributionDate,
      lastDistribution,
      byProject: projectSummaries,
      portfolioEstimatedValue,
      investedCapital: investedCapitalTotal,
      yieldMethod: 'estimated_from_invested_capital',
    };
  }

  async createDraftEvent(
    projectId: number,
    createdBy: number,
    body: {
      name?: string;
      seriesId?: number | null;
      spvId?: number | null;
      recordDate: string;
      payableDate?: string | null;
      payoutRail?: DistributionPayoutRail;
      custodyScope?: DistributionCustodyScope;
      cashInflowAmount?: number | null;
      grossAmount?: number | null;
      feeAmount?: number | null;
      netAmount?: number | null;
      sourceReference?: string | null;
      notes?: string | null;
    },
  ) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId } as any,
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException('Project not found');
    }

    if (!body?.recordDate) {
      throw new BadRequestException('recordDate is required');
    }

    const event = this.eventRepo.create({
      projectId,
      seriesId: body.seriesId ?? null,
      spvId: body.spvId ?? null,
      name: String(body.name || `${project.name || 'Project'} distribution`).trim(),
      status: 'DRAFT',
      custodyScope: body.custodyScope ?? 'ALL',
      payoutRail: body.payoutRail ?? 'OFF_CHAIN',
      recordDate: body.recordDate,
      payableDate: body.payableDate ?? null,
      cashInflowAmount: body.cashInflowAmount ?? null,
      grossAmount: body.grossAmount ?? body.cashInflowAmount ?? null,
      feeAmount: body.feeAmount ?? null,
      netAmount: this.resolveNetAmount(body),
      sourceReference: body.sourceReference ?? null,
      notes: body.notes ?? null,
      createdBy,
      approvedBy: null,
      approvedAt: null,
      completedAt: null,
    });

    const saved = await this.eventRepo.save(event);
    return this.mapEvent(saved);
  }

  async listProjectEvents(projectId: number) {
    const rows = await this.eventRepo.find({
      where: { projectId } as any,
      order: { createdAt: 'DESC' as any },
    });

    return rows.map((row) => this.mapEvent(row));
  }

  async getEventDetail(eventId: number) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } as any });
    if (!event) {
      throw new NotFoundException('Distribution event not found');
    }

    const entitlements = await this.entitlementRepo.find({
      where: { eventId } as any,
      order: { netAmount: 'DESC' as any, id: 'ASC' as any },
    });

    const payouts = await this.payoutRepo.find({
      where: { eventId } as any,
      order: { id: 'ASC' as any },
    });

    return {
      event: this.mapEvent(event),
      entitlements: entitlements.map((row) => ({
        ...row,
        unitsHeld: this.toNumber(row.unitsHeld),
        ownershipFraction: this.toNumber(row.ownershipFraction),
        grossAmount: this.toNumber(row.grossAmount),
        feeAmount: this.toNumber(row.feeAmount),
        netAmount: this.toNumber(row.netAmount),
      })),
      payouts: payouts.map((row) => ({
        ...row,
        grossAmount: this.toNumber(row.grossAmount),
        feeAmount: this.toNumber(row.feeAmount),
        netAmount: this.toNumber(row.netAmount),
      })),
    };
  }

  async calculateEntitlements(eventId: number) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } as any });
    if (!event) {
      throw new NotFoundException('Distribution event not found');
    }

    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      throw new BadRequestException(
        'Completed or cancelled distribution events cannot be recalculated',
      );
    }

    const positions = await this.ownershipRepo.find({
      where: {
        projectId: event.projectId,
        seriesId: event.seriesId ?? undefined,
        status: 'active',
        settlementStatus: 'SETTLED',
      } as any,
      order: { id: 'ASC' as any },
    });

    // Current architecture note:
    // until a historical cap-table snapshot exists, entitlement calculation uses
    // the current settled ownership ledger at calculation time while still
    // storing recordDate on the event for future reconciliation upgrades.
    const scopedPositions = positions.filter((position) => {
      if (event.custodyScope === 'SELF_CUSTODY') {
        return position.custodyType === 'self_custody';
      }

      if (event.custodyScope === 'REGENX_CUSTODY') {
        return position.custodyType === 'regenx_custody';
      }

      return true;
    });

    const totalUnits = scopedPositions.reduce(
      (sum, row) => sum + this.toNumber(row.amount),
      0,
    );
    const grossAmount = this.toNumber(event.grossAmount ?? event.cashInflowAmount);
    const feeAmount = this.toNumber(event.feeAmount);
    const netAmount = this.resolveNetAmount(event);

    if (grossAmount <= 0 || netAmount <= 0) {
      throw new BadRequestException(
        'Distribution amount must be greater than zero before entitlements can be calculated',
      );
    }

    await this.entitlementRepo.delete({ eventId } as any);
    await this.payoutRepo.delete({ eventId } as any);

    if (totalUnits <= 0) {
      throw new BadRequestException(
        'Cannot calculate distributions without valid settled ownership positions',
      );
    }

    const entitlements = scopedPositions.map((position) => {
      const unitsHeld = this.toNumber(position.amount);
      const ownershipFraction = unitsHeld / totalUnits;
      const holderGross = grossAmount * ownershipFraction;
      const holderFee = feeAmount * ownershipFraction;
      const holderNet = netAmount * ownershipFraction;

      return this.entitlementRepo.create({
        eventId: event.id,
        projectId: event.projectId,
        seriesId: event.seriesId ?? null,
        ownershipId: position.id,
        userId: position.userId ?? null,
        custodyType: position.custodyType,
        ownershipSource: position.ownershipSource,
        settlementStatus: position.settlementStatus,
        walletAddress: position.walletAddress ?? null,
        custodyAccountRef: position.custodyAccountRef ?? null,
        unitsHeld,
        ownershipFraction,
        grossAmount: holderGross,
        feeAmount: holderFee,
        netAmount: holderNet,
        status: 'PENDING',
      });
    });

    const savedEntitlements = await this.entitlementRepo.save(entitlements);
    const totalEntitledNet = savedEntitlements.reduce(
      (sum, row) => sum + this.toNumber(row.netAmount),
      0,
    );

    if (totalEntitledNet - netAmount > 0.000001) {
      throw new BadRequestException(
        'Calculated entitlement totals exceed the distribution event net amount',
      );
    }

    const payouts = savedEntitlements.map((entitlement) =>
      this.payoutRepo.create({
        eventId: event.id,
        entitlementId: entitlement.id,
        userId: entitlement.userId ?? null,
        custodyType: entitlement.custodyType,
        payoutRail: event.payoutRail,
        destinationWalletAddress:
          entitlement.custodyType === 'self_custody'
            ? entitlement.walletAddress
            : null,
        destinationAccountRef:
          entitlement.custodyType === 'regenx_custody'
            ? entitlement.custodyAccountRef
            : null,
        grossAmount: entitlement.grossAmount,
        feeAmount: entitlement.feeAmount,
        netAmount: entitlement.netAmount,
        status: 'PENDING',
        externalReference: null,
        txHash: null,
        failureReason: null,
        processedAt: null,
      }),
    );

    await this.payoutRepo.save(payouts);
    await this.syncRecordsForEvent(event, savedEntitlements, payouts);

    event.status = 'CALCULATED';
    event.updatedAt = new Date();
    await this.eventRepo.save(event);

    return this.getEventDetail(eventId);
  }
}
