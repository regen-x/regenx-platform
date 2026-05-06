import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvestorCustodySetupProviderFields1778500000000 implements MigrationInterface {
  name = 'AddInvestorCustodySetupProviderFields1778500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE investor_custody_accounts
      ADD COLUMN IF NOT EXISTS setup_type varchar(32) DEFAULT 'custody_account',
      ADD COLUMN IF NOT EXISTS operational boolean DEFAULT false
    `);

    await queryRunner.query(`
      UPDATE investor_custody_accounts
      SET setup_type = COALESCE(setup_type, 'custody_account'),
          operational = CASE
            WHEN custody_provider = 'testnet'
              AND status IN ('created', 'active')
            THEN true
            ELSE COALESCE(operational, false)
          END
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_investor_custody_accounts_provider_mode
      ON investor_custody_accounts(investor_id, fund_id, custody_provider, setup_type)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_investor_custody_accounts_provider_mode`,
    );
    await queryRunner.query(`
      ALTER TABLE investor_custody_accounts
      DROP COLUMN IF EXISTS operational,
      DROP COLUMN IF EXISTS setup_type
    `);
  }
}
