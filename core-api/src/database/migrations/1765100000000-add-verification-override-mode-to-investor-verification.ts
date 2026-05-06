import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationOverrideModeToInvestorVerification1765100000000
  implements MigrationInterface
{
  name = 'AddVerificationOverrideModeToInvestorVerification1765100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investor_verification"
      ADD COLUMN IF NOT EXISTS "verification_override_mode" character varying NOT NULL DEFAULT 'none'
    `);

    await queryRunner.query(`
      UPDATE "investor_verification"
      SET "verification_override_mode" = 'testnet'
      WHERE "test_investment_override" = true
         OR (
           "is_test_verification" = true
           AND (
             "verification_source" = 'test_override'
             OR "wholesale_verification_source" = 'test_override'
           )
         )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investor_verification"
      DROP COLUMN IF EXISTS "verification_override_mode"
    `);
  }
}
