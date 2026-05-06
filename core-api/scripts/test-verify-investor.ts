import { DataSource } from 'typeorm';

import { datasourceOptions } from '../src/configuration/orm.configuration';
import { UserType } from '../src/modules/iam/user/domain/user-type.enum';
import { UserEntity } from '../src/modules/iam/user/infrastructure/persistence/entities/user.entity';
import { InvestorVerificationEntity } from '../src/modules/investor-verification/entities/investor-verification.entity';
import {
  getDefaultTestVerificationExpiryDate,
  isTestVerificationOverrideEnabled,
  TEST_VERIFICATION_SOURCE,
} from '../src/modules/investor-verification/investor-verification-test-override.util';
import { AuditLogEntity } from '../src/modules/project/infrastructure/persistence/entities/audit-log.entity';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const entries = new Map<string, string>();

  for (const arg of args) {
    if (!arg.startsWith('--')) {
      continue;
    }

    const [key, ...valueParts] = arg.slice(2).split('=');
    entries.set(key, valueParts.join('='));
  }

  return {
    email: String(entries.get('email') ?? '').trim().toLowerCase(),
    reason: String(entries.get('reason') ?? '').trim(),
    certificateFileName: String(entries.get('certificate-file') ?? '').trim(),
    certificateExpiryDate: String(entries.get('expiry-date') ?? '').trim(),
    triggeredBy: String(entries.get('triggered-by') ?? '').trim(),
  };
};

const main = async () => {
  if (!isTestVerificationOverrideEnabled()) {
    throw new Error(
      'Test verification override is disabled. Use a non-production environment only.',
    );
  }

  const args = parseArgs();
  if (!args.email) {
    throw new Error('Missing required argument: --email=<investor-email>');
  }

  const dataSource = new DataSource({
    ...datasourceOptions,
    entities: [UserEntity, InvestorVerificationEntity, AuditLogEntity],
  });

  await dataSource.initialize();

  try {
    const userRepo = dataSource.getRepository(UserEntity);
    const verificationRepo = dataSource.getRepository(InvestorVerificationEntity);
    const auditLogRepo = dataSource.getRepository(AuditLogEntity);

    const user = await userRepo.findOne({
      where: { email: args.email as any },
    });

    if (!user) {
      throw new Error(`No user found for email ${args.email}`);
    }

    if (user.type !== UserType.WHOLESALE_INVESTOR) {
      throw new Error(
        `User ${args.email} is type ${user.type}, expected ${UserType.WHOLESALE_INVESTOR}`,
      );
    }

    let row = await verificationRepo.findOne({
      where: { userId: String(user.id) },
    });

    if (!row) {
      row = verificationRepo.create({ userId: String(user.id) });
    }

    const appliedAt = new Date();
    const triggeredBy = args.triggeredBy || 'cli:test_verify_investor';

    row.isTestVerification = true;
    row.verificationSource = TEST_VERIFICATION_SOURCE;
    row.wholesaleVerificationSource = TEST_VERIFICATION_SOURCE;
    row.testIdentityVerified = true;
    row.testAmlApproved = true;
    row.testWholesaleApproved = true;
    row.testInvestmentOverride = true;
    row.testInvestmentOverrideSetAt = appliedAt;
    row.testInvestmentOverrideSetBy = triggeredBy;
    row.testInvestmentOverrideNote =
      args.reason ||
      'Non-production investment eligibility override applied via CLI for testing.';
    row.wholesaleStatus = 'approved';
    row.wholesaleCertificateKey = null;
    row.wholesaleCertificateOriginalName =
      args.certificateFileName || `test-wholesale-certificate-${user.id}.pdf`;
    row.wholesaleCertificateExpiryDate =
      args.certificateExpiryDate || getDefaultTestVerificationExpiryDate(appliedAt);
    row.reviewedBy = triggeredBy;
    row.reviewNotes =
      args.reason ||
      'Non-production verification override applied via CLI for investment flow testing.';
    row.reviewedAt = appliedAt;
    row.testVerificationAppliedAt = appliedAt;
    row.testVerificationAppliedBy = triggeredBy;

    const saved = await verificationRepo.save(row);

    await auditLogRepo.save(
      auditLogRepo.create({
        actor: null,
        actorRole: 'system',
        entityType: 'InvestorVerification',
        entityId: saved.id,
        action: 'investor_test_verification_override_applied',
        detailsJson: {
          userId: saved.userId,
          email: user.email,
          environment: process.env.NODE_ENV ?? 'unknown',
          triggeredBy,
          testVerificationAppliedAt: appliedAt.toISOString(),
          verificationSource: saved.verificationSource,
          wholesaleVerificationSource: saved.wholesaleVerificationSource,
        },
      } as any),
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          userId: saved.userId,
          email: user.email,
          environment: process.env.NODE_ENV ?? 'unknown',
          canInvestInNonProduction: true,
          verificationSource: saved.verificationSource,
          wholesaleVerificationSource: saved.wholesaleVerificationSource,
          isTestVerification: saved.isTestVerification,
          testInvestmentOverride: saved.testInvestmentOverride,
          certificateFileName: saved.wholesaleCertificateOriginalName,
          certificateExpiryDate: saved.wholesaleCertificateExpiryDate,
          appliedAt: saved.testVerificationAppliedAt?.toISOString(),
          triggeredBy,
        },
        null,
        2,
      ),
    );
  } finally {
    await dataSource.destroy();
  }
};

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
