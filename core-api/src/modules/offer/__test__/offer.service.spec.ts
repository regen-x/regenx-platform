import { BadRequestException } from '@nestjs/common';

import { OfferService } from '../application/service/offer.service';

describe('OfferService', () => {
  const aggregateQueryBuilder = (value: string) => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(value ? { heldAmount: value, reservedAmount: value } : {}),
  });

  it('rejects sell orders that exceed unencumbered holdings', async () => {
    const heldQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ heldAmount: '5' }),
    };
    const reservedQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ reservedAmount: '2' }),
    };

    const service = new OfferService(
      { getAll: jest.fn(), getOneByFilter: jest.fn(), saveOne: jest.fn(), updateOneOrFail: jest.fn() } as any,
      { oneEntityResponse: jest.fn(), manyEntitiesResponse: jest.fn() } as any,
      { fromOfferToOfferResponseDto: jest.fn() } as any,
      { buildCreateTokenOfferTransaction: jest.fn() } as any,
      { getAccount: jest.fn().mockResolvedValue({}) } as any,
      {
        getOneByFilter: jest.fn().mockResolvedValue({
          id: 44,
          uuid: 'project-1',
          tokenAddress: 'token-1',
        }),
      } as any,
      {
        getOneByFilter: jest.fn().mockResolvedValue({
          id: 12,
          walletAddress: 'GSELLER',
        }),
      } as any,
      { submitSorobanTransaction: jest.fn(), getSorobanTransaction: jest.fn() } as any,
      { createTransaction: jest.fn() } as any,
      { createNotification: jest.fn() } as any,
      { createQueryBuilder: jest.fn(() => reservedQueryBuilder) } as any,
      { createQueryBuilder: jest.fn(() => heldQueryBuilder) } as any,
    );

    await expect(
      service.createTokenOfferXdr({
        userAddress: 'GSELLER',
        projectUuid: 'project-1',
        amount: 4,
        price: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
