import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDistributionTables1776100000000
  implements MigrationInterface
{
  name = 'CreateDistributionTables1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "distribution_event" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "series_id" integer,
        "spv_id" integer,
        "name" character varying(255) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'DRAFT',
        "custody_scope" character varying(30) NOT NULL DEFAULT 'ALL',
        "payout_rail" character varying(30) NOT NULL DEFAULT 'OFF_CHAIN',
        "record_date" date NOT NULL,
        "payable_date" date,
        "cash_inflow_amount" numeric,
        "gross_amount" numeric,
        "fee_amount" numeric,
        "net_amount" numeric,
        "source_reference" text,
        "notes" text,
        "created_by" integer,
        "approved_by" integer,
        "approved_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_distribution_event_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "distribution_entitlement" (
        "id" SERIAL NOT NULL,
        "event_id" integer NOT NULL,
        "project_id" integer NOT NULL,
        "series_id" integer,
        "ownership_id" integer,
        "user_id" integer,
        "custody_type" character varying(30) NOT NULL,
        "ownership_source" character varying(30) NOT NULL,
        "settlement_status" character varying(30) NOT NULL,
        "wallet_address" text,
        "custody_account_ref" text,
        "units_held" numeric NOT NULL DEFAULT 0,
        "ownership_fraction" numeric NOT NULL DEFAULT 0,
        "gross_amount" numeric NOT NULL DEFAULT 0,
        "fee_amount" numeric NOT NULL DEFAULT 0,
        "net_amount" numeric NOT NULL DEFAULT 0,
        "status" character varying(30) NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_distribution_entitlement_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "distribution_payout" (
        "id" SERIAL NOT NULL,
        "event_id" integer NOT NULL,
        "entitlement_id" integer NOT NULL,
        "user_id" integer,
        "custody_type" character varying(30) NOT NULL,
        "payout_rail" character varying(30) NOT NULL,
        "destination_wallet_address" text,
        "destination_account_ref" text,
        "gross_amount" numeric NOT NULL DEFAULT 0,
        "fee_amount" numeric NOT NULL DEFAULT 0,
        "net_amount" numeric NOT NULL DEFAULT 0,
        "status" character varying(30) NOT NULL DEFAULT 'PENDING',
        "external_reference" text,
        "tx_hash" text,
        "failure_reason" text,
        "processed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_distribution_payout_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_distribution_event_project_id" ON "distribution_event" ("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_distribution_entitlement_event_id" ON "distribution_entitlement" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_distribution_payout_event_id" ON "distribution_payout" ("event_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_distribution_payout_event_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_distribution_entitlement_event_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_distribution_event_project_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_payout"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_entitlement"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_event"`);
  }
}
