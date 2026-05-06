import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignSpvEntityRolesTableName1778300000000
  implements MigrationInterface
{
  name = 'AlignSpvEntityRolesTableName1778300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'spv_entity_role'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'spv_entity_roles'
        ) THEN
          ALTER TABLE "spv_entity_role" RENAME TO "spv_entity_roles";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "spv_entity_roles" (
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
        CONSTRAINT "PK_spv_entity_roles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "spv_entity_roles"
      ADD COLUMN IF NOT EXISTS "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "source" character varying(30) NOT NULL DEFAULT 'auto',
      ADD COLUMN IF NOT EXISTS "is_primary" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "confidence_score" numeric(5,2),
      ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "approved_by" integer,
      ADD COLUMN IF NOT EXISTS "notes" text
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'spv_entity_role'
        ) AND EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'spv_entity_roles'
        ) THEN
          INSERT INTO "spv_entity_roles" (
            "id",
            "uuid",
            "created_at",
            "updated_at",
            "deleted_at",
            "spv_id",
            "entity_id",
            "role",
            "status",
            "source",
            "is_required",
            "is_primary",
            "confidence_score",
            "approved_at",
            "approved_by",
            "notes"
          )
          SELECT
            "id",
            COALESCE("uuid", uuid_generate_v4()),
            "created_at",
            "updated_at",
            "deleted_at",
            "spv_id",
            "entity_id",
            "role",
            "status",
            COALESCE("source", 'auto'),
            "is_required",
            COALESCE("is_primary", true),
            "confidence_score",
            "approved_at",
            "approved_by",
            "notes"
          FROM "spv_entity_role"
          WHERE NOT EXISTS (
            SELECT 1
            FROM "spv_entity_roles"
            WHERE "spv_entity_roles"."id" = "spv_entity_role"."id"
          );

          DROP TABLE "spv_entity_role";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_spv_entity_roles_spv_role"
      ON "spv_entity_roles" ("spv_id", "role")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_spv_entity_roles_entity_id"
      ON "spv_entity_roles" ("entity_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_entity_roles_spv_id'
        ) THEN
          ALTER TABLE "spv_entity_roles"
          ADD CONSTRAINT "FK_spv_entity_roles_spv_id"
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
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_entity_roles_entity_id'
        ) THEN
          ALTER TABLE "spv_entity_roles"
          ADD CONSTRAINT "FK_spv_entity_roles_entity_id"
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
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_entity_roles_approved_by'
        ) THEN
          ALTER TABLE "spv_entity_roles"
          ADD CONSTRAINT "FK_spv_entity_roles_approved_by"
          FOREIGN KEY ("approved_by")
          REFERENCES "user"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'spv_entity_roles'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'spv_entity_role'
        ) THEN
          ALTER TABLE "spv_entity_roles" RENAME TO "spv_entity_role";
        END IF;
      END $$;
    `);
  }
}
