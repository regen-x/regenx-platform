import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvestorAdminEligibilityStages1775900000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "investor_verification"
            ADD COLUMN IF NOT EXISTS "admin_review_status" character varying(30) NOT NULL DEFAULT 'pending'
        `);

        await queryRunner.query(`
            ALTER TABLE "investor_verification"
            ADD COLUMN IF NOT EXISTS "investor_eligibility_status" character varying(30) NOT NULL DEFAULT 'blocked'
        `);

        await queryRunner.query(`
            UPDATE "investor_verification"
            SET "admin_review_status" = CASE
                WHEN "wholesale_status" = 'approved' THEN 'approved'
                WHEN "wholesale_status" = 'rejected' THEN 'rejected'
                WHEN "wholesale_status" = 'requires_more_info' THEN 'more_info_required'
                ELSE 'pending'
            END
            WHERE "admin_review_status" IS NULL
               OR "admin_review_status" = 'pending'
        `);

        await queryRunner.query(`
            UPDATE "investor_verification"
            SET "investor_eligibility_status" = CASE
                WHEN "sumsub_status" = 'approved' AND "admin_review_status" = 'approved' THEN 'approved'
                ELSE 'blocked'
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "investor_verification"
            DROP COLUMN IF EXISTS "investor_eligibility_status"
        `);

        await queryRunner.query(`
            ALTER TABLE "investor_verification"
            DROP COLUMN IF EXISTS "admin_review_status"
        `);
    }
}
