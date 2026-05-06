import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectWalletConfiguration1777300000000 implements MigrationInterface {
  name = 'AddProjectWalletConfiguration1777300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE project
      ADD COLUMN IF NOT EXISTS developer_wallet_address text,
      ADD COLUMN IF NOT EXISTS proceeds_wallet_address text,
      ADD COLUMN IF NOT EXISTS custody_mode varchar(30),
      ADD COLUMN IF NOT EXISTS wallet_config_locked_at timestamp,
      ADD COLUMN IF NOT EXISTS wallet_config_locked_reason text,
      ADD COLUMN IF NOT EXISTS wallet_last_updated_at timestamp,
      ADD COLUMN IF NOT EXISTS wallet_last_updated_by integer
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_wallet_audit (
        id serial PRIMARY KEY,
        project_id integer NOT NULL REFERENCES project(id) ON DELETE CASCADE,
        field_name varchar(100) NOT NULL,
        old_value text NULL,
        new_value text NULL,
        reason text NULL,
        change_type varchar(60) NOT NULL,
        changed_by integer NULL REFERENCES "user"(id) ON DELETE SET NULL,
        changed_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_project_wallet_audit_project_id
      ON project_wallet_audit(project_id, changed_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_project_wallet_audit_project_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_wallet_audit`);
    await queryRunner.query(`
      ALTER TABLE project
      DROP COLUMN IF EXISTS wallet_last_updated_by,
      DROP COLUMN IF EXISTS wallet_last_updated_at,
      DROP COLUMN IF EXISTS wallet_config_locked_reason,
      DROP COLUMN IF EXISTS wallet_config_locked_at,
      DROP COLUMN IF EXISTS custody_mode,
      DROP COLUMN IF EXISTS proceeds_wallet_address,
      DROP COLUMN IF EXISTS developer_wallet_address
    `);
  }
}
