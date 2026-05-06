import { MigrationInterface, QueryRunner } from 'typeorm';

export class StandardizeOwnershipSettlementModel1776000000000
  implements MigrationInterface
{
  name = 'StandardizeOwnershipSettlementModel1776000000000';

  private async ensureOwnershipTransactionTable(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (await queryRunner.hasTable('ownership_transaction')) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "ownership_transaction" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "project_id" integer NOT NULL,
        "series_id" integer NOT NULL,
        "token_symbol" character varying(20) NOT NULL,
        "amount" numeric NOT NULL,
        "custody_type" character varying(30) NOT NULL,
        "ownership_source" character varying(30) NOT NULL DEFAULT 'ON_CHAIN',
        "buyer_wallet_address" text,
        "seller_wallet_address" text,
        "signed_xdr" text,
        "tx_hash" text,
        "settlement_status" character varying(30) NOT NULL DEFAULT 'PENDING',
        "status" character varying(30) NOT NULL DEFAULT 'built',
        "failure_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_ownership_transaction_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ownership"
      ADD COLUMN IF NOT EXISTS "ownership_source" character varying(30) NOT NULL DEFAULT 'ON_CHAIN'
    `);

    await queryRunner.query(`
      ALTER TABLE "ownership"
      ADD COLUMN IF NOT EXISTS "settlement_status" character varying(30) NOT NULL DEFAULT 'SETTLED'
    `);

    await this.ensureOwnershipTransactionTable(queryRunner);

    await queryRunner.query(`
      ALTER TABLE "ownership_transaction"
      ADD COLUMN IF NOT EXISTS "ownership_source" character varying(30) NOT NULL DEFAULT 'ON_CHAIN'
    `);

    await queryRunner.query(`
      ALTER TABLE "ownership_transaction"
      ADD COLUMN IF NOT EXISTS "settlement_status" character varying(30) NOT NULL DEFAULT 'PENDING'
    `);

    await queryRunner.query(`
      UPDATE "ownership"
      SET "ownership_source" = CASE
        WHEN "custody_type" = 'regenx_custody' THEN 'INTERNAL_LEDGER'
        ELSE 'ON_CHAIN'
      END
    `);

    await queryRunner.query(`
      UPDATE "ownership"
      SET "settlement_status" = CASE
        WHEN "status" = 'active' THEN 'SETTLED'
        WHEN "status" = 'cancelled' THEN 'CANCELLED'
        WHEN "status" = 'failed' THEN 'FAILED'
        WHEN "status" = 'submitted' THEN 'SUBMITTED'
        ELSE 'PENDING'
      END
    `);

    await queryRunner.query(`
      UPDATE "ownership_transaction"
      SET "ownership_source" = CASE
        WHEN "custody_type" = 'regenx_custody' THEN 'INTERNAL_LEDGER'
        ELSE 'ON_CHAIN'
      END
    `);

    await queryRunner.query(`
      UPDATE "ownership_transaction"
      SET "settlement_status" = CASE
        WHEN "status" = 'confirmed' THEN 'SETTLED'
        WHEN "status" = 'submitted' THEN 'SUBMITTED'
        WHEN "status" = 'failed' THEN 'FAILED'
        WHEN "status" = 'cancelled' THEN 'CANCELLED'
        ELSE 'PENDING'
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('ownership_transaction')) {
      await queryRunner.query(`
        ALTER TABLE "ownership_transaction"
        DROP COLUMN IF EXISTS "settlement_status"
      `);

      await queryRunner.query(`
        ALTER TABLE "ownership_transaction"
        DROP COLUMN IF EXISTS "ownership_source"
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "ownership"
      DROP COLUMN IF EXISTS "settlement_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "ownership"
      DROP COLUMN IF EXISTS "ownership_source"
    `);
  }
}
