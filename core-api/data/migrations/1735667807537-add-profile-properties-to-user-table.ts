import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfilePropertiesToUserTable1735667807537
  implements MigrationInterface
{
  name = 'AddProfilePropertiesToUserTable1735667807537';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "fullname" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "birthdate" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phone_number" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "type" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone_number"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "birthdate"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fullname"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "username" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username")`,
    );
  }
}
