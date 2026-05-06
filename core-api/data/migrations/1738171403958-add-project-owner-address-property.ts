import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectOwnerAddressProperty1738171403958
  implements MigrationInterface
{
  name = 'AddProjectOwnerAddressProperty1738171403958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD "owner_address" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN "owner_address"`,
    );
  }
}
