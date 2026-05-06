import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegalEntityAndAdminSpvManagement1777400000000
  implements MigrationInterface
{
  name = 'AddLegalEntityAndAdminSpvManagement1777400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS legal_entity (
        id serial PRIMARY KEY,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NULL DEFAULT now(),
        deleted_at timestamp NULL,
        entity_name varchar(255) NOT NULL,
        trading_name varchar(255) NULL,
        entity_type varchar(100) NULL,
        abn varchar(50) NULL,
        acn varchar(50) NULL,
        jurisdiction varchar(100) NULL,
        status varchar(30) NOT NULL DEFAULT 'draft',
        contact_email varchar(255) NULL,
        notes text NULL,
        operational_role varchar(100) NULL,
        custody_model varchar(30) NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id serial PRIMARY KEY,
        uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NULL DEFAULT now(),
        deleted_at timestamp NULL,
        actor_user_id integer NULL REFERENCES "user"(id) ON DELETE SET NULL,
        actor_role varchar(50) NOT NULL,
        entity_type varchar(100) NOT NULL,
        entity_id integer NOT NULL,
        action varchar(120) NOT NULL,
        details_json jsonb NULL
      )
    `);

    await queryRunner.query(`
      ALTER TABLE spv
      ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS notes text,
      ADD COLUMN IF NOT EXISTS sponsor_entity_id integer,
      ADD COLUMN IF NOT EXISTS custody_model varchar(30),
      ADD COLUMN IF NOT EXISTS updated_at timestamp NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE project
      ADD COLUMN IF NOT EXISTS sponsor_entity_id integer
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_spv_sponsor_entity_id'
        ) THEN
          ALTER TABLE spv
          ADD CONSTRAINT "FK_spv_sponsor_entity_id"
          FOREIGN KEY (sponsor_entity_id)
          REFERENCES legal_entity(id)
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_project_sponsor_entity_id'
        ) THEN
          ALTER TABLE project
          ADD CONSTRAINT "FK_project_sponsor_entity_id"
          FOREIGN KEY (sponsor_entity_id)
          REFERENCES legal_entity(id)
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_legal_entity_status
      ON legal_entity(status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_spv_sponsor_entity_id
      ON spv(sponsor_entity_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_project_sponsor_entity_id
      ON project(sponsor_entity_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_lookup
      ON audit_logs(entity_type, entity_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_entity_lookup`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_project_sponsor_entity_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_spv_sponsor_entity_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_legal_entity_status`);
    await queryRunner.query(
      `ALTER TABLE project DROP CONSTRAINT IF EXISTS "FK_project_sponsor_entity_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE spv DROP CONSTRAINT IF EXISTS "FK_spv_sponsor_entity_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE project
      DROP COLUMN IF EXISTS sponsor_entity_id
    `);
    await queryRunner.query(`
      ALTER TABLE spv
      DROP COLUMN IF EXISTS updated_at,
      DROP COLUMN IF EXISTS custody_model,
      DROP COLUMN IF EXISTS sponsor_entity_id,
      DROP COLUMN IF EXISTS notes,
      DROP COLUMN IF EXISTS status
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS legal_entity`);
  }
}
