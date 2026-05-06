import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpvSeriesStellarAsset1775620000000
  implements MigrationInterface
{
  name = 'CreateSpvSeriesStellarAsset1775620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('spv'))) {
      await queryRunner.query(`
        CREATE TABLE "spv" (
          "id" SERIAL NOT NULL,
          "name" character varying(255) NOT NULL,
          "legal_entity_name" character varying(255),
          "jurisdiction" character varying(100),
          "structure_type" character varying(100),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_spv_id" PRIMARY KEY ("id")
        )
      `);
    } else {
      await queryRunner.query(
        `ALTER TABLE "spv" ADD COLUMN IF NOT EXISTS "legal_entity_name" character varying(255)`,
      );
      await queryRunner.query(
        `ALTER TABLE "spv" ADD COLUMN IF NOT EXISTS "jurisdiction" character varying(100)`,
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
    }

    if (!(await queryRunner.hasTable('series'))) {
      await queryRunner.query(`
        CREATE TABLE "series" (
          "id" SERIAL NOT NULL,
          "name" character varying(255) NOT NULL,
          "token_symbol" character varying(20) NOT NULL,
          "total_supply" numeric NOT NULL,
          "price_per_token" numeric NOT NULL,
          "target_irr" numeric,
          "term_years" integer,
          "status" character varying(50) NOT NULL DEFAULT 'draft',
          "spv_id" integer NOT NULL,
          "project_id" integer NOT NULL,
          CONSTRAINT "UQ_series_token_symbol" UNIQUE ("token_symbol"),
          CONSTRAINT "REL_series_project_id" UNIQUE ("project_id"),
          CONSTRAINT "PK_series_id" PRIMARY KEY ("id")
        )
      `);
    } else {
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

    if (!(await queryRunner.hasTable('stellar_asset'))) {
      await queryRunner.query(`
        CREATE TABLE "stellar_asset" (
          "id" SERIAL NOT NULL,
          "asset_code" character varying(20) NOT NULL,
          "issuer_public_key" character varying(255) NOT NULL,
          "distribution_account" character varying(255),
          "issuance_tx_hash" character varying(255),
          "issued_at" TIMESTAMP,
          CONSTRAINT "PK_stellar_asset_id" PRIMARY KEY ("id")
        )
      `);
    } else {
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

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'series'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'spv'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_series_spv_id'
        ) THEN
          ALTER TABLE "series"
          ADD CONSTRAINT "FK_series_spv_id"
          FOREIGN KEY ("spv_id")
          REFERENCES "spv"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'series'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'project'
        ) AND NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_series_project_id'
        ) THEN
          ALTER TABLE "series"
          ADD CONSTRAINT "FK_series_project_id"
          FOREIGN KEY ("project_id")
          REFERENCES "project"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "series" DROP CONSTRAINT IF EXISTS "FK_series_project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "series" DROP CONSTRAINT IF EXISTS "FK_series_spv_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "stellar_asset"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "series"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spv"`);
  }
}
