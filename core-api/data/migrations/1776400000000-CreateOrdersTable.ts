import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1776400000000 implements MigrationInterface {
  name = 'CreateOrdersTable1776400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('orders')) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" SERIAL NOT NULL,
        "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "user_id" integer NOT NULL,
        "project_id" integer NOT NULL,
        "project_name" character varying(255) NOT NULL,
        "token_symbol" character varying(80) NOT NULL,
        "order_type" character varying(20) NOT NULL DEFAULT 'BUY',
        "currency_amount" numeric NOT NULL DEFAULT 0,
        "token_amount" numeric NOT NULL DEFAULT 0,
        "status" character varying(40) NOT NULL DEFAULT 'DRAFT',
        "failure_reason" text,
        "tx_hash" text,
        "reference" text,
        "resulting_transaction_id" integer,
        "settled_at" TIMESTAMP,
        "draft_at" TIMESTAMP,
        "pending_signature_at" TIMESTAMP,
        "submitted_at" TIMESTAMP,
        "settling_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "failed_at" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_orders_uuid" UNIQUE ("uuid")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_orders_user_id" ON "orders" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_project_id" ON "orders" ("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_status" ON "orders" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_resulting_transaction_id" ON "orders" ("resulting_transaction_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('orders'))) {
      return;
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_resulting_transaction_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_project_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_user_id"`);
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
