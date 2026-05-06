import { SpvService } from './spv.service';

describe('SpvService', () => {
  let service: SpvService;
  let spvRepo: any;
  let projectRepo: any;
  let legalEntityRepo: any;
  let developerProfileRepo: any;
  let spvRoleRepo: any;
  let auditLogRepo: any;
  let projects: any[];
  let spvs: any[];
  let legalEntities: any[];
  let roleRows: any[];

  const buildProject = (overrides: Record<string, unknown> = {}) => ({
    id: 31,
    name: 'Solar Farm',
    status: 'approved',
    stage: 'issuance_prep',
    sponsorEntityId: 7,
    custodyMode: 'regenx_custody',
    custodySetupStatus: 'complete',
    custodyBlockReason: null,
    issuanceBlockedByCustody: false,
    jurisdiction: 'Australia',
    issuanceStatus: 'not_started',
    user: { id: 91 },
    payloadJson: {},
    ...overrides,
  });

  const buildSpv = (overrides: Record<string, unknown> = {}) => ({
    id: 11,
    name: 'Solar Farm SPV',
    legalEntityName: 'Solar Sponsor Pty Ltd',
    jurisdiction: 'Australia',
    structureType: 'MIS',
    status: 'draft',
    sponsorEntityId: 7,
    custodyModel: 'regenx_custody',
    projectId: 31,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  });

  const buildEntity = (overrides: Record<string, unknown> = {}) => ({
    id: 7,
    entityName: 'Solar Sponsor Pty Ltd',
    jurisdiction: 'Australia',
    status: 'active',
    operationalRole: 'sponsor',
    ...overrides,
  });

  const buildRole = (overrides: Record<string, unknown> = {}) => ({
    id: 101,
    spvId: 11,
    entityId: 7,
    role: 'sponsor',
    status: 'approved',
    source: 'manual',
    isRequired: true,
    isPrimary: true,
    confidenceScore: '0.95',
    approvedAt: new Date('2026-01-03T00:00:00.000Z'),
    approvedBy: 1,
    notes: null,
    entity: buildEntity(),
    ...overrides,
  });

  beforeEach(() => {
    projects = [buildProject()];
    spvs = [];
    legalEntities = [
      buildEntity(),
      buildEntity({
        id: 8,
        entityName: 'RegenX Custody Pty Ltd',
        operationalRole: 'custody_provider',
      }),
      buildEntity({
        id: 9,
        entityName: 'Solar Trustee Pty Ltd',
        operationalRole: 'trustee',
      }),
      buildEntity({
        id: 10,
        entityName: 'Solar Issuer Pty Ltd',
        operationalRole: 'issuer',
      }),
      buildEntity({
        id: 12,
        entityName: 'Solar Treasury Pty Ltd',
        operationalRole: 'proceeds_recipient',
      }),
    ];
    roleRows = [];

    spvRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        const next = {
          id: Number(value.id ?? 11),
          createdAt: value.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          ...value,
        };
        const index = spvs.findIndex((row) => row.id === next.id);
        if (index >= 0) {
          spvs[index] = next;
        } else {
          spvs.push(next);
        }
        return next;
      }),
      find: jest.fn(async () => [...spvs]),
      findOne: jest.fn(async (options) => {
        const where = options?.where ?? {};
        if (where.id != null) {
          return spvs.find((row) => row.id === Number(where.id)) ?? null;
        }
        if (where.projectId != null) {
          return spvs.find((row) => row.projectId === Number(where.projectId)) ?? null;
        }
        return null;
      }),
    };

    projectRepo = {
      find: jest.fn(async () => [...projects]),
      findOne: jest.fn(async (options) => {
        const where = options?.where ?? {};
        return projects.find((row) => row.id === Number(where.id)) ?? null;
      }),
      save: jest.fn(async (value) => {
        const index = projects.findIndex((row) => row.id === value.id);
        if (index >= 0) {
          projects[index] = { ...projects[index], ...value };
        } else {
          projects.push(value);
        }
        return value;
      }),
    };

    legalEntityRepo = {
      findOne: jest.fn(async (options) => {
        const where = options?.where ?? {};
        return legalEntities.find((row) => row.id === Number(where.id)) ?? null;
      }),
      findBy: jest.fn().mockResolvedValue([]),
      find: jest.fn(async () => [...legalEntities]),
    };

    developerProfileRepo = {
      findOne: jest.fn().mockResolvedValue({
        legalEntityName: 'Solar Sponsor Pty Ltd',
        tradingName: 'Solar Sponsor',
      }),
    };

    spvRoleRepo = {
      find: jest.fn(async (options) => {
        const where = options?.where ?? {};
        if (where.spvId != null) {
          const filtered = roleRows.filter((row) => row.spvId === Number(where.spvId));
          if (where.role != null) {
            return filtered.filter((row) => row.role === where.role);
          }
          return filtered;
        }
        return [...roleRows];
      }),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        const next = {
          id: Number(value.id ?? roleRows.length + 101),
          ...value,
        };
        const index = roleRows.findIndex((row) => row.id === next.id);
        if (index >= 0) {
          roleRows[index] = next;
        } else {
          roleRows.push(next);
        }
        return next;
      }),
    };

    auditLogRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };

    service = new SpvService(
      spvRepo as any,
      { findOne: jest.fn() } as any,
      projectRepo as any,
      legalEntityRepo as any,
      developerProfileRepo as any,
      spvRoleRepo as any,
      auditLogRepo as any,
    );
  });

  it('creates an SPV and writes an audit event', async () => {
    const result = await service.createSpv(
      {
        name: 'Solar Farm SPV',
        sponsorEntityId: 7,
        status: 'active',
        projectId: 31,
        reason: 'Initial SPV setup',
      },
      8,
    );

    expect(spvRepo.save).toHaveBeenCalled();
    expect(auditLogRepo.save).toHaveBeenCalled();
    expect(result.name).toBe('Solar Farm SPV');
    expect(result.sponsorEntityId).toBe(7);
  });

  it('creating an SPV inserts four default required roles', async () => {
    await service.createSpv(
      {
        name: 'Solar Farm SPV',
        sponsorEntityId: 7,
        status: 'draft',
        projectId: 31,
        reason: 'Initial SPV setup',
      },
      8,
    );

    const savedRoles = roleRows.filter((row) => row.spvId === 11);
    const defaultRoles = savedRoles.filter((row) =>
      ['sponsor', 'issuer', 'trustee', 'custodian'].includes(row.role),
    );
    expect(defaultRoles).toHaveLength(4);
    expect(defaultRoles.map((row) => row.role)).toEqual(
      expect.arrayContaining(['sponsor', 'issuer', 'trustee', 'custodian']),
    );
    expect(defaultRoles.every((row) => row.isRequired === true)).toBe(true);
  });

  it('default roles use suggested status except sponsor auto-linking', async () => {
    await service.createSpv(
      {
        name: 'Solar Farm SPV',
        sponsorEntityId: 7,
        status: 'draft',
        projectId: 31,
      },
      8,
    );

    const sponsorRole = roleRows.find((row) => row.role === 'sponsor');
    const issuerRole = roleRows.find((row) => row.role === 'issuer');
    const trusteeRole = roleRows.find((row) => row.role === 'trustee');
    const custodianRole = roleRows.find((row) => row.role === 'custodian');

    expect(sponsorRole).toMatchObject({
      entityId: 7,
      status: 'linked',
      isRequired: true,
    });
    expect(issuerRole).toMatchObject({ entityId: null, status: 'suggested' });
    expect(trusteeRole).toMatchObject({ entityId: null, status: 'suggested' });
    expect(custodianRole).toMatchObject({ entityId: null, status: 'suggested' });
  });

  it('approved project appears in the pipeline even without an SPV', async () => {
    const rows = await service.listIssuancePipeline();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      projectId: 31,
      spvId: null,
      readinessState: 'not_prepared',
    });
    expect(rows[0].blockers).toContain('SPV not prepared.');
  });

  it('project with draft SPV appears with the correct in-progress status', async () => {
    spvs = [buildSpv()];

    const rows = await service.listIssuancePipeline();

    expect(rows[0]).toMatchObject({
      projectId: 31,
      spvId: 11,
      spvStatus: 'draft',
      readinessState: 'in_progress',
    });
    expect(rows[0].blockers).toContain('SPV status is draft.');
  });

  it('readiness fields are correct for a fully prepared project', async () => {
    spvs = [
      buildSpv({
        status: 'ready',
      }),
    ];
    roleRows = [
      buildRole({
        role: 'trustee',
        entityId: 9,
        entity: legalEntities.find((row) => row.id === 9),
      }),
      buildRole({
        id: 102,
        role: 'sponsor',
        entityId: 7,
        entity: legalEntities.find((row) => row.id === 7),
      }),
      buildRole({
        id: 103,
        role: 'issuer',
        entityId: 10,
        entity: legalEntities.find((row) => row.id === 10),
      }),
      buildRole({
        id: 104,
        role: 'proceeds_recipient',
        entityId: 12,
        entity: legalEntities.find((row) => row.id === 12),
      }),
      buildRole({
        id: 105,
        role: 'custody_provider',
        entityId: 8,
        entity: legalEntities.find((row) => row.id === 8),
      }),
    ];

    const detail = await service.getIssuancePipelineDetailByProject(31);

    expect(detail.readiness).toMatchObject({
      linkedRequiredRoles: 5,
      totalRequiredRoles: 5,
      requiredRolesComplete: true,
      custodyComplete: true,
      issuanceReady: true,
      readinessState: 'ready',
    });
    expect(detail.blockers).toEqual([]);
  });

  it('blocker lists are correct when sponsor linkage and custody are incomplete', async () => {
    projects = [
      buildProject({
        sponsorEntityId: null,
        custodyMode: null,
        custodySetupStatus: 'blocked',
        custodyBlockReason: 'Wallet review pending',
        issuanceBlockedByCustody: true,
      }),
    ];
    spvs = [buildSpv({ sponsorEntityId: null })];
    roleRows = [
      buildRole({
        role: 'trustee',
        entityId: 9,
        entity: legalEntities.find((row) => row.id === 9),
        status: 'suggested',
      }),
    ];

    const detail = await service.getIssuancePipelineDetailByProject(31);

    expect(detail.readiness.readinessState).toBe('blocked');
    expect(detail.blockers).toEqual(
      expect.arrayContaining([
        'Sponsor entity not linked.',
        'Unapproved linked party suggestion for Trustee / Responsible Entity.',
        'Custody incomplete: custody mode is not configured.',
        'Custody incomplete: Wallet review pending',
        'Issuance blocked by custody: Wallet review pending',
      ]),
    );
  });

  it('prepare draft SPV action updates the pipeline', async () => {
    const before = await service.listIssuancePipeline();
    expect(before[0].spvId).toBeNull();

    await service.prepareDraftSpvForProject(31, 99, 'Prepare issuance');

    const after = await service.listIssuancePipeline();
    expect(after[0].spvId).toBe(11);
    expect(after[0].readinessState).not.toBe('not_prepared');
  });

  it('does not duplicate default roles on repeated draft preparation calls', async () => {
    spvs = [buildSpv()];
    projects = [buildProject({ spvId: 11 })];

    await service.prepareDraftSpvForProject(31, 99, 'Prepare issuance');
    await service.prepareDraftSpvForProject(31, 99, 'Prepare issuance again');

    const savedRoles = roleRows.filter((row) => row.spvId === 11);
    const groupedCounts = savedRoles.reduce<Record<string, number>>((acc, row) => {
      acc[row.role] = (acc[row.role] ?? 0) + 1;
      return acc;
    }, {});

    expect(groupedCounts).toMatchObject({
      sponsor: 1,
      issuer: 1,
      trustee: 1,
      custodian: 1,
    });
  });

  it('summary counts are correct', async () => {
    projects = [
      buildProject({ id: 31, name: 'No SPV Project' }),
      buildProject({ id: 32, name: 'Draft SPV Project', spvId: 12 }),
      buildProject({
        id: 33,
        name: 'Blocked Project',
        spvId: 13,
        custodySetupStatus: 'blocked',
        custodyBlockReason: 'Custody verification failed',
        issuanceBlockedByCustody: true,
      }),
      buildProject({
        id: 34,
        name: 'Ready Project',
        spvId: 14,
        sponsorEntityId: 7,
      }),
    ];
    spvs = [
      buildSpv({ id: 12, projectId: 32, status: 'draft' }),
      buildSpv({ id: 13, projectId: 33, status: 'ready' }),
      buildSpv({ id: 14, projectId: 34, status: 'ready' }),
    ];
    roleRows = [
      buildRole({
        id: 201,
        spvId: 14,
        role: 'trustee',
        entityId: 9,
        entity: legalEntities.find((row) => row.id === 9),
      }),
      buildRole({
        id: 202,
        spvId: 14,
        role: 'sponsor',
        entityId: 7,
        entity: legalEntities.find((row) => row.id === 7),
      }),
      buildRole({
        id: 203,
        spvId: 14,
        role: 'issuer',
        entityId: 10,
        entity: legalEntities.find((row) => row.id === 10),
      }),
      buildRole({
        id: 204,
        spvId: 14,
        role: 'proceeds_recipient',
        entityId: 12,
        entity: legalEntities.find((row) => row.id === 12),
      }),
      buildRole({
        id: 205,
        spvId: 14,
        role: 'custody_provider',
        entityId: 8,
        entity: legalEntities.find((row) => row.id === 8),
      }),
    ];

    const summary = await service.getIssuancePipelineSummary();

    expect(summary).toEqual({
      total: 4,
      notPrepared: 1,
      inProgress: 1,
      blocked: 1,
      ready: 1,
    });
  });
});
