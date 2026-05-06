import { LegalEntityService } from './legal-entity.service';

describe('LegalEntityService', () => {
  let service: LegalEntityService;
  let legalEntityRepo: any;
  let auditLogRepo: any;

  beforeEach(() => {
    legalEntityRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 7, uuid: 'uuid-7', ...value })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    auditLogRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    service = new LegalEntityService(legalEntityRepo, auditLogRepo);
  });

  it('creates a legal entity and writes an audit event', async () => {
    const result = await service.createEntity(
      {
        entityName: 'Solar Sponsor Pty Ltd',
        status: 'active',
        reason: 'Initial sponsor onboarding',
      },
      5,
    );

    expect(legalEntityRepo.save).toHaveBeenCalled();
    expect(auditLogRepo.save).toHaveBeenCalled();
    expect(result.entityName).toBe('Solar Sponsor Pty Ltd');
    expect(result.status).toBe('active');
  });
});
