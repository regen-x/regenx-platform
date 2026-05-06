import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDistributionsTable1776300000000
  implements MigrationInterface
{
  name = 'CreateDistributionsTable1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('distributions')) {
      return;
    }

    await queryRunner.query(`
      CREATE TABLE "distributions" (
        "id" SERIAL NOT NULL,
        "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "project_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "ownership_id" integer,
        "event_id" integer,
        "payout_id" integer,
        "type" character varying(40) NOT NULL DEFAULT 'DISTRIBUTION',
        "gross_amount" numeric NOT NULL,
        "fee_amount" numeric,
        "net_amount" numeric NOT NULL,
        "currency" character varying(20) NOT NULL DEFAULT 'AUD',
        "period_start" date,
        "period_end" date,
        "distribution_date" date,
        "status" character varying(30) NOT NULL DEFAULT 'PENDING',
        "reference" text,
        "notes" text,
        CONSTRAINT "PK_distributions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_distributions_uuid" UNIQUE ("uuid")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_distributions_user_id" ON "distributions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_distributions_project_id" ON "distributions" ("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_distributions_event_id" ON "distributions" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_distributions_status" ON "distributions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_distributions_distribution_date" ON "distributions" ("distribution_date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('distributions'))) {
      return;
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_distributions_distribution_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_distributions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_distributions_event_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_distributions_project_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_distributions_user_id"`);
    await queryRunner.query(`DROP TABLE "distributions"`);
  }
}
