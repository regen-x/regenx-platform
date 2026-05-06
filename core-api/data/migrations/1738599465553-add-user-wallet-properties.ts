import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserWalletProperties1738599465553
  implements MigrationInterface
{
  name = 'AddUserWalletProperties1738599465553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "wallet_address" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "wallet_manager_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_b34c80e559317f0551ac0fa4bfd" FOREIGN KEY ("wallet_manager_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_b34c80e559317f0551ac0fa4bfd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "wallet_manager_id"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "wallet_address"`);
  }
}
