import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1776600000000
  implements MigrationInterface
{
  name = 'CreateNotificationsTable1776600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    } else {
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "uuid" uuid NOT NULL DEFAULT uuid_generate_v4()`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "user_id" integer`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "type" character varying(60)`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" character varying(255)`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message" text`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "related_entity_type" character varying(60)`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "related_entity_id" integer`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_read" boolean NOT NULL DEFAULT false`,
      );
      await queryRunner.query(
        `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP`,
      );
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('notifications'))) {
      return;
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_is_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_id"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
