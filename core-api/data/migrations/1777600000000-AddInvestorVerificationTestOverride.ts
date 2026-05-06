import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvestorVerificationTestOverride1777600000000
  implements MigrationInterface
{
  name = 'AddInvestorVerificationTestOverride1777600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('investor_verification'))) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "verification_source" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "wholesale_verification_source" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "is_test_verification" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_identity_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_aml_approved" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_wholesale_approved" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_verification_applied_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_verification_applied_by" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('investor_verification'))) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_verification_applied_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_verification_applied_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_wholesale_approved"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_aml_approved"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_identity_verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "is_test_verification"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "wholesale_verification_source"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "verification_source"`,
    );
  }
}
