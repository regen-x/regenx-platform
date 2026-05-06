import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvestorVerificationTestOverrideColumns1778100000000
  implements MigrationInterface
{
  name = 'AddInvestorVerificationTestOverrideColumns1778100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('investor_verification'))) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "investor_verification"
      ADD COLUMN IF NOT EXISTS "verification_source" character varying,
      ADD COLUMN IF NOT EXISTS "wholesale_verification_source" character varying,
      ADD COLUMN IF NOT EXISTS "is_test_verification" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "test_identity_verified" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "test_aml_approved" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "test_wholesale_approved" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "test_investment_override" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "verification_override_mode" character varying NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS "test_investment_override_set_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "test_investment_override_set_by" character varying,
      ADD COLUMN IF NOT EXISTS "test_investment_override_note" text,
      ADD COLUMN IF NOT EXISTS "test_verification_applied_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "test_verification_applied_by" character varying
    `);

    await queryRunner.query(`
      UPDATE "investor_verification"
      SET "verification_override_mode" = CASE
        WHEN "test_investment_override" = true THEN 'testnet'
        ELSE COALESCE(NULLIF("verification_override_mode", ''), 'none')
      END
      WHERE "verification_override_mode" IS NULL
         OR "verification_override_mode" = ''
         OR ("test_investment_override" = true AND "verification_override_mode" <> 'testnet')
    `);
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
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_investment_override_note"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_investment_override_set_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_investment_override_set_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "verification_override_mode"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_investment_override"`,
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
