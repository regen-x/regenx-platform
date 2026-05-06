import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeveloperSettingsFields1777200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "developer_profile"
      ADD COLUMN IF NOT EXISTS "legal_entity_name" text,
      ADD COLUMN IF NOT EXISTS "trading_name" text,
      ADD COLUMN IF NOT EXISTS "acn" text,
      ADD COLUMN IF NOT EXISTS "contact_name" text,
      ADD COLUMN IF NOT EXISTS "contact_email" text,
      ADD COLUMN IF NOT EXISTS "phone" text,
      ADD COLUMN IF NOT EXISTS "website" text,
      ADD COLUMN IF NOT EXISTS "registered_address" text,
      ADD COLUMN IF NOT EXISTS "business_description" text,
      ADD COLUMN IF NOT EXISTS "custody_mode" character varying(30) NOT NULL DEFAULT 'self_custody',
      ADD COLUMN IF NOT EXISTS "primary_wallet_address" text,
      ADD COLUMN IF NOT EXISTS "wallet_label" text,
      ADD COLUMN IF NOT EXISTS "wallet_connected_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "wallet_last_updated_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "custody_change_status" character varying(30) NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS "custody_change_requested_at" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "custody_change_requested_mode" character varying(30)
    `);

    await queryRunner.query(`
      UPDATE "developer_profile"
      SET
        "legal_entity_name" = COALESCE("legal_entity_name", "business_name"),
        "trading_name" = COALESCE("trading_name", "business_name"),
        "contact_name" = COALESCE("contact_name", "representative_full_name"),
        "contact_email" = COALESCE("contact_email", "representative_email"),
        "phone" = COALESCE("phone", "representative_phone"),
        "registered_address" = COALESCE("registered_address", "registered_office_address"),
        "primary_wallet_address" = COALESCE("primary_wallet_address", "wallet_address")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "developer_profile"
      DROP COLUMN IF EXISTS "custody_change_requested_mode",
      DROP COLUMN IF EXISTS "custody_change_requested_at",
      DROP COLUMN IF EXISTS "custody_change_status",
      DROP COLUMN IF EXISTS "wallet_last_updated_at",
      DROP COLUMN IF EXISTS "wallet_connected_at",
      DROP COLUMN IF EXISTS "wallet_label",
      DROP COLUMN IF EXISTS "primary_wallet_address",
      DROP COLUMN IF EXISTS "custody_mode",
      DROP COLUMN IF EXISTS "business_description",
      DROP COLUMN IF EXISTS "registered_address",
      DROP COLUMN IF EXISTS "website",
      DROP COLUMN IF EXISTS "phone",
      DROP COLUMN IF EXISTS "contact_email",
      DROP COLUMN IF EXISTS "contact_name",
      DROP COLUMN IF EXISTS "acn",
      DROP COLUMN IF EXISTS "trading_name",
      DROP COLUMN IF EXISTS "legal_entity_name"
    `);
  }
}
