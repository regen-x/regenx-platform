import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpgradeTransactionsLedger1776200000000
  implements MigrationInterface
{
  name = 'UpgradeTransactionsLedger1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLegacyTable = await queryRunner.hasTable('transaction');
    const hasNewTable = await queryRunner.hasTable('transactions');

    if (hasLegacyTable && !hasNewTable) {
      await queryRunner.query(`ALTER TABLE "transaction" RENAME TO "transactions"`);
    }

    if (!(await queryRunner.hasTable('transactions'))) {
      await queryRunner.query(`
        CREATE TABLE "transactions" (
          "id" SERIAL NOT NULL,
          "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "user_id" integer,
          "project_id" integer,
          "type" character varying NOT NULL,
          "amount" numeric NOT NULL,
          "currency" character varying NOT NULL DEFAULT 'AUD',
          "token_amount" numeric,
          "status" character varying NOT NULL DEFAULT 'PENDING',
          "reference" text,
          "description" text,
          "settled_at" TIMESTAMP,
          CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_transactions_uuid" UNIQUE ("uuid")
        )
      `);
    }

    const columns = await queryRunner.getTable('transactions');

    if (columns?.findColumnByName('buyer_id')) {
      await queryRunner.query(
        `ALTER TABLE "transactions" RENAME COLUMN "buyer_id" TO "user_id"`,
      );
    }

    if (columns?.findColumnByName('seller_id')) {
      await queryRunner.query(
        `ALTER TABLE "transactions" DROP COLUMN "seller_id"`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "project_id" DROP NOT NULL`,
    ).catch(() => undefined);
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "user_id" DROP NOT NULL`,
    ).catch(() => undefined);
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE numeric USING "amount"::numeric`,
    ).catch(() => undefined);

    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "currency" character varying NOT NULL DEFAULT 'AUD'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "token_amount" numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "reference" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "settled_at" TIMESTAMP`,
    );

    await queryRunner.query(`
      UPDATE "transactions"
      SET "type" = CASE
        WHEN "type" IN ('direct_purchase', 'offer_purchase') THEN 'BUY'
        ELSE UPPER("type")
      END
    `);

    await queryRunner.query(`
      UPDATE "transactions"
      SET "status" = CASE
        WHEN "status" IS NULL OR "status" = '' THEN 'COMPLETED'
        ELSE UPPER("status")
      END
    `);

    await queryRunner.query(`
      UPDATE "transactions"
      SET "settled_at" = COALESCE("settled_at", "created_at")
      WHERE "status" = 'COMPLETED' AND "settled_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('transactions'))) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "settled_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "token_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN IF EXISTS "currency"`,
    );

    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "seller_id" integer`,
    );

    await queryRunner.query(`
      UPDATE "transactions"
      SET "type" = CASE
        WHEN "type" = 'BUY' THEN 'direct_purchase'
        ELSE lower("type")
      END
    `);

    await queryRunner.query(
      `ALTER TABLE "transactions" RENAME COLUMN "user_id" TO "buyer_id"`,
    ).catch(() => undefined);
    await queryRunner.query(
      `ALTER TABLE "transactions" RENAME TO "transaction"`,
    ).catch(() => undefined);
  }
}
