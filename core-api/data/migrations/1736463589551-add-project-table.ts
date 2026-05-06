import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectTable1736463589551 implements MigrationInterface {
  name = 'AddProjectTable1736463589551';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "project" ("id" SERIAL NOT NULL, "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "description" character varying NOT NULL, "location" character varying NOT NULL, "funding_goal" integer NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "climate_impact" character varying NOT NULL, "token_symbol" character varying NOT NULL, "token_supply" integer NOT NULL, "token_price" integer NOT NULL, "generates_carbon_credits" boolean NOT NULL DEFAULT false, "user_id" integer, CONSTRAINT "UQ_dedfea394088ed136ddadeee89c" UNIQUE ("name"), CONSTRAINT "UQ_4cf49b959dc3ec336602b30a3d4" UNIQUE ("token_symbol"), CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" ADD CONSTRAINT "FK_1cf56b10b23971cfd07e4fc6126" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP CONSTRAINT "FK_1cf56b10b23971cfd07e4fc6126"`,
    );
    await queryRunner.query(`DROP TABLE "project"`);
  }
}
