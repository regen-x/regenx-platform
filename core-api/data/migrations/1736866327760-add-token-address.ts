import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTokenAddress1736866327760 implements MigrationInterface {
  name = 'AddTokenAddress1736866327760';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "token_address" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "token_address"`,
    );
  }
}
