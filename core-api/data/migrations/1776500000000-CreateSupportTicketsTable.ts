import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportTicketsTable1776500000000 implements MigrationInterface {
  name = 'CreateSupportTicketsTable1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('support_tickets')) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "support_tickets" (
        "id" SERIAL NOT NULL,
        "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "user_id" integer NOT NULL,
        "role" character varying(40) NOT NULL,
        "category" character varying(30) NOT NULL,
        "subject" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'OPEN',
        "priority" character varying(20) NOT NULL DEFAULT 'MEDIUM',
        "attachment_url" text,
        "resolved_at" TIMESTAMP,
        "assigned_to_user_id" integer,
        "admin_notes" text,
        CONSTRAINT "PK_support_tickets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_support_tickets_uuid" UNIQUE ("uuid")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_support_tickets_user_id" ON "support_tickets" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_tickets_status" ON "support_tickets" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_tickets_category" ON "support_tickets" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_tickets_priority" ON "support_tickets" ("priority")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_support_tickets_assigned_to_user_id" ON "support_tickets" ("assigned_to_user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('support_tickets'))) {
      return;
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_assigned_to_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_support_tickets_user_id"`);
    await queryRunner.query(`DROP TABLE "support_tickets"`);
  }
}
