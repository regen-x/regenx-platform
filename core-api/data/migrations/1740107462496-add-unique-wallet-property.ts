import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueWalletProperty1740107462496
  implements MigrationInterface
{
  name = 'AddUniqueWalletProperty1740107462496';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_ac2af862c8540eccb210b293107" UNIQUE ("wallet_address")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_ac2af862c8540eccb210b293107"`,
    );
  }
}
