import { validateSync } from 'class-validator';

import { RequestCustodyModeChangeDto } from '../application/dto/request-custody-mode-change.dto';
import { UpdateDeveloperWalletSettingsDto } from '../application/dto/update-developer-wallet-settings.dto';
import { DeveloperProfileService } from '../application/service/developer-profile.service';

describe('DeveloperProfileService', () => {
  let service: DeveloperProfileService;
  let repo: any;
  let userRepo: any;
  let projectRepo: any;
  let spvRepo: any;
  let seriesRepo: any;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    userRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(async (value) => value),
    };

    projectRepo = {
      find: jest.fn(),
    };

    spvRepo = {
      findBy: jest.fn(),
    };

    seriesRepo = {
      findBy: jest.fn(),
    };

    service = new DeveloperProfileService(
      repo,
      userRepo,
      projectRepo,
      spvRepo,
      seriesRepo,
      { createNotification: jest.fn() } as any,
    );
  });

  it('loads settings summary safely when SPV linkage is absent', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      user: { id: 7 },
      legalEntityName: 'Acme Climate Pty Ltd',
      tradingName: 'Acme Climate',
      custodyMode: 'self_custody',
      custodyChangeStatus: 'none',
      payloadJson: {},
      updatedAt: new Date('2026-04-20T00:00:00.000Z'),
      status: 'approved',
    });
    projectRepo.find.mockResolvedValue([]);

    const result = await service.getSettingsSummary(7);

    expect(result.entityLinkage.primaryLegalEntity).toBe('Acme Climate Pty Ltd');
    expect(result.entityLinkage.linkedSpvName).toBe('Not yet linked');
    expect(result.entityLinkage.relatedProjects).toEqual([]);
  });

  it('updates company details with the ongoing settings fields', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      user: { id: 7 },
      payloadJson: {},
      custodyMode: 'self_custody',
      custodyChangeStatus: 'none',
    });

    const result = await service.updateCompanyDetails(7, {
      legalEntityName: 'RegenX Climate Holdings Pty Ltd',
      tradingName: 'RegenX Climate',
      abn: '12345678901',
      acn: '600123456',
      contactName: 'Taylor Green',
      contactEmail: 'taylor@example.com',
      phone: '+61400000000',
      website: 'https://regenx.example.com',
      registeredAddress: '1 Market Street, Sydney NSW',
      businessDescription: 'Distributed clean energy project origination.',
    });

    expect(result.legalEntityName).toBe('RegenX Climate Holdings Pty Ltd');
    expect(result.contactEmail).toBe('taylor@example.com');
    expect(repo.save).toHaveBeenCalled();
  });

  it('validates Stellar wallet address format through the DTO', () => {
    const dto = new UpdateDeveloperWalletSettingsDto();
    dto.walletAddress = 'not-a-stellar-wallet';

    const errors = validateSync(dto);

    expect(errors).toHaveLength(1);
    expect(JSON.stringify(errors[0].constraints)).toContain(
      'Invalid Stellar public key',
    );
  });

  it('tracks custody mode change requests as pending review', async () => {
    repo.findOne.mockResolvedValue({
      id: 1,
      user: { id: 7 },
      payloadJson: {},
      custodyMode: 'self_custody',
      custodyChangeStatus: 'none',
    });

    const result = await service.requestCustodyModeChange(7, {
      requestedMode: 'regenx_custody',
    } as RequestCustodyModeChangeDto);

    expect(result.status).toBe('pending_review');
    expect(result.requestedMode).toBe('regenx_custody');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        custodyChangeStatus: 'pending_review',
        custodyChangeRequestedMode: 'regenx_custody',
      }),
    );
  });
});
