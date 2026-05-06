import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectReadinessDealEngineTables1778600000000
  implements MigrationInterface
{
  name = 'CreateProjectReadinessDealEngineTables1778600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_energy_configuration" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "grid_position" text,
        "electricity_supply_arrangement" text,
        "tariff_structure" jsonb,
        "onsite_generation_type" text,
        "demand_charges_status" text,
        "market_access" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_energy_configuration_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_energy_configuration_project_id" UNIQUE ("project_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_revenue_profile" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "revenue_strategy" text,
        "revenue_drivers" jsonb,
        "market_revenue_pct" numeric,
        "contracted_revenue_pct" numeric,
        "annual_contracted_revenue" numeric,
        "annual_merchant_revenue" numeric,
        "market_participation" text,
        "optimisation_responsibility" text,
        "revenue_risk_management" jsonb,
        "market_exposure" text,
        "market_grid_drivers" jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_revenue_profile_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_revenue_profile_project_id" UNIQUE ("project_id"),
        CONSTRAINT "CHK_project_revenue_profile_pct_sum"
          CHECK (
            "market_revenue_pct" IS NULL
            OR "contracted_revenue_pct" IS NULL
            OR abs(("market_revenue_pct" + "contracted_revenue_pct") - 100) < 0.000001
          )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_cashflow_allocation" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "spv_pct" numeric,
        "host_pct" numeric,
        "operator_aggregator_pct" numeric,
        "platform_fee_pct" numeric,
        "operator_fee_pct" numeric,
        "other_fee_pct" numeric,
        "annual_opex" numeric,
        "maintenance_costs" numeric,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_cashflow_allocation_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_cashflow_allocation_project_id" UNIQUE ("project_id"),
        CONSTRAINT "CHK_project_cashflow_allocation_pct_sum"
          CHECK (
            "spv_pct" IS NULL
            OR "host_pct" IS NULL
            OR "operator_aggregator_pct" IS NULL
            OR abs(("spv_pct" + "host_pct" + "operator_aggregator_pct") - 100) < 0.000001
          )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_risk_inputs" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "counterparty_name" text,
        "counterparty_type" text,
        "counterparty_role" text,
        "contract_status" text,
        "site_secured" boolean,
        "grid_connection_status" text,
        "permits_status" text,
        "epc_contractor_status" text,
        "operational_dependencies" jsonb,
        "key_risk_factors" jsonb,
        "data_confidence" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_risk_inputs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_risk_inputs_project_id" UNIQUE ("project_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_investment_structure" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "structure_type" text,
        "investor_allocation_pct" numeric,
        "repayment_structure" text,
        "investment_term_years" numeric,
        "target_return_multiple" numeric,
        "minimum_term_years" numeric,
        "distribution_frequency" text,
        "return_type" text,
        "cashflow_basis" text,
        "investor_priority" text,
        "payment_timing" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_investment_structure_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_investment_structure_project_id" UNIQUE ("project_id"),
        CONSTRAINT "CHK_project_investment_structure_conditional"
          CHECK (
            "repayment_structure" IS NULL
            OR ("repayment_structure" = 'fixed_term' AND "investment_term_years" IS NOT NULL)
            OR ("repayment_structure" = 'target_multiple' AND "target_return_multiple" IS NOT NULL)
            OR (
              "repayment_structure" = 'hybrid'
              AND "minimum_term_years" IS NOT NULL
              AND "target_return_multiple" IS NOT NULL
            )
          )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_issuance" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "price_per_unit" numeric NOT NULL DEFAULT 1.00,
        "token_symbol" character varying(5) NOT NULL,
        "total_units_issued" numeric,
        "units_available_to_investors" numeric,
        "minimum_investment" numeric,
        "units_per_minimum" numeric,
        "distribution_method" text NOT NULL DEFAULT 'on_chain_payout',
        "secondary_trading_enabled" boolean NOT NULL DEFAULT false,
        "lockup_period_months" integer,
        "transfer_restrictions" text,
        "wallet_required" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_issuance_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_issuance_project_id" UNIQUE ("project_id"),
        CONSTRAINT "UQ_project_issuance_token_symbol" UNIQUE ("token_symbol"),
        CONSTRAINT "CHK_project_issuance_token_symbol"
          CHECK ("token_symbol" ~ '^[A-Z0-9]{1,5}$')
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "project_return_outputs" (
        "id" SERIAL NOT NULL,
        "project_id" integer NOT NULL,
        "projected_yield_pct" numeric,
        "implied_irr_pct" numeric,
        "implied_return_multiple" numeric,
        "estimated_payback_years" numeric,
        "total_distributions_required" numeric,
        "annual_net_cashflow" numeric,
        "estimated_periodic_distribution" numeric,
        "generated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_return_outputs_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_return_outputs_project_id" UNIQUE ("project_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "project_energy_configuration"
      ADD CONSTRAINT "FK_project_energy_configuration_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "project_revenue_profile"
      ADD CONSTRAINT "FK_project_revenue_profile_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "project_cashflow_allocation"
      ADD CONSTRAINT "FK_project_cashflow_allocation_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "project_risk_inputs"
      ADD CONSTRAINT "FK_project_risk_inputs_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "project_investment_structure"
      ADD CONSTRAINT "FK_project_investment_structure_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "project_issuance"
      ADD CONSTRAINT "FK_project_issuance_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
    `).catch(() => undefined);

    await queryRunner.query(`
      ALTER TABLE "project_return_outputs"
      ADD CONSTRAINT "FK_project_return_outputs_project"
      FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE
    `).catch(() => undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "project_return_outputs"');
    await queryRunner.query('DROP TABLE IF EXISTS "project_issuance"');
    await queryRunner.query('DROP TABLE IF EXISTS "project_investment_structure"');
    await queryRunner.query('DROP TABLE IF EXISTS "project_risk_inputs"');
    await queryRunner.query('DROP TABLE IF EXISTS "project_cashflow_allocation"');
    await queryRunner.query('DROP TABLE IF EXISTS "project_revenue_profile"');
    await queryRunner.query('DROP TABLE IF EXISTS "project_energy_configuration"');
  }
}
