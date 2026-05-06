import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionTable1739779910745 implements MigrationInterface {
  name = 'AddTransactionTable1739779910745';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "transaction" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "amount" bigint NOT NULL, "type" character varying NOT NULL, "buyer_id" integer, "seller_id" integer, "project_id" integer, CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "token_supply"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "token_supply" bigint NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "token_price"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "token_price" bigint NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_acda004564ac94b2a70c8e70a6c" FOREIGN KEY ("buyer_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_d039bb371ba27911447b75f07d8" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_d38f27c7a278f73cad22fbf8568" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_d38f27c7a278f73cad22fbf8568"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_d039bb371ba27911447b75f07d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_acda004564ac94b2a70c8e70a6c"`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "token_price"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "token_price" integer NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "token_supply"`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD "token_supply" integer NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "transaction"`);
  }
}
