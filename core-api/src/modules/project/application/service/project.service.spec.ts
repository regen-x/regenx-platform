import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Keypair } from '@stellar/stellar-sdk';

import { AssetService } from '../../../asset/application/service/asset.service';
import { NotificationService } from '../../../notification/application/service/notification.service';
import { ProjectMapper } from '../mapper/project.mapper';
import { ProjectService } from './project.service';
import { SpvService } from '../../../spv/application/spv.service';
import { ProjectEntity } from '../../infrastructure/persistence/entities/project.entity';

describe('ProjectService.issueProject', () => {
  let service: ProjectService;
  let projectRepo: any;
  let ownershipRepo: any;
  let assetService: any;
  let spvService: any;
  let projectWalletAuditRepo: any;
  let spvRepo: any;
  let legalEntityRepo: any;
  let auditLogRepo: any;
  let custodyChangeRequestRepo: any;

  const configuredDistributorWallet = Keypair.random().publicKey();
  const issuerWallet = Keypair.random().publicKey();
  const developerWallet = Keypair.random().publicKey();
  const proceedsWallet = Keypair.random().publicKey();

  const buildProject = (overrides: Partial<ProjectEntity> = {}) =>
    ({
      id: 1,
      status: 'approved',
      tokenSymbol: 'RGX01',
      tokenSupply: 1000,
      sponsorEntityId: 61,
      spvId: 41,
      developerWalletAddress: developerWallet,
      distributorWalletPublic: configuredDistributorWallet,
      payloadJson: {},
      user: { id: 99 } as any,
      ...overrides,
    }) as ProjectEntity;

  beforeEach(() => {
    projectRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (project) => project),
    };

    ownershipRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    assetService = {
      getMissingCoreConfigKeys: jest.fn().mockReturnValue([]),
      getNetworkConfig: jest.fn().mockReturnValue({
        serverUrl: 'https://horizon-testnet.stellar.org',
        networkPassphrase: 'Test SDF Network ; September 2015',
      }),
      getDistributionIssuancePreflight: jest.fn().mockResolvedValue({
        issuerPublicKey: issuerWallet,
        distributorPublicKey: configuredDistributorWallet,
        distributorHasTrustline: true,
        distributorBalance: '0',
      }),
      issueToDistribution: jest.fn().mockResolvedValue({
        txHash: 'stellar-tx-hash',
        issuerPublicKey: issuerWallet,
        distributorPublicKey: configuredDistributorWallet,
      }),
    };

    spvService = {
      prepareDraftSpvForProject: jest.fn().mockResolvedValue({
        id: 41,
        readiness: {
          issuanceReady: true,
          blockingIssues: [],
        },
      }),
      assertSpvReadyForIssuance: jest.fn().mockResolvedValue({
        issuanceReady: true,
        blockingIssues: [],
      }),
      getSpvDetail: jest.fn().mockResolvedValue({
        id: 41,
        name: 'Series SPV',
        status: 'ready',
        jurisdiction: 'Australia',
        structureType: 'MIS',
        sponsorEntityId: 61,
        sponsorEntityName: 'RegenX DevCo',
        readiness: {
          issuanceReady: true,
          requiredRolesComplete: true,
          custodyComplete: true,
          blockingIssues: [],
        },
        linkedParties: [],
      }),
      createSeriesForProject: jest.fn().mockResolvedValue({
        spv: { id: 41 },
        series: {
          id: 82,
          name: 'Series A',
          tokenSymbol: 'RGX01',
          totalSupply: 1000,
        },
      }),
    };

    spvRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 41,
        name: 'Series SPV',
        legalEntityName: 'RegenX DevCo',
        sponsorEntityId: 61,
        status: 'active',
      }),
      save: jest.fn(async (value) => value),
    };

    legalEntityRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 61,
        entityName: 'RegenX DevCo',
        status: 'active',
      }),
    };

    projectWalletAuditRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    auditLogRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    custodyChangeRequestRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 901, ...value })),
    };

    service = new ProjectService(
      projectRepo as any,
      { find: jest.fn() } as any,
      { count: jest.fn(), create: jest.fn(), save: jest.fn() } as any,
      {
        findOne: jest.fn().mockResolvedValue({
          primaryWalletAddress: developerWallet,
          legalEntityName: 'RegenX DevCo',
          custodyMode: 'self_custody',
        }),
      } as any,
      ownershipRepo,
      { createQueryBuilder: jest.fn() } as any,
      { createQueryBuilder: jest.fn() } as any,
      { findBy: jest.fn(), findOne: jest.fn().mockResolvedValue(null) } as any,
      spvRepo as any,
      legalEntityRepo as any,
      projectWalletAuditRepo as any,
      auditLogRepo as any,
      custodyChangeRequestRepo as any,
      {} as any,
      assetService as any,
      spvService as any,
      {
        fromProjectToProjectResponseDto: jest.fn((project) => project),
      } as unknown as ProjectMapper,
      { createNotification: jest.fn() } as unknown as NotificationService,
    );

    jest
      .spyOn(service as any, 'serializeProject')
      .mockImplementation(async (project: ProjectEntity) => project);
  });

  it('issues successfully using the configured platform distributor wallet', async () => {
    const project = buildProject({
      distributorWalletPublic: configuredDistributorWallet,
    });
    projectRepo.findOne!.mockResolvedValue(project);

    const result = await service.issueProject('1', 'ready', 7);

    expect(assetService.getDistributionIssuancePreflight).toHaveBeenCalledWith(
      'RGX01',
      configuredDistributorWallet,
    );
    expect(assetService.issueToDistribution).toHaveBeenCalledWith(
      'RGX01',
      '1000',
      configuredDistributorWallet,
    );
    expect(result.status).toBe('issued');
    expect(result.issuanceStatus).toBe('completed');
    expect(result.issuanceTxHash).toBe('stellar-tx-hash');
    expect(result.distributorWalletPublic).toBe(configuredDistributorWallet);
    expect(result.issuanceFailureReason).toBeNull();
  });

  it('updates wallet configuration pre-issuance and records audit history', async () => {
    const project = buildProject({
      status: 'approved',
      proceedsWalletAddress: null as any,
    });
    projectRepo.findOne!.mockResolvedValue(project);

    const result = await service.updateProjectWalletConfig(
      '1',
      {
        custodyMode: 'regenx_custody',
        proceedsWalletAddress: proceedsWallet,
        reason: 'Move project to RegenX custody before issuance',
      },
      17,
    );

    expect(project.custodyMode).toBe('regenx_custody');
    expect(project.proceedsWalletAddress).toBe(proceedsWallet);
    expect(project.walletLastUpdatedBy).toBe(17);
    expect(projectWalletAuditRepo.save).toHaveBeenCalled();
    expect(result.proceedsWalletAddress).toBe(proceedsWallet);
  });

  it('rejects invalid wallet format during wallet configuration updates', async () => {
    const project = buildProject();
    projectRepo.findOne!.mockResolvedValue(project);

    await expect(
      service.updateProjectWalletConfig(
        '1',
        {
          distributionWalletAddress: 'INVALID_WALLET',
          reason: 'Broken data should be rejected',
        },
        7,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks issuance readiness when required wallets are missing', async () => {
    const project = buildProject({
      distributorWalletPublic: null as any,
    });
    projectRepo.findOne!.mockResolvedValue(project);

    await expect(service.issueProject('1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
  });

  it('rejects issuance when the token symbol is missing', async () => {
    const project = buildProject({ tokenSymbol: '' as any });
    projectRepo.findOne!.mockResolvedValue(project);
    spvService.createSeriesForProject!.mockResolvedValueOnce({
      spv: { id: 41 },
      series: { id: 82, name: 'Series A', tokenSymbol: '', totalSupply: 1000 },
    } as any);

    await expect(service.issueProject('1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
  });

  it('rejects issuance when the token supply is missing', async () => {
    const project = buildProject({ tokenSupply: 0 });
    projectRepo.findOne!.mockResolvedValue(project);
    spvService.createSeriesForProject!.mockResolvedValueOnce({
      spv: { id: 41 },
      series: { id: 82, name: 'Series A', tokenSymbol: 'RGX01', totalSupply: 0 },
    } as any);

    await expect(service.issueProject('1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
  });

  it('rejects issuance when Stellar configuration is missing', async () => {
    const project = buildProject();
    projectRepo.findOne!.mockResolvedValue(project);
    assetService.getMissingCoreConfigKeys!.mockReturnValueOnce([
      'STELLAR_ISSUER_PUBLIC_KEY',
    ]);

    await expect(service.issueProject('1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
  });

  it('persists failure details when Stellar submission fails', async () => {
    const project = buildProject();
    projectRepo.findOne!.mockResolvedValue(project);
    assetService.issueToDistribution!.mockRejectedValueOnce(
      new Error('Distributor trustline could not be established'),
    );

    await expect(service.issueProject('1')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(project.status).toBe('approved');
    expect(project.issuanceStatus).toBe('failed');
    expect(project.issuanceFailureReason).toContain('Distributor trustline');
    expect(project.issuanceTxHash).toBeNull();
  });

  it('completes safely on retry without minting again when supply is already present', async () => {
    const project = buildProject({
      issuanceStatus: 'failed',
      issuanceFailureReason: 'Previous timeout',
    } as any);
    projectRepo.findOne!.mockResolvedValue(project);
    assetService.getDistributionIssuancePreflight!.mockResolvedValueOnce({
      issuerPublicKey: issuerWallet,
      distributorPublicKey: configuredDistributorWallet,
      distributorHasTrustline: true,
      distributorBalance: '1000',
    });

    const result = await service.issueProject('1', 'retry', 8);

    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
    expect(result.status).toBe('issued');
    expect(result.issuanceStatus).toBe('completed');
    expect(result.issuanceFailureReason).toBeNull();
  });

  it('does not issue again when the project is already issued', async () => {
    const project = buildProject({
      status: 'issued',
      issuanceStatus: 'completed',
      issuanceTxHash: 'existing-hash',
    } as any);
    projectRepo.findOne!.mockResolvedValue(project);

    const result = await service.issueProject('1');

    expect(result.issuanceTxHash).toBe('existing-hash');
    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
    expect(spvService.createSeriesForProject).not.toHaveBeenCalled();
  });

  it('blocks issuance when SPV readiness is incomplete', async () => {
    const project = buildProject();
    projectRepo.findOne!.mockResolvedValue(project);
    spvService.assertSpvReadyForIssuance!.mockRejectedValueOnce(
      new BadRequestException('SPV readiness is blocked'),
    );

    await expect(service.issueProject('1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
  });

  it('blocks duplicate pending issuance attempts', async () => {
    const project = buildProject({ issuanceStatus: 'pending' } as any);
    projectRepo.findOne!.mockResolvedValue(project);

    await expect(service.issueProject('1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(assetService.issueToDistribution).not.toHaveBeenCalled();
  });

  it('blocks direct wallet overwrite after issuance has locked configuration', async () => {
    const project = buildProject({
      status: 'issued',
      issuedAt: new Date(),
      issuanceTxHash: 'stellar-tx-hash',
      walletConfigLockedAt: new Date(),
    } as any);
    projectRepo.findOne!.mockResolvedValue(project);

    await expect(
      service.updateProjectWalletConfig(
        '1',
        {
          distributionWalletAddress: Keypair.random().publicKey(),
          reason: 'Attempting direct overwrite after issuance',
        },
        11,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a post-issuance wallet change request with a reason', async () => {
    const requestedWallet = Keypair.random().publicKey();
    const project = buildProject({
      status: 'issued',
      issuedAt: new Date(),
      issuanceTxHash: 'stellar-tx-hash',
      walletConfigLockedAt: new Date(),
    } as any);
    projectRepo.findOne!.mockResolvedValue(project);

    const result = await service.requestPostIssuanceWalletChange(
      '1',
      {
        reason: 'Distribution wallet needs migration after issuance',
        changes: {
          distributionWalletAddress: requestedWallet,
        },
      },
      22,
    );

    expect(projectWalletAuditRepo.save).toHaveBeenCalled();
    expect(custodyChangeRequestRepo.save).toHaveBeenCalled();
    expect(result.changeType).toBe('post_issuance_change_request');
    expect(result.requestedChanges[0].newValue).toBe(requestedWallet);
  });

  it('surfaces invalid RegenX custody configuration as blocked readiness', async () => {
    const project = buildProject({
      custodyMode: 'regenx_custody',
      distributorWalletPublic: null as any,
    });
    projectRepo.findOne!.mockResolvedValue(project);

    const result = await service.validateProjectWalletReadiness('1');

    expect(result.readinessStatus).toBe('blocked');
    expect(result.blockingReasons.join(' ')).toContain('RegenX custody');
  });

  it('requires a reason for a post-issuance wallet change request', async () => {
    const project = buildProject({
      status: 'issued',
      issuedAt: new Date(),
      issuanceTxHash: 'stellar-tx-hash',
      walletConfigLockedAt: new Date(),
    } as any);
    projectRepo.findOne!.mockResolvedValue(project);

    await expect(
      service.requestPostIssuanceWalletChange(
        '1',
        {
          reason: '   ',
          changes: {
            distributionWalletAddress: Keypair.random().publicKey(),
          },
        },
        22,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('links a project to an entity and SPV safely with audit logging', async () => {
    const project = buildProject({
      sponsorEntityId: null as any,
      spvId: null as any,
    });
    projectRepo.findOne!.mockResolvedValue(project);

    const result = await service.updateProjectEntitySpvLinkage(
      '1',
      {
        sponsorEntityId: 61,
        spvId: 41,
        reason: 'Prepare issuance structure',
      },
      19,
    );

    expect(project.sponsorEntityId).toBe(61);
    expect(project.spvId).toBe(41);
    expect(auditLogRepo.save).toHaveBeenCalled();
    expect(result.sponsorEntity?.id).toBe(61);
    expect(result.linkedSpv?.id).toBe(41);
  });

  it('prepares issuance by creating or refreshing the project draft SPV', async () => {
    const project = buildProject({
      status: 'approved',
      spvId: null as any,
    });
    projectRepo.findOne!.mockResolvedValue(project);

    const result = await service.prepareProjectForIssuance(
      '1',
      77,
      'Prepare issuance structure',
    );

    expect(spvService.prepareDraftSpvForProject).toHaveBeenCalledWith(
      1,
      77,
      'Prepare issuance structure',
    );
    expect(result.id).toBe(41);
  });

  it('approves a developer custody change request and writes an audit event', async () => {
    custodyChangeRequestRepo.findOne!.mockResolvedValue({
      id: 77,
      projectId: null,
      participantType: 'developer',
      participantDeveloperProfileId: 12,
      currentCustodyMode: 'self_custody',
      requestedCustodyMode: 'regenx_custody',
      status: 'pending',
      reason: 'Move to RegenX custody',
      participantLabel: 'Developer Co',
    });

    (service as any).developerProfileRepo.findOne = jest.fn().mockResolvedValue({
      id: 12,
      custodyMode: 'self_custody',
      custodyChangeStatus: 'pending_review',
      custodyChangeRequestedMode: 'regenx_custody',
    });
    (service as any).developerProfileRepo.save = jest.fn(async (value) => value);

    const result = await service.reviewCustodyChangeRequest(
      '77',
      {
        status: 'approved',
        adminNotes: 'Looks good',
      },
      55,
    );

    expect(result.status).toBe('approved');
    expect((service as any).developerProfileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        custodyMode: 'regenx_custody',
        custodyChangeStatus: 'approved',
      }),
    );
    expect(auditLogRepo.save).toHaveBeenCalled();
  });

  it('rejects a developer custody change request without applying the requested mode', async () => {
    custodyChangeRequestRepo.findOne!.mockResolvedValue({
      id: 88,
      projectId: null,
      participantType: 'developer',
      participantDeveloperProfileId: 12,
      currentCustodyMode: 'self_custody',
      requestedCustodyMode: 'regenx_custody',
      status: 'pending',
      reason: 'Move to RegenX custody',
      participantLabel: 'Developer Co',
    });

    (service as any).developerProfileRepo.findOne = jest.fn().mockResolvedValue({
      id: 12,
      custodyMode: 'self_custody',
      custodyChangeStatus: 'pending_review',
      custodyChangeRequestedMode: 'regenx_custody',
    });
    (service as any).developerProfileRepo.save = jest.fn(async (value) => value);

    const result = await service.reviewCustodyChangeRequest(
      '88',
      {
        status: 'rejected',
        adminNotes: 'Incomplete documentation',
      },
      55,
    );

    expect(result.status).toBe('rejected');
    expect((service as any).developerProfileRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        custodyChangeStatus: 'rejected',
      }),
    );
  });

  it('writes an audit event when issuance is blocked due to custody', async () => {
    const project = buildProject();
    projectRepo.findOne!.mockResolvedValue(project);

    await service.blockProjectIssuanceForCustody(
      '1',
      'Custody documents missing',
      'Blocking until docs are complete',
      42,
    );

    expect(project.issuanceBlockedByCustody).toBe(true);
    expect(auditLogRepo.save).toHaveBeenCalled();
  });
});
