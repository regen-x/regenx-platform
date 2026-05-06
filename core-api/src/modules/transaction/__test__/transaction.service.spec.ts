import { BadRequestException } from '@nestjs/common';

import { TransactionService } from '../application/service/transaction.service';
import { TRANSACTION_STATUS } from '../domain/transaction-status.enum';
import { TRANSACTION_TYPE } from '../domain/transaction-type.enum';

describe('TransactionService', () => {
  const buildQueryBuilder = (existingRecord: any) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(existingRecord),
  });

  it('rejects completed transactions without settledAt', async () => {
    const transactionRepository = {
      saveOne: jest.fn(),
    };
    const transactionMapper = {
      fromTransactionToTransactionResponseDto: jest.fn(),
    };
    const transactionResponseAdapter = {
      oneEntityResponse: jest.fn(),
      manyEntitiesResponse: jest.fn(),
    };
    const mapperService = {
      dtoToClass: jest.fn(),
    };
    const projectRepository = {
      getOneByFilter: jest.fn(),
    };
    const transactionEntityRepo = {
      createQueryBuilder: jest.fn(() => buildQueryBuilder(null)),
    };

    const service = new TransactionService(
      transactionRepository as any,
      transactionMapper as any,
      transactionResponseAdapter as any,
      mapperService as any,
      projectRepository as any,
      transactionEntityRepo as any,
    );

    await expect(
      service.createTransaction({
        userId: 3,
        projectId: 5,
        amount: 1000,
        type: TRANSACTION_TYPE.BUY,
        status: TRANSACTION_STATUS.COMPLETED,
        reference: 'tx-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an existing finalized transaction instead of creating a duplicate', async () => {
    const existingRecord = {
      id: 99,
      amount: 1000,
      tokenAmount: 10,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: 'tx-1',
    };
    const transactionRepository = {
      saveOne: jest.fn(),
    };
    const transactionMapper = {
      fromTransactionToTransactionResponseDto: jest
        .fn()
        .mockReturnValue({ id: 99 }),
    };
    const transactionResponseAdapter = {
      oneEntityResponse: jest.fn().mockImplementation((_name, data) => data),
      manyEntitiesResponse: jest.fn(),
    };
    const mapperService = {
      dtoToClass: jest.fn(),
    };
    const projectRepository = {
      getOneByFilter: jest.fn(),
    };
    const transactionEntityRepo = {
      createQueryBuilder: jest.fn(() => buildQueryBuilder(existingRecord)),
    };

    const service = new TransactionService(
      transactionRepository as any,
      transactionMapper as any,
      transactionResponseAdapter as any,
      mapperService as any,
      projectRepository as any,
      transactionEntityRepo as any,
    );

    const result = await service.createTransaction({
      userId: 3,
      projectId: 5,
      amount: 1000,
      tokenAmount: 10,
      type: TRANSACTION_TYPE.BUY,
      status: TRANSACTION_STATUS.COMPLETED,
      reference: 'tx-1',
      settledAt: new Date().toISOString(),
    });

    expect(result).toEqual({ id: 99 });
    expect(transactionRepository.saveOne).not.toHaveBeenCalled();
  });
});
