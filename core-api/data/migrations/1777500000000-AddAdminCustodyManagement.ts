import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminCustodyManagement1777500000000
  implements MigrationInterface
{
  name = 'AddAdminCustodyManagement1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE project
      ADD COLUMN IF NOT EXISTS custody_setup_status varchar(30),
      ADD COLUMN IF NOT EXISTS custody_reviewed_at timestamp,
      ADD COLUMN IF NOT EXISTS custody_reviewed_by integer,
      ADD COLUMN IF NOT EXISTS custody_block_reason text,
      ADD COLUMN IF NOT EXISTS issuance_blocked_by_custody boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS custody_change_request (
        id serial PRIMARY KEY,
        project_id integer NULL REFERENCES project(id) ON DELETE CASCADE,
        participant_type varchar(40) NOT NULL,
        participant_entity_id integer NULL,
        participant_user_id integer NULL REFERENCES "user"(id) ON DELETE SET NULL,
        participant_developer_profile_id integer NULL REFERENCES developer_profile(id) ON DELETE SET NULL,
        participant_label text NULL,
        current_custody_mode varchar(30) NOT NULL,
        requested_custody_mode varchar(30) NOT NULL,
        wallet_address text NULL,
        requested_wallet_address text NULL,
        reason text NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'pending',
        requested_by integer NULL REFERENCES "user"(id) ON DELETE SET NULL,
        requested_at timestamp NOT NULL DEFAULT now(),
        request_payload_json jsonb NULL,
        admin_notes text NULL,
        admin_decision varchar(30) NULL,
        decided_by integer NULL REFERENCES "user"(id) ON DELETE SET NULL,
        decided_at timestamp NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_custody_change_request_status
      ON custody_change_request(status, requested_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_custody_change_request_project
      ON custody_change_request(project_id, participant_type, requested_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_custody_change_request_project`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_custody_change_request_status`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS custody_change_request`);

    await queryRunner.query(`
      ALTER TABLE project
      DROP COLUMN IF EXISTS issuance_blocked_by_custody,
      DROP COLUMN IF EXISTS custody_block_reason,
      DROP COLUMN IF EXISTS custody_reviewed_by,
      DROP COLUMN IF EXISTS custody_reviewed_at,
      DROP COLUMN IF EXISTS custody_setup_status
    `);
  }
}
