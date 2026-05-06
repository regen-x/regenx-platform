import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpvIssuancePrepWorkflow1778200000000 implements MigrationInterface {
  name = 'AddSpvIssuancePrepWorkflow1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "spv"
      ADD COLUMN IF NOT EXISTS "project_id" integer
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "spv_entity_role" (
        "id" SERIAL NOT NULL,
        "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "spv_id" integer NOT NULL,
        "entity_id" integer,
        "role" character varying(100) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'suggested',
        "source" character varying(30) NOT NULL DEFAULT 'auto',
        "is_required" boolean NOT NULL DEFAULT false,
        "is_primary" boolean NOT NULL DEFAULT true,
        "confidence_score" numeric(5,2),
        "approved_at" TIMESTAMP,
        "approved_by" integer,
        "notes" text,
        CONSTRAINT "PK_spv_entity_role_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_spv_project_id"
      ON "spv" ("project_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_spv_entity_role_spv_role"
      ON "spv_entity_role" ("spv_id", "role")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_spv_entity_role_entity_id"
      ON "spv_entity_role" ("entity_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_project_id'
        ) THEN
          ALTER TABLE "spv"
          ADD CONSTRAINT "FK_spv_project_id"
          FOREIGN KEY ("project_id")
          REFERENCES "project"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_entity_role_spv_id'
        ) THEN
          ALTER TABLE "spv_entity_role"
          ADD CONSTRAINT "FK_spv_entity_role_spv_id"
          FOREIGN KEY ("spv_id")
          REFERENCES "spv"("id")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_entity_role_entity_id'
        ) THEN
          ALTER TABLE "spv_entity_role"
          ADD CONSTRAINT "FK_spv_entity_role_entity_id"
          FOREIGN KEY ("entity_id")
          REFERENCES "legal_entity"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_entity_role_approved_by'
        ) THEN
          ALTER TABLE "spv_entity_role"
          ADD CONSTRAINT "FK_spv_entity_role_approved_by"
          FOREIGN KEY ("approved_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE "spv"
      SET "project_id" = "project"."id"
      FROM "project"
      WHERE "project"."spv_id" = "spv"."id"
        AND "spv"."project_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "spv_entity_role" DROP CONSTRAINT IF EXISTS "FK_spv_entity_role_approved_by"`);
    await queryRunner.query(`ALTER TABLE "spv_entity_role" DROP CONSTRAINT IF EXISTS "FK_spv_entity_role_entity_id"`);
    await queryRunner.query(`ALTER TABLE "spv_entity_role" DROP CONSTRAINT IF EXISTS "FK_spv_entity_role_spv_id"`);
    await queryRunner.query(`ALTER TABLE "spv" DROP CONSTRAINT IF EXISTS "FK_spv_project_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_spv_entity_role_entity_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_spv_entity_role_spv_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_spv_project_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "spv_entity_role"`);
    await queryRunner.query(`ALTER TABLE "spv" DROP COLUMN IF EXISTS "project_id"`);
  }
}
