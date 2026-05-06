import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairInvestorVerificationAdminSchema1777000000000
  implements MigrationInterface
{
  name = 'RepairInvestorVerificationAdminSchema1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('investor_verification'))) {
      await queryRunner.query(`
        CREATE TABLE "investor_verification" (
          "id" SERIAL NOT NULL,
          "user_id" character varying NOT NULL,
          "sumsub_applicant_id" character varying,
          "sumsub_status" character varying NOT NULL DEFAULT 'not_started',
          "admin_review_status" character varying(30) NOT NULL DEFAULT 'pending',
          "investor_eligibility_status" character varying(30) NOT NULL DEFAULT 'blocked',
          "wholesale_status" character varying NOT NULL DEFAULT 'pending',
          "wholesale_certificate_key" character varying,
          "wholesale_certificate_original_name" character varying,
          "wholesale_certificate_expiry_date" date,
          "aml_answers" jsonb,
          "reviewed_by" character varying,
          "review_notes" text,
          "reviewed_at" TIMESTAMP WITH TIME ZONE,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_investor_verification_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_investor_verification_user_id" UNIQUE ("user_id")
        )
      `);
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "investor_verification"
      ADD COLUMN IF NOT EXISTS "admin_review_status" character varying(30) NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "investor_eligibility_status" character varying(30) NOT NULL DEFAULT 'blocked',
      ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      UPDATE "investor_verification"
      SET "admin_review_status" = CASE
        WHEN "wholesale_status" = 'approved' THEN 'approved'
        WHEN "wholesale_status" = 'rejected' THEN 'rejected'
        WHEN "wholesale_status" = 'requires_more_info' THEN 'more_info_required'
        ELSE COALESCE(NULLIF("admin_review_status", ''), 'pending')
      END
      WHERE "admin_review_status" IS NULL OR "admin_review_status" = ''
    `);

    await queryRunner.query(`
      UPDATE "investor_verification"
      SET "investor_eligibility_status" = CASE
        WHEN "sumsub_status" = 'approved' AND "admin_review_status" = 'approved' THEN 'approved'
        WHEN "investor_eligibility_status" = 'approved' AND "admin_review_status" = 'rejected' THEN 'suspended'
        ELSE COALESCE(NULLIF("investor_eligibility_status", ''), 'blocked')
      END
      WHERE "investor_eligibility_status" IS NULL OR "investor_eligibility_status" = ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "reviewed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "investor_eligibility_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "investor_verification" DROP COLUMN IF EXISTS "admin_review_status"`,
    );
  }
}
