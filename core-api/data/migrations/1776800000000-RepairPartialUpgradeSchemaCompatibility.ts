import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairPartialUpgradeSchemaCompatibility1776800000000
  implements MigrationInterface
{
  name = 'RepairPartialUpgradeSchemaCompatibility1776800000000';

  private async ensureOwnershipTransactionTable(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (await queryRunner.hasTable('ownership_transaction')) {
      await queryRunner.query(
        `ALTER TABLE "ownership_transaction" ADD COLUMN IF NOT EXISTS "ownership_source" character varying(30) NOT NULL DEFAULT 'ON_CHAIN'`,
      );
      await queryRunner.query(
        `ALTER TABLE "ownership_transaction" ADD COLUMN IF NOT EXISTS "settlement_status" character varying(30) NOT NULL DEFAULT 'PENDING'`,
      );
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

  private async ensureNotificationsTable(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (!(await queryRunner.hasTable('notifications'))) {
      await queryRunner.query(`
        CREATE TABLE "notifications" (
          "id" SERIAL NOT NULL,
          "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "user_id" integer NOT NULL,
          "type" character varying(60) NOT NULL,
          "title" character varying(255) NOT NULL,
          "message" text NOT NULL,
          "related_entity_type" character varying(60),
          "related_entity_id" integer,
          "is_read" boolean NOT NULL DEFAULT false,
          "read_at" TIMESTAMP,
          CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_notifications_uuid" UNIQUE ("uuid")
        )
      `);
    }

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_id" ON "notifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_is_read" ON "notifications" ("is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_type" ON "notifications" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_created_at" ON "notifications" ("created_at")`,
    );
  }

  private async ensureProjectIssuanceColumns(
    queryRunner: QueryRunner,
  ): Promise<void> {
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

  private async repairSpvSchema(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('spv'))) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "spv" ADD COLUMN IF NOT EXISTS "legal_entity_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "spv" ADD COLUMN IF NOT EXISTS "structure_type" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "spv" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    if (await queryRunner.hasColumn('spv', 'legalEntityName')) {
      await queryRunner.query(`
        UPDATE "spv"
        SET "legal_entity_name" = COALESCE("legal_entity_name", "legalEntityName")
      `);
    }
    if (await queryRunner.hasColumn('spv', 'structureType')) {
      await queryRunner.query(`
        UPDATE "spv"
        SET "structure_type" = COALESCE("structure_type", "structureType")
      `);
    }
    if (await queryRunner.hasColumn('spv', 'createdAt')) {
      await queryRunner.query(`
        UPDATE "spv"
        SET "created_at" = COALESCE("created_at", "createdAt", NOW())
      `);
    }

    if (await queryRunner.hasTable('series')) {
      await queryRunner.query(
        `ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "token_symbol" character varying(20)`,
      );
      await queryRunner.query(
        `ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "total_supply" numeric`,
      );
      await queryRunner.query(
        `ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "price_per_token" numeric`,
      );
      await queryRunner.query(
        `ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "target_irr" numeric`,
      );
      await queryRunner.query(
        `ALTER TABLE "series" ADD COLUMN IF NOT EXISTS "term_years" integer`,
      );
      if (await queryRunner.hasColumn('series', 'tokenSymbol')) {
        await queryRunner.query(`
          UPDATE "series"
          SET "token_symbol" = COALESCE("token_symbol", "tokenSymbol")
        `);
      }
      if (await queryRunner.hasColumn('series', 'totalSupply')) {
        await queryRunner.query(`
          UPDATE "series"
          SET "total_supply" = COALESCE("total_supply", "totalSupply")
        `);
      }
      if (await queryRunner.hasColumn('series', 'pricePerToken')) {
        await queryRunner.query(`
          UPDATE "series"
          SET "price_per_token" = COALESCE("price_per_token", "pricePerToken")
        `);
      }
      if (await queryRunner.hasColumn('series', 'targetIrr')) {
        await queryRunner.query(`
          UPDATE "series"
          SET "target_irr" = COALESCE("target_irr", "targetIrr")
        `);
      }
      if (await queryRunner.hasColumn('series', 'termYears')) {
        await queryRunner.query(`
          UPDATE "series"
          SET "term_years" = COALESCE("term_years", "termYears")
        `);
      }
    }

    if (await queryRunner.hasTable('stellar_asset')) {
      await queryRunner.query(
        `ALTER TABLE "stellar_asset" ADD COLUMN IF NOT EXISTS "asset_code" character varying(20)`,
      );
      await queryRunner.query(
        `ALTER TABLE "stellar_asset" ADD COLUMN IF NOT EXISTS "issuer_public_key" character varying(255)`,
      );
      await queryRunner.query(
        `ALTER TABLE "stellar_asset" ADD COLUMN IF NOT EXISTS "distribution_account" character varying(255)`,
      );
      await queryRunner.query(
        `ALTER TABLE "stellar_asset" ADD COLUMN IF NOT EXISTS "issuance_tx_hash" character varying(255)`,
      );
      await queryRunner.query(
        `ALTER TABLE "stellar_asset" ADD COLUMN IF NOT EXISTS "issued_at" TIMESTAMP`,
      );
      if (await queryRunner.hasColumn('stellar_asset', 'assetCode')) {
        await queryRunner.query(`
          UPDATE "stellar_asset"
          SET "asset_code" = COALESCE("asset_code", "assetCode")
        `);
      }
      if (await queryRunner.hasColumn('stellar_asset', 'issuerPublicKey')) {
        await queryRunner.query(`
          UPDATE "stellar_asset"
          SET "issuer_public_key" = COALESCE("issuer_public_key", "issuerPublicKey")
        `);
      }
      if (await queryRunner.hasColumn('stellar_asset', 'distributionAccount')) {
        await queryRunner.query(`
          UPDATE "stellar_asset"
          SET "distribution_account" = COALESCE("distribution_account", "distributionAccount")
        `);
      }
      if (await queryRunner.hasColumn('stellar_asset', 'issuanceTxHash')) {
        await queryRunner.query(`
          UPDATE "stellar_asset"
          SET "issuance_tx_hash" = COALESCE("issuance_tx_hash", "issuanceTxHash")
        `);
      }
      if (await queryRunner.hasColumn('stellar_asset', 'issuedAt')) {
        await queryRunner.query(`
          UPDATE "stellar_asset"
          SET "issued_at" = COALESCE("issued_at", "issuedAt")
        `);
      }
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureOwnershipTransactionTable(queryRunner);
    await this.ensureNotificationsTable(queryRunner);
    await this.ensureProjectIssuanceColumns(queryRunner);
    await this.repairSpvSchema(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_is_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_id"`);
  }
}
