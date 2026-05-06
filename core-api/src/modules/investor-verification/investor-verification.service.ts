import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InvestorVerificationEntity } from './entities/investor-verification.entity';
import { UserEntity } from '../iam/user/infrastructure/persistence/entities/user.entity';
import { NotificationService } from '../notification/application/service/notification.service';
import { NotificationType } from '../notification/infrastructure/persistence/entities/notification.entity';
import { AuditLogEntity } from '../project/infrastructure/persistence/entities/audit-log.entity';
import { UserType } from '../iam/user/domain/user-type.enum';
import {
  getDefaultTestVerificationExpiryDate,
  isAdminTestOverrideEnabled,
  isTestVerificationOverrideEnabled,
  isVerificationExpiryActive,
  NO_ELIGIBILITY_SOURCE,
  REAL_COMPLIANCE_SOURCE,
  TEST_VERIFICATION_SOURCE,
} from './investor-verification-test-override.util';
import { CustodyAccountService } from '../custody/application/service/custody-account.service';

type SumsubStatus =
  | 'not_started'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'review_required';
type AdminReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'more_info_required';
type InvestorEligibilityStatus = 'blocked' | 'approved' | 'suspended';
type EligibilitySource =
  | typeof REAL_COMPLIANCE_SOURCE
  | typeof TEST_VERIFICATION_SOURCE
  | typeof NO_ELIGIBILITY_SOURCE;
type VerificationOverrideMode = 'none' | 'testnet';
type ReviewState =
  | 'incomplete'
  | 'admin_pending'
  | 'approved'
  | 'more_info_required'
  | 'rejected'
  | 'eligibility_blocked'
  | 'eligibility_suspended'
  | 'testing_only';
type WholesaleStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'requires_more_info';
const ADMIN_QUEUE_INVESTOR_USER_TYPES = [
  UserType.WHOLESALE_INVESTOR,
  'wholesale_investor',
] as const;
type VerificationSnapshot = Pick<
  InvestorVerificationEntity,
  | 'userId'
  | 'sumsubApplicantId'
  | 'sumsubStatus'
  | 'adminReviewStatus'
  | 'investorEligibilityStatus'
  | 'wholesaleStatus'
  | 'verificationSource'
  | 'wholesaleVerificationSource'
  | 'isTestVerification'
  | 'testIdentityVerified'
  | 'testAmlApproved'
  | 'testWholesaleApproved'
  | 'testInvestmentOverride'
  | 'verificationOverrideMode'
  | 'testInvestmentOverrideSetAt'
  | 'testInvestmentOverrideSetBy'
  | 'testInvestmentOverrideNote'
  | 'wholesaleCertificateKey'
  | 'wholesaleCertificateOriginalName'
  | 'wholesaleCertificateExpiryDate'
  | 'amlAnswers'
  | 'reviewedBy'
  | 'reviewNotes'
  | 'reviewedAt'
  | 'testVerificationAppliedAt'
  | 'testVerificationAppliedBy'
  | 'createdAt'
  | 'updatedAt'
> & {
  id: number | null;
  email: string | null;
  fullname: string | null;
  phoneNumber: string | null;
  accountCreatedAt: string | null;
  accountUpdatedAt: string | null;
};

@Injectable()
export class InvestorVerificationService {
  private readonly tableColumnsCache = new Map<string, Set<string>>();
  private readonly logger = new Logger(InvestorVerificationService.name);

  constructor(
    @InjectRepository(InvestorVerificationEntity)
    private readonly repo: Repository<InvestorVerificationEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,

    @Inject(DataSource)
    private readonly dataSource: DataSource,

    private readonly notificationService: NotificationService,

    private readonly custodyAccountService: CustodyAccountService,
  ) {}

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    const cached = this.tableColumnsCache.get(tableName);
    if (cached) {
      return cached;
    }

    const rows = await this.dataSource.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
      `,
      [tableName],
    );

    const columns = new Set<string>(
      Array.isArray(rows)
        ? rows.map((row: { column_name?: string }) => String(row.column_name || ''))
        : [],
    );
    this.tableColumnsCache.set(tableName, columns);
    return columns;
  }

  private optionalColumnSelect(
    columns: Set<string>,
    columnName: string,
    alias: string,
  ): string {
    return columns.has(columnName)
      ? `verification.${columnName} AS "${alias}"`
      : `NULL AS "${alias}"`;
  }

  private getDerivedEligibilityStatus(
    row: Pick<
      InvestorVerificationEntity,
      | 'sumsubStatus'
      | 'adminReviewStatus'
      | 'investorEligibilityStatus'
      | 'isTestVerification'
      | 'verificationSource'
      | 'wholesaleVerificationSource'
      | 'testIdentityVerified'
      | 'testAmlApproved'
      | 'testWholesaleApproved'
      | 'testInvestmentOverride'
      | 'verificationOverrideMode'
      | 'testInvestmentOverrideSetAt'
      | 'testInvestmentOverrideSetBy'
      | 'testInvestmentOverrideNote'
      | 'wholesaleCertificateExpiryDate'
    >,
  ): InvestorEligibilityStatus {
    if (this.getEligibilitySource(row) !== NO_ELIGIBILITY_SOURCE) {
      return 'approved';
    }

    if (
      row.investorEligibilityStatus === 'approved' &&
      row.adminReviewStatus === 'rejected'
    ) {
      return 'suspended';
    }

    return 'blocked';
  }

  private hasRealApproval(
    row: Pick<InvestorVerificationEntity, 'sumsubStatus' | 'adminReviewStatus'>,
  ) {
    return row.sumsubStatus === 'approved' && row.adminReviewStatus === 'approved';
  }

  private hasActiveTestVerificationOverride(
    row: Pick<
      InvestorVerificationEntity,
      | 'isTestVerification'
      | 'verificationSource'
      | 'wholesaleVerificationSource'
      | 'testIdentityVerified'
      | 'testAmlApproved'
      | 'testWholesaleApproved'
      | 'wholesaleCertificateExpiryDate'
    >,
  ) {
    return (
      isTestVerificationOverrideEnabled() &&
      row.isTestVerification === true &&
      row.verificationSource === TEST_VERIFICATION_SOURCE &&
      row.wholesaleVerificationSource === TEST_VERIFICATION_SOURCE &&
      row.testIdentityVerified === true &&
      row.testAmlApproved === true &&
      row.testWholesaleApproved === true &&
      isVerificationExpiryActive(row.wholesaleCertificateExpiryDate)
    );
  }

  private hasActiveTestInvestmentOverride(
    row: Pick<
      InvestorVerificationEntity,
      | 'testInvestmentOverride'
      | 'verificationOverrideMode'
      | 'testInvestmentOverrideSetAt'
      | 'testInvestmentOverrideSetBy'
    >,
  ) {
    return (
      isAdminTestOverrideEnabled() &&
      (row.verificationOverrideMode === 'testnet' ||
        (row.testInvestmentOverride === true &&
          Boolean(row.testInvestmentOverrideSetAt) &&
          Boolean(String(row.testInvestmentOverrideSetBy ?? '').trim())))
    );
  }

  private getEligibilitySource(
    row: Pick<
      InvestorVerificationEntity,
      | 'sumsubStatus'
      | 'adminReviewStatus'
      | 'isTestVerification'
      | 'verificationSource'
      | 'wholesaleVerificationSource'
      | 'testIdentityVerified'
      | 'testAmlApproved'
      | 'testWholesaleApproved'
      | 'wholesaleCertificateExpiryDate'
      | 'testInvestmentOverride'
      | 'verificationOverrideMode'
      | 'testInvestmentOverrideSetAt'
      | 'testInvestmentOverrideSetBy'
    >,
  ): EligibilitySource {
    if (this.hasRealApproval(row)) {
      return REAL_COMPLIANCE_SOURCE;
    }

    if (
      this.hasActiveTestInvestmentOverride(row) ||
      this.hasActiveTestVerificationOverride(row)
    ) {
      return TEST_VERIFICATION_SOURCE;
    }

    return NO_ELIGIBILITY_SOURCE;
  }

  private async writeAuditLog(params: {
    actorUserId?: number | null;
    actorRole?: string | null;
    entityId: number;
    action: string;
    detailsJson?: Record<string, unknown>;
  }) {
    const row = this.auditLogRepo.create({
      actor: params.actorUserId ? ({ id: params.actorUserId } as any) : null,
      actorRole: params.actorRole || 'system',
      entityType: 'InvestorVerification',
      entityId: params.entityId,
      action: params.action,
      detailsJson: params.detailsJson ?? null,
    } as any);

    try {
      await this.auditLogRepo.save(row);
    } catch (error) {
      console.error('Audit log write failed', error);
    }
  }

  private assertTestVerificationOverrideEnabled() {
    if (!isTestVerificationOverrideEnabled()) {
      throw new ForbiddenException(
        'Test verification override is unavailable in production environments',
      );
    }
  }

  private assertAdminTestOverrideEnabled() {
    if (!isAdminTestOverrideEnabled()) {
      throw new ForbiddenException(
        'Admin test override is unavailable in production environments',
      );
    }
  }

  private normalizeLegacyStatuses(row: InvestorVerificationEntity) {
    if (!row.adminReviewStatus) {
      row.adminReviewStatus =
        row.wholesaleStatus === 'approved'
          ? 'approved'
          : row.wholesaleStatus === 'rejected'
          ? 'rejected'
          : row.wholesaleStatus === 'requires_more_info'
          ? 'more_info_required'
          : 'pending';
    }

    if (!row.verificationOverrideMode) {
      row.verificationOverrideMode = 'none';
    }

    if (
      row.verificationOverrideMode !== 'testnet' &&
      (row.testInvestmentOverride === true ||
        (row.isTestVerification === true &&
          (row.verificationSource === TEST_VERIFICATION_SOURCE ||
            row.wholesaleVerificationSource === TEST_VERIFICATION_SOURCE)))
    ) {
      row.verificationOverrideMode = 'testnet';
    }

    row.investorEligibilityStatus = this.getDerivedEligibilityStatus(row);
    return row;
  }

  private normalizeQueueRow(rawRow: Record<string, any>) {
    const normalized: VerificationSnapshot = {
      id: rawRow.id ? Number(rawRow.id) : null,
      userId: String(rawRow.userId ?? ''),
      sumsubApplicantId: rawRow.sumsubApplicantId ?? null,
      sumsubStatus: (rawRow.sumsubStatus || 'not_started') as SumsubStatus,
      adminReviewStatus: (
        rawRow.adminReviewStatus ||
        (rawRow.wholesaleStatus === 'approved'
          ? 'approved'
          : rawRow.wholesaleStatus === 'rejected'
          ? 'rejected'
          : rawRow.wholesaleStatus === 'requires_more_info'
          ? 'more_info_required'
          : 'pending')
      ) as AdminReviewStatus,
      investorEligibilityStatus: (
        rawRow.investorEligibilityStatus || 'blocked'
      ) as InvestorEligibilityStatus,
      wholesaleStatus: (rawRow.wholesaleStatus || 'pending') as WholesaleStatus,
      verificationSource: rawRow.verificationSource ?? null,
      wholesaleVerificationSource: rawRow.wholesaleVerificationSource ?? null,
      isTestVerification: Boolean(rawRow.isTestVerification),
      testIdentityVerified: Boolean(rawRow.testIdentityVerified),
      testAmlApproved: Boolean(rawRow.testAmlApproved),
      testWholesaleApproved: Boolean(rawRow.testWholesaleApproved),
      testInvestmentOverride: Boolean(rawRow.testInvestmentOverride),
      verificationOverrideMode:
        rawRow.verificationOverrideMode === 'testnet' ? 'testnet' : 'none',
      testInvestmentOverrideSetAt: rawRow.testInvestmentOverrideSetAt ?? null,
      testInvestmentOverrideSetBy: rawRow.testInvestmentOverrideSetBy ?? null,
      testInvestmentOverrideNote: rawRow.testInvestmentOverrideNote ?? null,
      wholesaleCertificateKey: rawRow.wholesaleCertificateKey ?? null,
      wholesaleCertificateOriginalName:
        rawRow.wholesaleCertificateOriginalName ?? null,
      wholesaleCertificateExpiryDate:
        rawRow.wholesaleCertificateExpiryDate ?? null,
      amlAnswers: rawRow.amlAnswers ?? null,
      reviewedBy: rawRow.reviewedBy ?? null,
      reviewNotes: rawRow.reviewNotes ?? null,
      reviewedAt: rawRow.reviewedAt ?? null,
      testVerificationAppliedAt: rawRow.testVerificationAppliedAt ?? null,
      testVerificationAppliedBy: rawRow.testVerificationAppliedBy ?? null,
      createdAt: rawRow.createdAt ?? rawRow.accountCreatedAt ?? null,
      updatedAt:
        rawRow.updatedAt ?? rawRow.accountUpdatedAt ?? rawRow.accountCreatedAt ?? null,
      email: rawRow.email ?? null,
      fullname: rawRow.fullname ?? null,
      phoneNumber: rawRow.phoneNumber ?? null,
      accountCreatedAt: rawRow.accountCreatedAt ?? null,
      accountUpdatedAt: rawRow.accountUpdatedAt ?? null,
    };

    const investorEligibilityStatus = this.getDerivedEligibilityStatus(
      normalized,
    );
    const eligibilitySource = this.getEligibilitySource(normalized);
    const testVerificationActive = this.hasActiveTestVerificationOverride(normalized);
    const testOverrideActive =
      this.hasActiveTestInvestmentOverride(normalized) ||
      testVerificationActive;
    const verificationOverrideMode: VerificationOverrideMode = testOverrideActive
      ? 'testnet'
      : 'none';

    return {
      ...normalized,
      investorEligibilityStatus,
      isEligible: eligibilitySource !== NO_ELIGIBILITY_SOURCE,
      canInvest: eligibilitySource !== NO_ELIGIBILITY_SOURCE,
      eligibilitySource,
      testnetOverrideAvailable: isAdminTestOverrideEnabled(),
      testVerificationActive,
      testOverrideActive,
      // TEMPORARY TESTNET OVERRIDE
      // REMOVE BEFORE MAINNET/PRODUCTION LAUNCH
      verificationOverrideMode,
      reviewState: this.getReviewState({
        adminReviewStatus: normalized.adminReviewStatus,
        investorEligibilityStatus,
        eligibilitySource,
        sumsubStatus: normalized.sumsubStatus,
        testOverrideActive,
      }),
    };
  }

  private getReviewState(input: {
    testOverrideActive: boolean;
    adminReviewStatus: AdminReviewStatus;
    investorEligibilityStatus: InvestorEligibilityStatus;
    eligibilitySource: EligibilitySource;
    sumsubStatus: SumsubStatus;
  }): ReviewState {
    if (input.testOverrideActive && input.eligibilitySource === TEST_VERIFICATION_SOURCE) {
      return 'testing_only';
    }

    if (input.adminReviewStatus === 'rejected') {
      return 'rejected';
    }

    if (input.investorEligibilityStatus === 'suspended') {
      return 'eligibility_suspended';
    }

    if (input.adminReviewStatus === 'more_info_required') {
      return 'more_info_required';
    }

    if (input.eligibilitySource === REAL_COMPLIANCE_SOURCE) {
      return 'approved';
    }

    if (
      input.sumsubStatus === 'approved' &&
      input.adminReviewStatus === 'pending'
    ) {
      return 'admin_pending';
    }

    if (
      input.sumsubStatus === 'not_started' ||
      input.sumsubStatus === 'pending' ||
      input.sumsubStatus === 'review_required'
    ) {
      return 'incomplete';
    }

    if (input.investorEligibilityStatus === 'blocked') {
      return 'eligibility_blocked';
    }

    return 'incomplete';
  }

  private async saveWithDerivedStatuses(row: InvestorVerificationEntity) {
    this.normalizeLegacyStatuses(row);
    return this.repo.save(row);
  }

  private async backfillMissingInvestorRecords() {
    const missingRows = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin(
        InvestorVerificationEntity,
        'verification',
        'verification.user_id = "user"."id"::text',
      )
      .select(['"user"."id"::text AS "userId"'])
      .where('user.type IN (:...userTypes)', {
        userTypes: ADMIN_QUEUE_INVESTOR_USER_TYPES,
      })
      .andWhere('verification.id IS NULL')
      .getRawMany<{ userId?: string }>();

    const missingUserIds = missingRows
      .map((row) => String(row?.userId ?? '').trim())
      .filter(Boolean);

    if (!missingUserIds.length) {
      return;
    }

    await this.repo.save(
      missingUserIds.map((userId) =>
        this.normalizeLegacyStatuses(this.repo.create({ userId })),
      ),
    );
  }

  async getOrCreate(userId: string) {
    let row = await this.repo.findOne({ where: { userId } });
    if (!row) {
      row = this.repo.create({ userId });
      row = await this.saveWithDerivedStatuses(row);
    }

    return this.normalizeLegacyStatuses(row);
  }

  async ensureInvestorRecord(userId: string) {
    return this.getOrCreate(userId);
  }

  async saveAmlAnswers(userId: string, amlAnswers: Record<string, any>) {
    const row = await this.getOrCreate(userId);
    row.amlAnswers = amlAnswers;
    return this.saveWithDerivedStatuses(row);
  }

  async attachWholesaleCertificate(
    userId: string,
    params: {
      key: string;
      originalName: string;
      expiryDate: string;
    },
  ) {
    const row = await this.getOrCreate(userId);
    row.wholesaleCertificateKey = params.key;
    row.wholesaleCertificateOriginalName = params.originalName;
    row.wholesaleCertificateExpiryDate = params.expiryDate;
    row.wholesaleStatus = 'pending';
    row.wholesaleVerificationSource = 'uploaded_document';
    row.adminReviewStatus = 'pending';
    return this.saveWithDerivedStatuses(row);
  }

  async setSumsubApplicant(userId: string, applicantId: string) {
    const row = await this.getOrCreate(userId);
    row.sumsubApplicantId = applicantId;
    row.sumsubStatus = 'pending';
    row.verificationSource = 'sumsub';
    return this.saveWithDerivedStatuses(row);
  }

  async updateSumsubStatusByApplicant(
    applicantId: string,
    status: 'pending' | 'approved' | 'rejected' | 'review_required',
  ) {
    const row = await this.repo.findOne({ where: { sumsubApplicantId: applicantId } });
    if (!row) throw new NotFoundException('Verification record not found');
    row.sumsubStatus = status;
    row.verificationSource = 'sumsub';
    return this.saveWithDerivedStatuses(row);
  }

  async adminReview(
    userId: string,
    params: {
      adminReviewStatus: AdminReviewStatus;
      reviewedBy: string;
      reviewNotes?: string;
      wholesaleStatus?: WholesaleStatus;
    },
  ) {
    const row = await this.getOrCreate(userId);

    if (params.adminReviewStatus === 'approved' && row.sumsubStatus !== 'approved') {
      throw new BadRequestException(
        'Sumsub approval must complete before admin approval can unlock investing',
      );
    }

    row.adminReviewStatus = params.adminReviewStatus;
    row.wholesaleStatus =
      params.wholesaleStatus ??
      (params.adminReviewStatus === 'approved'
        ? 'approved'
        : params.adminReviewStatus === 'rejected'
        ? 'rejected'
        : params.adminReviewStatus === 'more_info_required'
        ? 'requires_more_info'
        : row.wholesaleStatus);
    if (row.wholesaleVerificationSource !== TEST_VERIFICATION_SOURCE) {
      row.wholesaleVerificationSource = 'manual_review';
    }
    row.reviewedBy = params.reviewedBy;
    row.reviewNotes = params.reviewNotes || null;
    row.reviewedAt = new Date();
    const saved = await this.saveWithDerivedStatuses(row);

    if (params.adminReviewStatus === 'approved') {
      await this.notificationService.createNotification(
        Number(saved.userId),
        NotificationType.ACCOUNT_APPROVED,
        'Account approved',
        'Your investor verification has been approved and investing access is now unlocked.',
        'account_verification',
        Number(saved.id),
      );

      await this.createCustodyAfterApproval(saved, 'admin_review');
    }

    return saved;
  }

  private async createCustodyAfterApproval(
    row: InvestorVerificationEntity,
    trigger: string,
  ) {
    try {
      return await this.custodyAccountService.getOrCreateInvestorCustodyAccount({
        investorId: Number(row.userId),
        userId: Number(row.userId),
        metadata: {
          trigger,
          verificationId: row.id,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Investor approval succeeded but custody setup did not complete userId=${row.userId}: ${message}`,
      );
      return {
        warning:
          'Investor approval succeeded, but custody setup failed. Retry custody setup from admin.',
      };
    }
  }

  async applyTestVerificationOverride(
    userId: string,
    params: {
      actorUserId?: number | null;
      actorRole?: string | null;
      actorEmail?: string | null;
      certificateFileName?: string | null;
      certificateExpiryDate?: string | null;
      reason?: string | null;
    } = {},
  ) {
    this.assertTestVerificationOverrideEnabled();

    const user = await this.userRepo.findOne({
      where: { id: Number(userId) as any },
    });
    if (!user) {
      throw new NotFoundException('Investor user not found');
    }

    const row = await this.getOrCreate(userId);
    const appliedAt = new Date();
    const actorLabel =
      String(params.actorEmail || '').trim() ||
      (params.actorUserId ? `user:${params.actorUserId}` : 'system:test_override');

    row.isTestVerification = true;
    row.verificationSource = TEST_VERIFICATION_SOURCE;
    row.wholesaleVerificationSource = TEST_VERIFICATION_SOURCE;
    row.testIdentityVerified = true;
    row.testAmlApproved = true;
    row.testWholesaleApproved = true;
    row.verificationOverrideMode = 'testnet';
    row.wholesaleStatus = 'approved';
    row.wholesaleCertificateKey = null;
    row.wholesaleCertificateOriginalName =
      params.certificateFileName?.trim() ||
      `test-wholesale-certificate-${userId}.pdf`;
    row.wholesaleCertificateExpiryDate =
      params.certificateExpiryDate?.trim() ||
      getDefaultTestVerificationExpiryDate(appliedAt);
    row.reviewedBy = actorLabel;
    row.reviewNotes =
      params.reason?.trim() ||
      'Non-production verification override applied for investor funding flow testing.';
    row.reviewedAt = appliedAt;
    row.testVerificationAppliedAt = appliedAt;
    row.testVerificationAppliedBy = actorLabel;

    const saved = await this.saveWithDerivedStatuses(row);

    await this.writeAuditLog({
      actorUserId: params.actorUserId ?? null,
      actorRole: params.actorRole ?? 'system',
      entityId: saved.id,
      action: 'investor_test_verification_override_applied',
      detailsJson: {
        userId: saved.userId,
        email: user.email,
        environment: process.env.NODE_ENV ?? 'unknown',
        verificationSource: saved.verificationSource,
        wholesaleVerificationSource: saved.wholesaleVerificationSource,
        isTestVerification: saved.isTestVerification,
        testVerificationAppliedAt: saved.testVerificationAppliedAt?.toISOString(),
        triggeredBy: actorLabel,
      },
    });

    this.logger.warn(
      `Non-production test verification override applied userId=${saved.userId} email=${user.email} environment=${process.env.NODE_ENV ?? 'unknown'} triggeredBy=${actorLabel} at=${appliedAt.toISOString()}`,
    );

    return this.getEligibilitySnapshot(userId);
  }

  async enableAdminTestInvestmentOverride(
    userId: string,
    params: {
      actorUserId: number;
      actorRole?: string | null;
      actorEmail?: string | null;
      note?: string | null;
    },
  ) {
    this.assertAdminTestOverrideEnabled();

    const user = await this.userRepo.findOne({
      where: { id: Number(userId) as any },
    });
    if (!user) {
      throw new NotFoundException('Investor user not found');
    }

    const row = await this.getOrCreate(userId);
    const appliedAt = new Date();

    row.testInvestmentOverride = true;
    row.verificationOverrideMode = 'testnet';
    row.testInvestmentOverrideSetAt = appliedAt;
    row.testInvestmentOverrideSetBy = String(params.actorUserId);
    row.testInvestmentOverrideNote = String(params.note ?? '').trim() || null;

    const saved = await this.saveWithDerivedStatuses(row);

    await this.writeAuditLog({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole ?? 'admin',
      entityId: saved.id,
      action: 'test_override_enabled',
      detailsJson: {
        userId: saved.userId,
        email: user.email,
        fullname: user.fullname,
        environment: process.env.NODE_ENV ?? 'unknown',
        note: saved.testInvestmentOverrideNote,
        actorEmail: params.actorEmail ?? null,
        testInvestmentOverrideSetAt: saved.testInvestmentOverrideSetAt?.toISOString(),
      },
    });

    this.logger.warn(
      `Admin test investment override enabled userId=${saved.userId} email=${user.email} environment=${process.env.NODE_ENV ?? 'unknown'} actorUserId=${params.actorUserId} at=${appliedAt.toISOString()}`,
    );

    return this.getEligibilitySnapshot(userId);
  }

  async disableAdminTestInvestmentOverride(
    userId: string,
    params: {
      actorUserId: number;
      actorRole?: string | null;
      actorEmail?: string | null;
      note?: string | null;
    },
  ) {
    this.assertAdminTestOverrideEnabled();

    const user = await this.userRepo.findOne({
      where: { id: Number(userId) as any },
    });
    if (!user) {
      throw new NotFoundException('Investor user not found');
    }

    const row = await this.getOrCreate(userId);
    const disabledAt = new Date();
    const previousNote = row.testInvestmentOverrideNote;

    row.testInvestmentOverride = false;
    row.verificationOverrideMode = 'none';
    row.testInvestmentOverrideSetAt = null;
    row.testInvestmentOverrideSetBy = null;
    row.testInvestmentOverrideNote = null;
    row.isTestVerification = false;
    row.testIdentityVerified = false;
    row.testAmlApproved = false;
    row.testWholesaleApproved = false;
    row.testVerificationAppliedAt = null;
    row.testVerificationAppliedBy = null;
    if (row.verificationSource === TEST_VERIFICATION_SOURCE) {
      row.verificationSource = null;
    }
    if (row.wholesaleVerificationSource === TEST_VERIFICATION_SOURCE) {
      row.wholesaleVerificationSource = null;
    }

    const saved = await this.saveWithDerivedStatuses(row);

    await this.writeAuditLog({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole ?? 'admin',
      entityId: saved.id,
      action: 'test_override_disabled',
      detailsJson: {
        userId: saved.userId,
        email: user.email,
        fullname: user.fullname,
        environment: process.env.NODE_ENV ?? 'unknown',
        note: String(params.note ?? '').trim() || previousNote || null,
        actorEmail: params.actorEmail ?? null,
        disabledAt: disabledAt.toISOString(),
      },
    });

    this.logger.warn(
      `Admin test investment override disabled userId=${saved.userId} email=${user.email} environment=${process.env.NODE_ENV ?? 'unknown'} actorUserId=${params.actorUserId} at=${disabledAt.toISOString()}`,
    );

    return this.getEligibilitySnapshot(userId);
  }

  async setVerificationOverrideMode(
    userId: string,
    params: {
      actorUserId: number;
      actorRole?: string | null;
      actorEmail?: string | null;
      verificationOverrideMode: VerificationOverrideMode;
      note?: string | null;
    },
  ) {
    if (params.verificationOverrideMode === 'testnet') {
      return this.enableAdminTestInvestmentOverride(userId, params);
    }

    return this.disableAdminTestInvestmentOverride(userId, params);
  }

  async getAdminQueue() {
    await this.backfillMissingInvestorRecords();

    const verificationColumns = await this.getTableColumns('investor_verification');
    const rows = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin(
        InvestorVerificationEntity,
        'verification',
        'verification.user_id = "user"."id"::text',
      )
      .select([
        this.optionalColumnSelect(verificationColumns, 'id', 'id'),
        '"user"."id"::text AS "userId"',
        this.optionalColumnSelect(
          verificationColumns,
          'sumsub_applicant_id',
          'sumsubApplicantId',
        ),
        this.optionalColumnSelect(verificationColumns, 'sumsub_status', 'sumsubStatus'),
        this.optionalColumnSelect(
          verificationColumns,
          'admin_review_status',
          'adminReviewStatus',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'investor_eligibility_status',
          'investorEligibilityStatus',
        ),
        this.optionalColumnSelect(verificationColumns, 'wholesale_status', 'wholesaleStatus'),
        this.optionalColumnSelect(
          verificationColumns,
          'verification_source',
          'verificationSource',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_verification_source',
          'wholesaleVerificationSource',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'is_test_verification',
          'isTestVerification',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_identity_verified',
          'testIdentityVerified',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_aml_approved',
          'testAmlApproved',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_wholesale_approved',
          'testWholesaleApproved',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override',
          'testInvestmentOverride',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'verification_override_mode',
          'verificationOverrideMode',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override_set_at',
          'testInvestmentOverrideSetAt',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override_set_by',
          'testInvestmentOverrideSetBy',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override_note',
          'testInvestmentOverrideNote',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_verification_applied_at',
          'testVerificationAppliedAt',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_verification_applied_by',
          'testVerificationAppliedBy',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_certificate_key',
          'wholesaleCertificateKey',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_certificate_original_name',
          'wholesaleCertificateOriginalName',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_certificate_expiry_date',
          'wholesaleCertificateExpiryDate',
        ),
        this.optionalColumnSelect(verificationColumns, 'reviewed_by', 'reviewedBy'),
        this.optionalColumnSelect(verificationColumns, 'review_notes', 'reviewNotes'),
        this.optionalColumnSelect(verificationColumns, 'reviewed_at', 'reviewedAt'),
        this.optionalColumnSelect(verificationColumns, 'created_at', 'createdAt'),
        this.optionalColumnSelect(verificationColumns, 'updated_at', 'updatedAt'),
        'user.created_at AS "accountCreatedAt"',
        'user.updated_at AS "accountUpdatedAt"',
        'user.email AS "email"',
        'user.fullname AS "fullname"',
        'user.phone_number AS "phoneNumber"',
      ])
      .where('user.type IN (:...userTypes)', {
        userTypes: ADMIN_QUEUE_INVESTOR_USER_TYPES,
      })
      .orderBy(
        verificationColumns.has('updated_at')
          ? 'verification.updated_at'
          : 'user.id',
        'DESC',
      )
      .addOrderBy('user.id', 'DESC')
      .getRawMany();

    return rows.map((row) => this.normalizeQueueRow(row));
  }

  async getAdminDetail(userId: string) {
    const investorUser = await this.userRepo.findOne({
      where: { id: Number(userId) as any },
    });

    if (
      investorUser &&
      ADMIN_QUEUE_INVESTOR_USER_TYPES.includes(investorUser.type as any)
    ) {
      await this.ensureInvestorRecord(userId);
    }

    const verificationColumns = await this.getTableColumns('investor_verification');
    const row = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin(
        InvestorVerificationEntity,
        'verification',
        'verification.user_id = "user"."id"::text',
      )
      .select([
        this.optionalColumnSelect(verificationColumns, 'id', 'id'),
        '"user"."id"::text AS "userId"',
        this.optionalColumnSelect(
          verificationColumns,
          'sumsub_applicant_id',
          'sumsubApplicantId',
        ),
        this.optionalColumnSelect(verificationColumns, 'sumsub_status', 'sumsubStatus'),
        this.optionalColumnSelect(
          verificationColumns,
          'admin_review_status',
          'adminReviewStatus',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'investor_eligibility_status',
          'investorEligibilityStatus',
        ),
        this.optionalColumnSelect(verificationColumns, 'wholesale_status', 'wholesaleStatus'),
        this.optionalColumnSelect(
          verificationColumns,
          'verification_source',
          'verificationSource',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_verification_source',
          'wholesaleVerificationSource',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'is_test_verification',
          'isTestVerification',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_identity_verified',
          'testIdentityVerified',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_aml_approved',
          'testAmlApproved',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_wholesale_approved',
          'testWholesaleApproved',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override',
          'testInvestmentOverride',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'verification_override_mode',
          'verificationOverrideMode',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override_set_at',
          'testInvestmentOverrideSetAt',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override_set_by',
          'testInvestmentOverrideSetBy',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_investment_override_note',
          'testInvestmentOverrideNote',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_verification_applied_at',
          'testVerificationAppliedAt',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'test_verification_applied_by',
          'testVerificationAppliedBy',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_certificate_key',
          'wholesaleCertificateKey',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_certificate_original_name',
          'wholesaleCertificateOriginalName',
        ),
        this.optionalColumnSelect(
          verificationColumns,
          'wholesale_certificate_expiry_date',
          'wholesaleCertificateExpiryDate',
        ),
        this.optionalColumnSelect(verificationColumns, 'aml_answers', 'amlAnswers'),
        this.optionalColumnSelect(verificationColumns, 'reviewed_by', 'reviewedBy'),
        this.optionalColumnSelect(verificationColumns, 'review_notes', 'reviewNotes'),
        this.optionalColumnSelect(verificationColumns, 'reviewed_at', 'reviewedAt'),
        this.optionalColumnSelect(verificationColumns, 'created_at', 'createdAt'),
        this.optionalColumnSelect(verificationColumns, 'updated_at', 'updatedAt'),
        'user.created_at AS "accountCreatedAt"',
        'user.updated_at AS "accountUpdatedAt"',
        'user.email AS "email"',
        'user.fullname AS "fullname"',
        'user.phone_number AS "phoneNumber"',
      ])
      .where('"user"."id"::text = :userId', { userId })
      .andWhere('user.type IN (:...userTypes)', {
        userTypes: ADMIN_QUEUE_INVESTOR_USER_TYPES,
      })
      .getRawOne();

    if (!row) {
      throw new NotFoundException('Investor verification record not found');
    }

    return this.normalizeQueueRow(row);
  }

  async canInvest(userId: string) {
    const row = await this.getOrCreate(userId);
    return this.getDerivedEligibilityStatus(row) === 'approved';
  }

  async getEligibilitySnapshot(userId: string) {
    const row = await this.getOrCreate(userId);
    const eligibilitySource = this.getEligibilitySource(row);
    const canInvest = eligibilitySource !== NO_ELIGIBILITY_SOURCE;
    const testOverrideActive =
      this.hasActiveTestInvestmentOverride(row) ||
      this.hasActiveTestVerificationOverride(row);
    const investorEligibilityStatus = this.getDerivedEligibilityStatus(row);
    const verificationOverrideMode: VerificationOverrideMode = testOverrideActive
      ? 'testnet'
      : 'none';

    return {
      ...row,
      investorEligibilityStatus,
      isEligible: canInvest,
      eligibilitySource,
      canInvest,
      testOverrideActive,
      testnetOverrideAvailable: isAdminTestOverrideEnabled(),
      // TEMPORARY TESTNET OVERRIDE
      // REMOVE BEFORE MAINNET/PRODUCTION LAUNCH
      verificationOverrideMode,
      testVerificationActive: this.hasActiveTestVerificationOverride(row),
      reviewState: this.getReviewState({
        adminReviewStatus: row.adminReviewStatus,
        investorEligibilityStatus,
        eligibilitySource,
        sumsubStatus: row.sumsubStatus,
        testOverrideActive,
      }),
    };
  }

  async assertInvestorCanInvest(userId: string) {
    const row = await this.getOrCreate(userId);

    if (this.getDerivedEligibilityStatus(row) === 'approved') {
      return row;
    }

    if (row.sumsubStatus !== 'approved') {
      throw new BadRequestException(
        'Investor identity and compliance verification is not approved yet',
      );
    }

    if (row.adminReviewStatus === 'more_info_required') {
      throw new BadRequestException(
        'Investor access is blocked until the requested verification information is provided and reviewed',
      );
    }

    if (row.adminReviewStatus === 'rejected') {
      throw new BadRequestException(
        'Investor access has been rejected by RegenX compliance review',
      );
    }

    throw new BadRequestException(
      'Investor access is still pending RegenX admin approval',
    );
  }
}
