import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  OrderEntity,
  OrderStatus,
  OrderType,
} from '../../infrastructure/persistence/entities/order.entity';
import {
  NotificationType,
} from '../../../notification/infrastructure/persistence/entities/notification.entity';
import { NotificationService } from '../../../notification/application/service/notification.service';
import { ProjectEntity } from '../../../project/infrastructure/persistence/entities/project.entity';
import { TransactionEntity } from '../../../transaction/infrastructure/persistence/entities/transaction.entity';

type TimelineEntry = {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  reached: boolean;
  current: boolean;
};

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,

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

  private createReference(id: number) {
    return `ORD-${String(id).padStart(6, '0')}`;
  }

  private buildTimeline(order: OrderEntity): TimelineEntry[] {
    const statuses: Array<{
      status: OrderStatus;
      label: string;
      timestamp: Date | string | null | undefined;
    }> = [
      { status: 'DRAFT', label: 'Draft', timestamp: order.draftAt },
      {
        status: 'PENDING_SIGNATURE',
        label: 'Pending signature',
        timestamp: order.pendingSignatureAt,
      },
      { status: 'SUBMITTED', label: 'Submitted', timestamp: order.submittedAt },
      { status: 'SETTLING', label: 'Settling', timestamp: order.settlingAt },
      { status: 'COMPLETED', label: 'Completed', timestamp: order.completedAt },
      { status: 'FAILED', label: 'Failed', timestamp: order.failedAt },
      { status: 'CANCELLED', label: 'Cancelled', timestamp: order.cancelledAt },
    ];

    return statuses.map((entry) => ({
      status: entry.status,
      label: entry.label,
      timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
      reached: Boolean(entry.timestamp),
      current: order.status === entry.status,
    }));
  }

  private async mapOrder(order: OrderEntity, includeDetail = false) {
    let resultingTransaction: {
      id: number;
      reference: string | null;
      amount: number;
      tokenAmount: number | null;
      status: string;
      createdAt: string;
    } | null = null;

    if (includeDetail && order.resultingTransactionId) {
      const tx = await this.transactionRepo.findOne({
        where: { id: Number(order.resultingTransactionId) } as any,
      });

      if (tx) {
        resultingTransaction = {
          id: Number(tx.id),
          reference: tx.reference ?? null,
          amount: this.toNumber(tx.amount),
          tokenAmount:
            tx.tokenAmount == null ? null : this.toNumber(tx.tokenAmount),
          status: String(tx.status),
          createdAt: String(tx.createdAt ?? ''),
        };
      }
    }

    return {
      id: Number(order.id),
      uuid: order.uuid,
      userId: Number(order.userId),
      projectId: Number(order.projectId),
      projectName: order.projectName,
      tokenSymbol: order.tokenSymbol,
      orderType: order.orderType,
      currencyAmount: this.toNumber(order.currencyAmount),
      tokenAmount: this.toNumber(order.tokenAmount),
      status: order.status,
      failureReason: order.failureReason ?? null,
      txHash: order.txHash ?? null,
      investorCustodyAccountId: order.investorCustodyAccountId ?? null,
      custodyProvider: order.custodyProvider ?? null,
      providerTransactionId: order.providerTransactionId ?? null,
      tokenTransferTxHash: order.tokenTransferTxHash ?? null,
      onchainStatus: order.onchainStatus ?? 'not_started',
      onchainError: order.onchainError ?? null,
      reference: order.reference ?? null,
      createdAt: String(order.createdAt ?? ''),
      updatedAt: String(order.updatedAt ?? ''),
      settledAt: order.settledAt ? new Date(order.settledAt).toISOString() : null,
      resultingTransactionId: order.resultingTransactionId ?? null,
      canRetry: order.status === 'FAILED',
      canCancel: ['DRAFT', 'PENDING_SIGNATURE', 'SUBMITTED'].includes(order.status),
      ...(includeDetail
        ? {
            timeline: this.buildTimeline(order),
            resultingTransaction,
          }
        : {}),
    };
  }

  private async getOwnedOrder(orderId: number, userId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId } as any,
    });

    if (!order || order.deletedAt) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private isFinalStatus(status: OrderStatus) {
    return ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status);
  }

  private async getValidatedResultingTransaction(input: {
    order: OrderEntity;
    resultingTransactionId?: number | null;
  }) {
    const resultingTransactionId =
      input.resultingTransactionId ?? input.order.resultingTransactionId ?? null;

    if (resultingTransactionId == null) {
      return null;
    }

    const tx = await this.transactionRepo.findOne({
      where: { id: Number(resultingTransactionId) } as any,
      relations: ['user', 'project'],
    });

    if (!tx) {
      throw new BadRequestException('Resulting transaction not found');
    }

    const txUserId = Number((tx as any)?.user?.id ?? 0);
    const txProjectId = Number((tx as any)?.project?.id ?? 0);

    if (txUserId !== Number(input.order.userId)) {
      throw new BadRequestException(
        'Resulting transaction does not belong to the order owner',
      );
    }

    if (txProjectId !== Number(input.order.projectId)) {
      throw new BadRequestException(
        'Resulting transaction does not belong to the same project as the order',
      );
    }

    if (String((tx as any)?.status ?? '') !== 'COMPLETED') {
      throw new BadRequestException(
        'Only completed transactions can settle an order',
      );
    }

    return tx;
  }

  async createPendingSignatureOrder(input: {
    userId: number;
    projectId: number;
    projectName?: string | null;
    tokenSymbol: string;
    orderType?: OrderType;
    currencyAmount?: number;
    tokenAmount: number;
  }) {
    const project =
      input.projectName == null
        ? await this.projectRepo.findOne({
            where: { id: input.projectId } as any,
          })
        : null;

    if (!input.projectName && !project) {
      throw new NotFoundException('Project not found');
    }

    if (this.toNumber(input.tokenAmount) <= 0) {
      throw new BadRequestException('Order token amount must be greater than zero');
    }

    if (this.toNumber(input.currencyAmount) < 0) {
      throw new BadRequestException('Order currency amount cannot be negative');
    }

    const now = new Date();
    const order = this.orderRepo.create({
      userId: input.userId,
      projectId: input.projectId,
      projectName: String(
        input.projectName ?? (project as any)?.name ?? `Project ${input.projectId}`,
      ),
      tokenSymbol: input.tokenSymbol,
      orderType: input.orderType ?? 'BUY',
      currencyAmount: this.toNumber(input.currencyAmount),
      tokenAmount: this.toNumber(input.tokenAmount),
      status: 'PENDING_SIGNATURE',
      draftAt: now,
      pendingSignatureAt: now,
      reference: null,
    });

    const saved = await this.orderRepo.save(order);
    saved.reference = this.createReference(Number(saved.id));
    await this.orderRepo.save(saved);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.ORDER_CREATED,
      'Order created',
      `Your buy order for ${saved.projectName} is ready for signature.`,
      'order',
      Number(saved.id),
    );

    return this.mapOrder(saved, true);
  }

  async markSubmitted(orderId: number, userId: number) {
    const order = await this.getOwnedOrder(orderId, userId);

    if (order.status === 'SUBMITTED' && order.submittedAt) {
      return this.mapOrder(order, true);
    }

    if (!['DRAFT', 'PENDING_SIGNATURE'].includes(order.status)) {
      throw new BadRequestException('Order can no longer be submitted');
    }

    if (!order.pendingSignatureAt) {
      order.pendingSignatureAt = new Date();
    }
    order.status = 'SUBMITTED';
    order.submittedAt = new Date();
    const saved = await this.orderRepo.save(order);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.ORDER_SUBMITTED,
      'Order submitted',
      `Your order for ${saved.projectName} has been submitted for processing.`,
      'order',
      Number(saved.id),
    );

    return this.mapOrder(saved, true);
  }

  async markSettling(input: {
    orderId: number;
    userId: number;
    txHash?: string | null;
    reference?: string | null;
  }) {
    const order = await this.getOwnedOrder(input.orderId, input.userId);

    if (order.status === 'SETTLING') {
      if (!input.txHash || input.txHash === order.txHash) {
        return this.mapOrder(order, true);
      }

      throw new BadRequestException('Order is already settling with a different reference');
    }

    if (!['SUBMITTED', 'PENDING_SIGNATURE'].includes(order.status)) {
      throw new BadRequestException('Only submitted orders can move to settling');
    }

    order.status = 'SETTLING';
    order.settlingAt = new Date();
    order.txHash = input.txHash ?? order.txHash ?? null;
    if (input.reference != null) {
      order.reference = input.reference;
    }
    const saved = await this.orderRepo.save(order);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.ORDER_SETTLING,
      'Order settling',
      `Your order for ${saved.projectName} is now settling on the platform.`,
      'order',
      Number(saved.id),
    );

    return this.mapOrder(saved, true);
  }

  async markCompleted(input: {
    orderId: number;
    userId: number;
    txHash?: string | null;
    reference?: string | null;
    resultingTransactionId?: number | null;
    settledAt?: Date | null;
  }) {
    const order = await this.getOwnedOrder(input.orderId, input.userId);

    if (order.status === 'COMPLETED') {
      const sameTransaction =
        (input.resultingTransactionId == null &&
          order.resultingTransactionId == null) ||
        Number(input.resultingTransactionId ?? order.resultingTransactionId) ===
          Number(order.resultingTransactionId ?? input.resultingTransactionId);

      if (
        sameTransaction &&
        (input.txHash == null || input.txHash === order.txHash)
      ) {
        return this.mapOrder(order, true);
      }

      throw new BadRequestException(
        'Order has already been completed with a different settlement record',
      );
    }

    if (['FAILED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Finalized orders cannot be completed');
    }

    if (!['SUBMITTED', 'SETTLING'].includes(order.status)) {
      throw new BadRequestException('Order is not ready to be completed');
    }

    const resultingTransaction = await this.getValidatedResultingTransaction({
      order,
      resultingTransactionId: input.resultingTransactionId,
    });

    if (order.orderType === 'BUY' && this.toNumber(order.currencyAmount) > 0) {
      const resolvedTransactionId =
        input.resultingTransactionId ?? order.resultingTransactionId ?? null;

      if (resolvedTransactionId == null) {
        throw new BadRequestException(
          'Completed buy orders must be linked to a resulting transaction',
        );
      }
    }

    const settledAt = input.settledAt ?? new Date();

    order.status = 'COMPLETED';
    order.txHash =
      input.txHash ??
      order.txHash ??
      resultingTransaction?.reference ??
      null;
    if (input.reference != null) {
      order.reference = input.reference;
    }
    order.resultingTransactionId =
      input.resultingTransactionId ?? order.resultingTransactionId ?? null;
    order.settledAt = settledAt;
    order.completedAt = settledAt;
    const saved = await this.orderRepo.save(order);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.ORDER_COMPLETED,
      'Order completed',
      `Your order for ${saved.projectName} has completed.`,
      'order',
      Number(saved.id),
    );

    if (saved.resultingTransactionId) {
      await this.notificationService.createNotification(
        Number(saved.userId),
        NotificationType.TRANSACTION_COMPLETED,
        'Transaction completed',
        `The transaction for your ${saved.projectName} order has settled successfully.`,
        'transaction',
        Number(saved.resultingTransactionId),
      );
    }

    return this.mapOrder(saved, true);
  }

  async markFailed(input: {
    orderId: number;
    userId: number;
    reason?: string | null;
    txHash?: string | null;
  }) {
    const order = await this.getOwnedOrder(input.orderId, input.userId);

    if (order.status === 'FAILED') {
      return this.mapOrder(order, true);
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException('Finalized orders cannot be marked as failed');
    }

    order.status = 'FAILED';
    order.failureReason = input.reason ?? 'Unknown error';
    order.txHash = input.txHash ?? order.txHash ?? null;
    order.failedAt = new Date();
    const saved = await this.orderRepo.save(order);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.ORDER_FAILED,
      'Order failed',
      `Your order for ${saved.projectName} failed${saved.failureReason ? `: ${saved.failureReason}` : '.'}`,
      'order',
      Number(saved.id),
    );

    return this.mapOrder(saved, true);
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.getOwnedOrder(orderId, userId);

    if (order.status === 'CANCELLED') {
      return this.mapOrder(order, true);
    }

    if (!['DRAFT', 'PENDING_SIGNATURE', 'SUBMITTED'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    const saved = await this.orderRepo.save(order);
    return this.mapOrder(saved, true);
  }

  async getUserOrders(userId: number) {
    const rows = await this.orderRepo.find({
      where: { userId } as any,
      order: { updatedAt: 'DESC' as any, createdAt: 'DESC' as any },
    });

    return Promise.all(rows.map((row) => this.mapOrder(row, false)));
  }

  async getOrderDetail(orderId: number, userId: number) {
    const order = await this.getOwnedOrder(orderId, userId);
    return this.mapOrder(order, true);
  }

  async getUserSummary(userId: number) {
    const rows = await this.orderRepo.find({
      where: { userId } as any,
      order: { updatedAt: 'DESC' as any },
    });

    const summary = rows.reduce(
      (acc, order) => {
        if (['DRAFT', 'PENDING_SIGNATURE', 'SUBMITTED'].includes(order.status)) {
          acc.pendingCount += 1;
        } else if (order.status === 'SETTLING') {
          acc.settlingCount += 1;
        } else if (order.status === 'COMPLETED') {
          acc.completedCount += 1;
        } else if (order.status === 'FAILED') {
          acc.failedCount += 1;
        }
        return acc;
      },
      {
        pendingCount: 0,
        settlingCount: 0,
        completedCount: 0,
        failedCount: 0,
      },
    );

    return {
      ...summary,
      recent: await Promise.all(
        rows.slice(0, 5).map((row) => this.mapOrder(row, false)),
      ),
    };
  }
}
