import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvestorAdminTestInvestmentOverride1777700000000
  implements MigrationInterface
{
  name = 'AddInvestorAdminTestInvestmentOverride1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('investor_verification'))) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_investment_override" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_investment_override_set_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_investment_override_set_by" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" ADD COLUMN IF NOT EXISTS "test_investment_override_note" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('investor_verification'))) {
      return;
    }

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
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "test_investment_override"`,
    );
  }
}
