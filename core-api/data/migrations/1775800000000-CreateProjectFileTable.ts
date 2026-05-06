import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProjectFileTable1775800000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "project_file" (
                "id" SERIAL NOT NULL,
                "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "project_id" integer,
                "category" character varying(50) NOT NULL,
                "purpose" character varying(50) NOT NULL,
                "document_key" character varying(100),
                "storage_key" text NOT NULL,
                "original_filename" text NOT NULL,
                "mime_type" character varying(255) NOT NULL,
                "file_size" integer,
                "uploaded_by" integer,
                CONSTRAINT "PK_project_file_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_project_file_project_id" ON "project_file" ("project_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_project_file_purpose" ON "project_file" ("purpose")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_project_file_purpose"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_project_file_project_id"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "project_file"
        `);
    }
}
