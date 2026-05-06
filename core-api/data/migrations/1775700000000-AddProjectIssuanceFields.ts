import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectIssuanceFields1775700000000
  implements MigrationInterface
{
  name = 'AddProjectIssuanceFields1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project"
      ADD COLUMN IF NOT EXISTS "spv_wallet_address" text,
      ADD COLUMN IF NOT EXISTS "spv_id" integer,
      ADD COLUMN IF NOT EXISTS "series_id" integer,
      ADD COLUMN IF NOT EXISTS "issuer_wallet_public" text,
      ADD COLUMN IF NOT EXISTS "distributor_wallet_public" text,
      ADD COLUMN IF NOT EXISTS "asset_code" character varying(20),
      ADD COLUMN IF NOT EXISTS "asset_issuer" text,
      ADD COLUMN IF NOT EXISTS "issued_supply" numeric,
      ADD COLUMN IF NOT EXISTS "issuance_status" character varying(30) DEFAULT 'not_started',
      ADD COLUMN IF NOT EXISTS "issuance_tx_hash" text,
      ADD COLUMN IF NOT EXISTS "issuance_initiated_by" integer,
      ADD COLUMN IF NOT EXISTS "issued_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "live_at" TIMESTAMP
    `);

    await queryRunner.query(`
      UPDATE "project"
      SET "issuance_status" = COALESCE(NULLIF("issuance_status", ''), 'not_started')
      WHERE "issuance_status" IS NULL OR "issuance_status" = ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "project"
      DROP COLUMN IF EXISTS "live_at",
      DROP COLUMN IF EXISTS "issued_at",
      DROP COLUMN IF EXISTS "issuance_initiated_by",
      DROP COLUMN IF EXISTS "issuance_tx_hash",
      DROP COLUMN IF EXISTS "issuance_status",
      DROP COLUMN IF EXISTS "issued_supply",
      DROP COLUMN IF EXISTS "asset_issuer",
      DROP COLUMN IF EXISTS "asset_code",
      DROP COLUMN IF EXISTS "distributor_wallet_public",
      DROP COLUMN IF EXISTS "issuer_wallet_public",
      DROP COLUMN IF EXISTS "series_id",
      DROP COLUMN IF EXISTS "spv_id",
      DROP COLUMN IF EXISTS "spv_wallet_address"
    `);
  }
}
