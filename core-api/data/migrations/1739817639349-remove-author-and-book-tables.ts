import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAuthorAndBookTables1739817639349
  implements MigrationInterface
{
  name = 'RemoveAuthorAndBookTables1739817639349';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "book" DROP CONSTRAINT "FK_24b753b0490a992a6941451f405"`,
    );

    await queryRunner.query(`DROP TABLE "book"`);
    await queryRunner.query(`DROP TABLE "author"`);
  }

  public async down(): Promise<void> {
    return Promise.resolve();
  }
}
