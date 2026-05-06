import { BadRequestException } from '@nestjs/common';

import { DistributionService } from '../application/service/distribution.service';

describe('DistributionService', () => {
  it('rejects entitlement calculation when there are no settled ownership positions', async () => {
    const service = new DistributionService(
      { findOne: jest.fn().mockResolvedValue({ id: 1, projectId: 10, grossAmount: 100, feeAmount: 0, netAmount: 100, custodyScope: 'ALL', status: 'DRAFT' }) } as any,
      { delete: jest.fn(), save: jest.fn() } as any,
      { delete: jest.fn(), save: jest.fn() } as any,
      { find: jest.fn(), save: jest.fn(), delete: jest.fn(), count: jest.fn() } as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      { findOne: jest.fn() } as any,
      { createQueryBuilder: jest.fn() } as any,
      { createNotification: jest.fn() } as any,
    );

    await expect(service.calculateEntitlements(1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
