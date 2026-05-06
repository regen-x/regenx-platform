import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDseTypeToProject1765000000000 implements MigrationInterface {
	name = 'AddDseTypeToProject1765000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "project"
			ADD COLUMN IF NOT EXISTS "dse_type" varchar(32)
		`);

		await queryRunner.query(`
			UPDATE "project"
			SET "dse_type" = CASE
				WHEN LOWER(COALESCE("stage", '')) LIKE '%operating%' THEN 'Operating'
				WHEN LOWER(COALESCE("stage", '')) LIKE '%construction%' THEN 'Construction'
				WHEN LOWER(COALESCE("stage", '')) LIKE '%development%' THEN 'Development'
				ELSE 'Development'
			END
			WHERE "dse_type" IS NULL
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			ALTER TABLE "project"
			DROP COLUMN IF EXISTS "dse_type"
		`);
	}
}
