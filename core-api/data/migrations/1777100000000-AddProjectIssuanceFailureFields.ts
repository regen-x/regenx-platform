import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectIssuanceFailureFields1777100000000
  implements MigrationInterface
{
  name = 'AddProjectIssuanceFailureFields1777100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project"
      ADD COLUMN IF NOT EXISTS "issuance_failure_reason" text,
      ADD COLUMN IF NOT EXISTS "issuance_failure_payload" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project"
      DROP COLUMN IF EXISTS "issuance_failure_payload",
      DROP COLUMN IF EXISTS "issuance_failure_reason"
    `);
  }
}
