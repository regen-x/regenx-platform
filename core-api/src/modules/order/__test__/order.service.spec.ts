import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { OrderService } from '../application/service/order.service';
import { OrderEntity } from '../infrastructure/persistence/entities/order.entity';
import { TransactionEntity } from '../../transaction/infrastructure/persistence/entities/transaction.entity';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepo: jest.Mocked<Partial<Repository<OrderEntity>>>;
  let projectRepo: jest.Mocked<Partial<Repository<any>>>;
  let transactionRepo: jest.Mocked<Partial<Repository<TransactionEntity>>>;
  let notificationService: { createNotification: jest.Mock };

  beforeEach(() => {
    orderRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };
    projectRepo = {
      findOne: jest.fn(),
    };
    transactionRepo = {
      findOne: jest.fn(),
    };
    notificationService = {
      createNotification: jest.fn(),
    };

    service = new OrderService(
      orderRepo as any,
      projectRepo as any,
      transactionRepo as any,
      notificationService as any,
    );
  });

  it('rejects completing a funded buy order without a resulting transaction', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 1,
      uuid: 'order-1',
      userId: 7,
      projectId: 11,
      projectName: 'Sunified Solar',
      tokenSymbol: 'SUN',
      orderType: 'BUY',
      currencyAmount: 2500,
      tokenAmount: 100,
      status: 'SETTLING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await expect(
      service.markCompleted({
        orderId: 1,
        userId: 7,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an already-completed order idempotently for the same settlement record', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 1,
      uuid: 'order-1',
      userId: 7,
      projectId: 11,
      projectName: 'Sunified Solar',
      tokenSymbol: 'SUN',
      orderType: 'BUY',
      currencyAmount: 2500,
      tokenAmount: 100,
      status: 'COMPLETED',
      txHash: 'tx-123',
      resultingTransactionId: 91,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
    transactionRepo.findOne.mockResolvedValue({
      id: 91,
      amount: 2500,
      tokenAmount: 100,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    } as any);

    const result = await service.markCompleted({
      orderId: 1,
      userId: 7,
      txHash: 'tx-123',
      resultingTransactionId: 91,
    });

    expect(result.status).toBe('COMPLETED');
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('rejects moving a completed order into failed state', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 1,
      uuid: 'order-1',
      userId: 7,
      projectId: 11,
      projectName: 'Sunified Solar',
      tokenSymbol: 'SUN',
      orderType: 'BUY',
      currencyAmount: 2500,
      tokenAmount: 100,
      status: 'COMPLETED',
      txHash: 'tx-123',
      resultingTransactionId: 91,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await expect(
      service.markFailed({
        orderId: 1,
        userId: 7,
        reason: 'late error',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
