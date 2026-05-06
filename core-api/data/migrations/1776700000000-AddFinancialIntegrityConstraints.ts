import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinancialIntegrityConstraints1776700000000
  implements MigrationInterface
{
  name = 'AddFinancialIntegrityConstraints1776700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('orders')) {
      await queryRunner.query(`
        ALTER TABLE "orders"
        ADD CONSTRAINT "CHK_orders_order_type"
        CHECK ("order_type" IN ('BUY', 'SELL'))
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "orders"
        ADD CONSTRAINT "CHK_orders_status"
        CHECK ("status" IN ('DRAFT', 'PENDING_SIGNATURE', 'SUBMITTED', 'SETTLING', 'COMPLETED', 'FAILED', 'CANCELLED'))
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "orders"
        ADD CONSTRAINT "CHK_orders_amounts_non_negative"
        CHECK ("currency_amount" >= 0 AND "token_amount" > 0)
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "orders"
        ADD CONSTRAINT "CHK_orders_completed_fields"
        CHECK (
          "status" <> 'COMPLETED'
          OR ("completed_at" IS NOT NULL AND "settled_at" IS NOT NULL)
        )
      `).catch(() => undefined);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_orders_tx_hash"
        ON "orders" ("tx_hash")
        WHERE "tx_hash" IS NOT NULL AND "deleted_at" IS NULL
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_orders_resulting_transaction_id"
        ON "orders" ("resulting_transaction_id")
        WHERE "resulting_transaction_id" IS NOT NULL AND "deleted_at" IS NULL
      `);
    }

    if (await queryRunner.hasTable('transactions')) {
      await queryRunner.query(`
        ALTER TABLE "transactions"
        ADD CONSTRAINT "CHK_transactions_status"
        CHECK ("status" IN ('PENDING', 'COMPLETED', 'FAILED'))
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "transactions"
        ADD CONSTRAINT "CHK_transactions_type"
        CHECK ("type" IN ('BUY', 'SELL', 'DISTRIBUTION', 'FEE', 'DEPOSIT', 'WITHDRAWAL'))
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "transactions"
        ADD CONSTRAINT "CHK_transactions_amounts_non_negative"
        CHECK ("amount" > 0 AND ("token_amount" IS NULL OR "token_amount" >= 0))
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "transactions"
        ADD CONSTRAINT "CHK_transactions_completed_fields"
        CHECK ("status" <> 'COMPLETED' OR "settled_at" IS NOT NULL)
      `).catch(() => undefined);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_transactions_completed_reference"
        ON "transactions" (
          "reference",
          "type",
          COALESCE("user_id", -1),
          COALESCE("project_id", -1)
        )
        WHERE "reference" IS NOT NULL
          AND "deleted_at" IS NULL
          AND "status" = 'COMPLETED'
      `);
    }

    if (await queryRunner.hasTable('ownership')) {
      await queryRunner.query(`
        ALTER TABLE "ownership"
        ADD CONSTRAINT "CHK_ownership_amount_non_negative"
        CHECK ("amount" >= 0)
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "ownership"
        ADD CONSTRAINT "CHK_ownership_settlement_status"
        CHECK ("settlement_status" IN ('PENDING', 'SUBMITTED', 'SETTLED', 'FAILED', 'CANCELLED'))
      `).catch(() => undefined);

      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_ownership_user_project_status"
        ON "ownership" ("user_id", "project_id", "status", "settlement_status")
      `);
    }

    if (await queryRunner.hasTable('ownership_transaction')) {
      await queryRunner.query(`
        ALTER TABLE "ownership_transaction"
        ADD CONSTRAINT "CHK_ownership_transaction_amount_positive"
        CHECK ("amount" > 0)
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "ownership_transaction"
        ADD CONSTRAINT "CHK_ownership_transaction_settlement_status"
        CHECK ("settlement_status" IN ('PENDING', 'SUBMITTED', 'SETTLED', 'FAILED', 'CANCELLED'))
      `).catch(() => undefined);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ownership_transaction_tx_hash"
        ON "ownership_transaction" ("tx_hash")
        WHERE "tx_hash" IS NOT NULL
      `);
    }

    if (await queryRunner.hasTable('offer')) {
      await queryRunner.query(`
        ALTER TABLE "offer"
        ADD CONSTRAINT "CHK_offer_amount_price_non_negative"
        CHECK ("amount" >= 0 AND "price" >= 0)
      `).catch(() => undefined);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_offer_external_id"
        ON "offer" ("external_id")
        WHERE "deleted_at" IS NULL
      `);
    }

    if (await queryRunner.hasTable('distributions')) {
      await queryRunner.query(`
        ALTER TABLE "distributions"
        ADD CONSTRAINT "CHK_distributions_status"
        CHECK ("status" IN ('PENDING', 'SCHEDULED', 'PAID', 'FAILED'))
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "distributions"
        ADD CONSTRAINT "CHK_distributions_type"
        CHECK ("type" IN ('DISTRIBUTION', 'INTEREST', 'RETURN_OF_CAPITAL', 'FEE_ADJUSTMENT'))
      `).catch(() => undefined);

      await queryRunner.query(`
        ALTER TABLE "distributions"
        ADD CONSTRAINT "CHK_distributions_amounts_non_negative"
        CHECK (
          "gross_amount" >= 0
          AND "net_amount" >= 0
          AND ("fee_amount" IS NULL OR "fee_amount" >= 0)
        )
      `).catch(() => undefined);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UQ_distributions_event_ownership"
        ON "distributions" ("event_id", "ownership_id")
        WHERE "event_id" IS NOT NULL
          AND "ownership_id" IS NOT NULL
          AND "deleted_at" IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_distributions_event_ownership"`);
    await queryRunner.query(`ALTER TABLE "distributions" DROP CONSTRAINT IF EXISTS "CHK_distributions_amounts_non_negative"`);
    await queryRunner.query(`ALTER TABLE "distributions" DROP CONSTRAINT IF EXISTS "CHK_distributions_type"`);
    await queryRunner.query(`ALTER TABLE "distributions" DROP CONSTRAINT IF EXISTS "CHK_distributions_status"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_offer_external_id"`);
    await queryRunner.query(`ALTER TABLE "offer" DROP CONSTRAINT IF EXISTS "CHK_offer_amount_price_non_negative"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_ownership_transaction_tx_hash"`);
    await queryRunner.query(`ALTER TABLE "ownership_transaction" DROP CONSTRAINT IF EXISTS "CHK_ownership_transaction_settlement_status"`);
    await queryRunner.query(`ALTER TABLE "ownership_transaction" DROP CONSTRAINT IF EXISTS "CHK_ownership_transaction_amount_positive"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ownership_user_project_status"`);
    await queryRunner.query(`ALTER TABLE "ownership" DROP CONSTRAINT IF EXISTS "CHK_ownership_settlement_status"`);
    await queryRunner.query(`ALTER TABLE "ownership" DROP CONSTRAINT IF EXISTS "CHK_ownership_amount_non_negative"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_transactions_completed_reference"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "CHK_transactions_completed_fields"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "CHK_transactions_amounts_non_negative"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "CHK_transactions_type"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "CHK_transactions_status"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_orders_resulting_transaction_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_orders_tx_hash"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "CHK_orders_completed_fields"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "CHK_orders_amounts_non_negative"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "CHK_orders_status"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "CHK_orders_order_type"`);
  }
}
