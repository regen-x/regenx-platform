import { ForbiddenException } from '@nestjs/common';

import { InvestorVerificationService } from './investor-verification.service';

describe('InvestorVerificationService test override gating', () => {
  let service: InvestorVerificationService;
  let verificationRepo: any;
  let userRepo: any;
  let auditLogRepo: any;
  let verificationRow: any;
  let queueRows: any[];
  let detailRow: any;
  let originalNodeEnv: string | undefined;
  let originalFlag: string | undefined;
  let originalAdminFlag: string | undefined;
  let userQueryBuilder: any;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalFlag = process.env.ENABLE_TEST_VERIFICATION_OVERRIDE;
    originalAdminFlag = process.env.ENABLE_ADMIN_TEST_OVERRIDE;

    verificationRow = null;
    queueRows = [];
    detailRow = null;

    verificationRepo = {
      findOne: jest.fn(async ({ where }: any) => {
        if (where?.userId) {
          return verificationRow && verificationRow.userId === where.userId
            ? verificationRow
            : null;
        }

        if (where?.sumsubApplicantId) {
          return verificationRow &&
            verificationRow.sumsubApplicantId === where.sumsubApplicantId
            ? verificationRow
            : null;
        }

        return null;
      }),
      create: jest.fn((value: any) => ({
        id: value.id ?? 17,
        sumsubApplicantId: null,
        sumsubStatus: 'not_started',
        adminReviewStatus: 'pending',
        investorEligibilityStatus: 'blocked',
        wholesaleStatus: 'pending',
        verificationSource: null,
        wholesaleVerificationSource: null,
        isTestVerification: false,
        testIdentityVerified: false,
        testAmlApproved: false,
        testWholesaleApproved: false,
        testInvestmentOverride: false,
        testInvestmentOverrideSetAt: null,
        testInvestmentOverrideSetBy: null,
        testInvestmentOverrideNote: null,
        wholesaleCertificateKey: null,
        wholesaleCertificateOriginalName: null,
        wholesaleCertificateExpiryDate: null,
        amlAnswers: null,
        reviewedBy: null,
        reviewNotes: null,
        reviewedAt: null,
        testVerificationAppliedAt: null,
        testVerificationAppliedBy: null,
        ...value,
      })),
      save: jest.fn(async (value: any) => {
        verificationRow = { ...value };
        return verificationRow;
      }),
      createQueryBuilder: jest.fn(),
    };

    userQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(async () => queueRows),
      getRawOne: jest.fn(async () => detailRow),
    };

    userRepo = {
      findOne: jest.fn(async ({ where }: any) => {
        if (Number(where?.id) === 42) {
          return {
            id: 42,
            email: 'investor@example.com',
            type: 'wholesaleInvestor',
          };
        }

        return null;
      }),
      createQueryBuilder: jest.fn(() => userQueryBuilder),
    };

    auditLogRepo = {
      create: jest.fn((value: any) => value),
      save: jest.fn(async (value: any) => value),
    };

    service = new InvestorVerificationService(
      verificationRepo,
      userRepo,
      auditLogRepo,
      { query: jest.fn() } as any,
      { createNotification: jest.fn() } as any,
    );
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ENABLE_TEST_VERIFICATION_OVERRIDE = originalFlag;
    process.env.ENABLE_ADMIN_TEST_OVERRIDE = originalAdminFlag;
  });

  it('applies a non-production test verification override and unlocks investing', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_TEST_VERIFICATION_OVERRIDE;

    const snapshot = await service.applyTestVerificationOverride('42', {
      actorEmail: 'qa@regenx.test',
      reason: 'Eliot Energy funding flow QA',
    });

    await expect(service.assertInvestorCanInvest('42')).resolves.toEqual(
      expect.objectContaining({ userId: '42' }),
    );
    expect(snapshot.canInvest).toBe(true);
    expect(snapshot.testVerificationActive).toBe(true);
    expect(snapshot.isTestVerification).toBe(true);
    expect(snapshot.verificationSource).toBe('test_override');
    expect(snapshot.wholesaleVerificationSource).toBe('test_override');
    expect(snapshot.wholesaleCertificateOriginalName).toContain(
      'test-wholesale-certificate',
    );
    expect(auditLogRepo.save).toHaveBeenCalled();
  });

  it('enables an admin test investment override in non-production without changing real compliance statuses', async () => {
    process.env.NODE_ENV = 'staging';
    delete process.env.ENABLE_ADMIN_TEST_OVERRIDE;

    verificationRow = verificationRepo.create({
      userId: '42',
      sumsubStatus: 'pending',
      adminReviewStatus: 'pending',
      investorEligibilityStatus: 'blocked',
    });

    const snapshot = await service.enableAdminTestInvestmentOverride('42', {
      actorUserId: 7,
      actorRole: 'admin',
      actorEmail: 'admin@regenx.test',
      note: 'Eliot Energy investor QA',
    });

    expect(snapshot.canInvest).toBe(true);
    expect(snapshot.isEligible).toBe(true);
    expect(snapshot.eligibilitySource).toBe('test_override');
    expect(snapshot.sumsubStatus).toBe('pending');
    expect(snapshot.adminReviewStatus).toBe('pending');
    expect(snapshot.testOverrideActive).toBe(true);
    expect(snapshot.verificationOverrideMode).toBe('testnet');
    expect(snapshot.testInvestmentOverride).toBe(true);
    expect(snapshot.testInvestmentOverrideNote).toBe('Eliot Energy investor QA');
    expect(auditLogRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'test_override_enabled',
      }),
    );
  });

  it('disabling the admin test override re-locks the investor when real approvals are still missing', async () => {
    process.env.NODE_ENV = 'development';

    verificationRow = verificationRepo.create({
      userId: '42',
      sumsubStatus: 'pending',
      adminReviewStatus: 'pending',
      investorEligibilityStatus: 'approved',
      testInvestmentOverride: true,
      testInvestmentOverrideSetAt: new Date('2026-04-22T00:00:00.000Z'),
      testInvestmentOverrideSetBy: '7',
      testInvestmentOverrideNote: 'Testing',
    });

    const snapshot = await service.disableAdminTestInvestmentOverride('42', {
      actorUserId: 7,
      actorRole: 'admin',
      actorEmail: 'admin@regenx.test',
      note: 'Cleanup after staging test',
    });

    expect(snapshot.canInvest).toBe(false);
    expect(snapshot.isEligible).toBe(false);
    expect(snapshot.eligibilitySource).toBe('none');
    expect(snapshot.testOverrideActive).toBe(false);
    expect(snapshot.verificationOverrideMode).toBe('none');
    expect(snapshot.testInvestmentOverride).toBe(false);
    await expect(service.assertInvestorCanInvest('42')).rejects.toThrow(
      'Investor identity and compliance verification is not approved yet',
    );
    expect(auditLogRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'test_override_disabled',
      }),
    );
  });

  it('blocks the admin override in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_ADMIN_TEST_OVERRIDE = 'true';

    await expect(
      service.enableAdminTestInvestmentOverride('42', {
        actorUserId: 7,
        actorRole: 'admin',
        actorEmail: 'admin@regenx.test',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks applying a test override in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_TEST_VERIFICATION_OVERRIDE = 'true';

    await expect(
      service.applyTestVerificationOverride('42', {
        actorEmail: 'qa@regenx.test',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(auditLogRepo.save).not.toHaveBeenCalled();
  });

  it('does not allow a synthetic certificate override to unlock investing in production', async () => {
    process.env.NODE_ENV = 'production';

    verificationRow = verificationRepo.create({
      userId: '42',
      verificationSource: 'test_override',
      wholesaleVerificationSource: 'test_override',
      isTestVerification: true,
      testIdentityVerified: true,
      testAmlApproved: true,
      testWholesaleApproved: true,
      wholesaleStatus: 'approved',
      wholesaleCertificateOriginalName: 'test-wholesale-certificate-42.pdf',
      wholesaleCertificateExpiryDate: '2099-01-01',
    });

    const snapshot = await service.getEligibilitySnapshot('42');

    expect(snapshot.canInvest).toBe(false);
    expect(snapshot.verificationOverrideMode).toBe('none');
    expect(snapshot.testVerificationActive).toBe(false);
    await expect(service.assertInvestorCanInvest('42')).rejects.toThrow(
      'Investor identity and compliance verification is not approved yet',
    );
  });

  it('keeps real production approval logic unchanged', async () => {
    process.env.NODE_ENV = 'production';

    verificationRow = verificationRepo.create({
      userId: '42',
      sumsubStatus: 'approved',
      adminReviewStatus: 'approved',
      investorEligibilityStatus: 'approved',
    });

    const snapshot = await service.getEligibilitySnapshot('42');

    expect(snapshot.canInvest).toBe(true);
    expect(snapshot.testVerificationActive).toBe(false);
    await expect(service.assertInvestorCanInvest('42')).resolves.toEqual(
      expect.objectContaining({ userId: '42' }),
    );
  });

  it('includes a new investor in the admin queue even when no verification row exists yet', async () => {
    process.env.NODE_ENV = 'development';

    queueRows = [
      {
        id: null,
        userId: '42',
        email: 'investor@example.com',
        fullname: 'New Investor',
        phoneNumber: '+61000000000',
        sumsubStatus: null,
        adminReviewStatus: null,
        investorEligibilityStatus: null,
        wholesaleStatus: null,
      },
    ];

    const rows = await service.getAdminQueue();

    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe('42');
    expect(rows[0].sumsubStatus).toBe('not_started');
    expect(rows[0].adminReviewStatus).toBe('pending');
    expect(rows[0].reviewState).toBe('incomplete');
    expect(rows[0].eligibilitySource).toBe('none');
    expect(rows[0].isEligible).toBe(false);
    expect(rows[0].testOverrideActive).toBe(false);
  });

  it('returns admin detail safely when verification child fields are still missing', async () => {
    process.env.NODE_ENV = 'development';

    detailRow = {
      id: 17,
      userId: '42',
      email: 'investor@example.com',
      fullname: 'Sparse Investor',
      phoneNumber: '+61000000000',
      sumsubStatus: null,
      adminReviewStatus: null,
      investorEligibilityStatus: null,
      wholesaleStatus: null,
      reviewNotes: null,
      amlAnswers: null,
      accountCreatedAt: '2026-04-22T00:00:00.000Z',
      accountUpdatedAt: '2026-04-22T00:00:00.000Z',
    };

    const detail = await service.getAdminDetail('42');

    expect(detail.userId).toBe('42');
    expect(detail.sumsubStatus).toBe('not_started');
    expect(detail.adminReviewStatus).toBe('pending');
    expect(detail.reviewState).toBe('incomplete');
    expect(detail.eligibilitySource).toBe('none');
    expect(detail.amlAnswers).toBeNull();
    expect(detail.testOverrideActive).toBe(false);
  });

  it('shows testing_only in the admin queue when a non-production test override is active', async () => {
    process.env.NODE_ENV = 'staging';

    queueRows = [
      {
        id: 17,
        userId: '42',
        email: 'investor@example.com',
        fullname: 'Investor QA',
        phoneNumber: '+61000000000',
        sumsubStatus: 'pending',
        adminReviewStatus: 'pending',
        investorEligibilityStatus: 'blocked',
        wholesaleStatus: 'pending',
        testInvestmentOverride: true,
        testInvestmentOverrideSetAt: '2026-04-22T00:00:00.000Z',
        testInvestmentOverrideSetBy: '7',
        testInvestmentOverrideNote: 'QA only',
      },
    ];

    const rows = await service.getAdminQueue();

    expect(rows[0].reviewState).toBe('testing_only');
    expect(rows[0].eligibilitySource).toBe('test_override');
    expect(rows[0].isEligible).toBe(true);
    expect(rows[0].testOverrideActive).toBe(true);
  });

  it('accepts both current and legacy investor user type values in the admin queue filter', async () => {
    process.env.NODE_ENV = 'development';

    await service.getAdminQueue();

    expect(userQueryBuilder.where).toHaveBeenCalledWith(
      'user.type IN (:...userTypes)',
      expect.objectContaining({
        userTypes: ['wholesaleInvestor', 'wholesale_investor'],
      }),
    );
  });

  it('backfills missing investor verification rows before returning the admin queue', async () => {
    process.env.NODE_ENV = 'development';

    userQueryBuilder.getRawMany
      .mockResolvedValueOnce([{ userId: '42' }])
      .mockResolvedValueOnce([
        {
          id: 17,
          userId: '42',
          email: 'investor@example.com',
          fullname: 'Backfilled Investor',
          phoneNumber: '+61000000000',
          sumsubStatus: null,
          adminReviewStatus: null,
          investorEligibilityStatus: null,
          wholesaleStatus: null,
          accountCreatedAt: '2026-04-22T00:00:00.000Z',
          accountUpdatedAt: '2026-04-22T00:00:00.000Z',
        },
      ]);

    const rows = await service.getAdminQueue();

    expect(verificationRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: '42',
          sumsubStatus: 'not_started',
          adminReviewStatus: 'pending',
        }),
      ]),
    );
    expect(rows[0].reviewState).toBe('incomplete');
    expect(rows[0].createdAt).toBe('2026-04-22T00:00:00.000Z');
  });
});
