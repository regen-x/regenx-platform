import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfferTable1739561061000 implements MigrationInterface {
  name = 'AddOfferTable1739561061000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "offer" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "amount" integer NOT NULL, "price" integer NOT NULL, "external_id" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "user_id" integer, "project_id" integer, CONSTRAINT "PK_57c6ae1abe49201919ef68de900" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer" ADD CONSTRAINT "FK_4de4f30ac028cb209e61324f2c3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer" ADD CONSTRAINT "FK_1c6860594943a40c01153b850bf" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "offer" DROP CONSTRAINT "FK_1c6860594943a40c01153b850bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer" DROP CONSTRAINT "FK_4de4f30ac028cb209e61324f2c3"`,
    );
    await queryRunner.query(`DROP TABLE "offer"`);
  }
}
