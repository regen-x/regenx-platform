import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProjectFileSnakeCaseColumns1776900000000 implements MigrationInterface {
  name = 'FixProjectFileSnakeCaseColumns1776900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('project_file'))) {
      return;
    }

    if (
      (await queryRunner.hasColumn('project_file', 'createdAt')) &&
      !(await queryRunner.hasColumn('project_file', 'created_at'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "createdAt" TO "created_at"`,
      );
    }

    if (
      (await queryRunner.hasColumn('project_file', 'updatedAt')) &&
      !(await queryRunner.hasColumn('project_file', 'updated_at'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "updatedAt" TO "updated_at"`,
      );
    }

    if (
      (await queryRunner.hasColumn('project_file', 'deletedAt')) &&
      !(await queryRunner.hasColumn('project_file', 'deleted_at'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "deletedAt" TO "deleted_at"`,
      );
    }

    if (
      (await queryRunner.hasColumn('project_file', 'projectId')) &&
      !(await queryRunner.hasColumn('project_file', 'project_id'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "projectId" TO "project_id"`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('project_file'))) {
      return;
    }

    if (
      (await queryRunner.hasColumn('project_file', 'created_at')) &&
      !(await queryRunner.hasColumn('project_file', 'createdAt'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "created_at" TO "createdAt"`,
      );
    }

    if (
      (await queryRunner.hasColumn('project_file', 'updated_at')) &&
      !(await queryRunner.hasColumn('project_file', 'updatedAt'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "updated_at" TO "updatedAt"`,
      );
    }

    if (
      (await queryRunner.hasColumn('project_file', 'deleted_at')) &&
      !(await queryRunner.hasColumn('project_file', 'deletedAt'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "deleted_at" TO "deletedAt"`,
      );
    }

    if (
      (await queryRunner.hasColumn('project_file', 'project_id')) &&
      !(await queryRunner.hasColumn('project_file', 'projectId'))
    ) {
      await queryRunner.query(
        `ALTER TABLE "project_file" RENAME COLUMN "project_id" TO "projectId"`,
      );
    }
  }
}
