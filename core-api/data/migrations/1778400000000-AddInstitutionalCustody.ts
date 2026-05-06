import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInstitutionalCustody1778400000000 implements MigrationInterface {
  name = 'AddInstitutionalCustody1778400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "investor_custody_accounts" (
        "id" SERIAL PRIMARY KEY,
        "uuid" uuid NOT NULL DEFAULT gen_random_uuid(),
        "investor_id" integer NOT NULL,
        "user_id" integer NULL,
        "fund_id" integer NULL,
        "custody_provider" varchar(32) NOT NULL,
        "custody_account_id" varchar(160) NOT NULL,
        "public_address" varchar(160) NULL,
        "status" varchar(32) NOT NULL DEFAULT 'created',
        "whitelisted" boolean NOT NULL DEFAULT false,
        "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ux_investor_custody_accounts_investor_fund"
      ON "investor_custody_accounts" ("investor_id", COALESCE("fund_id", 0))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_investor_custody_accounts_investor_id" ON "investor_custody_accounts" ("investor_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_investor_custody_accounts_user_id" ON "investor_custody_accounts" ("user_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_investor_custody_accounts_provider" ON "investor_custody_accounts" ("custody_provider")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_investor_custody_accounts_account_id" ON "investor_custody_accounts" ("custody_account_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "custody_transactions" (
        "id" SERIAL PRIMARY KEY,
        "uuid" uuid NOT NULL DEFAULT gen_random_uuid(),
        "investor_id" integer NULL,
        "user_id" integer NULL,
        "project_id" integer NULL,
        "fund_id" integer NULL,
        "source_custody_account_id" varchar(160) NULL,
        "destination_custody_account_id" varchar(160) NULL,
        "custody_provider" varchar(32) NOT NULL,
        "provider_transaction_id" varchar(160) NULL,
        "tx_hash" varchar(160) NULL,
        "asset_code" varchar(32) NULL,
        "issuer" varchar(160) NULL,
        "amount" numeric(28, 7) NULL,
        "transaction_type" varchar(64) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'pending',
        "error_message" text NULL,
        "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NULL DEFAULT now(),
        "completed_at" timestamptz NULL,
        "deleted_at" timestamptz NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_custody_transactions_investor_id" ON "custody_transactions" ("investor_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_custody_transactions_project_id" ON "custody_transactions" ("project_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_custody_transactions_provider_transaction_id" ON "custody_transactions" ("provider_transaction_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_custody_transactions_status" ON "custody_transactions" ("status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_custody_accounts" (
        "id" SERIAL PRIMARY KEY,
        "uuid" uuid NOT NULL DEFAULT gen_random_uuid(),
        "account_key" varchar(64) NOT NULL UNIQUE,
        "custody_provider" varchar(32) NOT NULL,
        "custody_account_id" varchar(160) NOT NULL,
        "public_address" varchar(160) NULL,
        "purpose" varchar(64) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'active',
        "metadata_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NULL DEFAULT now(),
        "deleted_at" timestamptz NULL
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "investor_custody_account_id" integer NULL,
      ADD COLUMN IF NOT EXISTS "custody_provider" varchar(32) NULL,
      ADD COLUMN IF NOT EXISTS "provider_transaction_id" varchar(160) NULL,
      ADD COLUMN IF NOT EXISTS "token_transfer_tx_hash" varchar(160) NULL,
      ADD COLUMN IF NOT EXISTS "onchain_status" varchar(40) NOT NULL DEFAULT 'not_started',
      ADD COLUMN IF NOT EXISTS "onchain_error" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "onchain_error",
      DROP COLUMN IF EXISTS "onchain_status",
      DROP COLUMN IF EXISTS "token_transfer_tx_hash",
      DROP COLUMN IF EXISTS "provider_transaction_id",
      DROP COLUMN IF EXISTS "custody_provider",
      DROP COLUMN IF EXISTS "investor_custody_account_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "system_custody_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "custody_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "investor_custody_accounts"`);
  }
}
