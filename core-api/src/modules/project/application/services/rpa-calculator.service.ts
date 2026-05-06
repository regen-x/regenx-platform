import { Injectable } from '@nestjs/common';
import { RpaOutput } from '../types/rpa-output.type';

type ProjectLike = Record<string, any>;

@Injectable()
export class RpaCalculatorService {
  private toNumber(value: unknown, fallback = 0): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  private toBool(value: unknown): boolean {
    return value === true || value === 'true' || value === 1;
  }

  private round(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private computeSimpleIrr(targetMultiple: number, durationYears: number): number {
    if (!targetMultiple || !durationYears || durationYears <= 0) return 0;
    return this.round((Math.pow(targetMultiple, 1 / durationYears) - 1) * 100, 2);
  }

  build(project: ProjectLike, payloadJson: Record<string, any> = {}): RpaOutput {
    const payloadReturns = payloadJson?.returns ?? {};

    const totalProjectCapex = this.toNumber(project.total_project_capex);
    const totalCapitalRaise = this.toNumber(project.funding_goal);
    const investmentTermYears = this.toNumber(project.investment_term_years || payloadReturns.investmentTermYears, 0);

    const estimatedAnnualSavings = this.toNumber(project.estimated_annual_savings);
    const spvSharePct = this.toNumber(project.spv_share_pct);
    const hostSharePct = this.toNumber(project.host_share_pct || (100 - spvSharePct));
    const minimumPaymentFloor = this.toNumber(project.minimum_payment_floor);
    const expectedAnnualMerchantRevenue = this.toNumber(project.expected_annual_merchant_revenue);
    const aggregatorFeePct = this.toNumber(project.aggregator_fee_pct);

    const contractedAnnualRevenueRaw = estimatedAnnualSavings * (spvSharePct / 100);
    const floorAnnualised = minimumPaymentFloor > 0 ? minimumPaymentFloor * 12 : 0;
    const contractedAnnualRevenue = this.round(Math.max(contractedAnnualRevenueRaw, floorAnnualised));

    const aggregatorFeeAmount = this.round(expectedAnnualMerchantRevenue * (aggregatorFeePct / 100));
    const merchantAnnualRevenueNet = this.round(expectedAnnualMerchantRevenue - aggregatorFeeAmount);

    const grossAnnualRevenueToSpv = this.round(contractedAnnualRevenue + merchantAnnualRevenueNet);

    const operatingCostsPerYear = this.toNumber(project.operating_costs_per_year);
    const netAnnualCashflowToSpv = this.round(grossAnnualRevenueToSpv - operatingCostsPerYear);

    const paymentFrequency = project.distribution_frequency ?? 'Monthly';
    const monthlyDistribution =
      paymentFrequency === 'Quarterly'
        ? this.round(netAnnualCashflowToSpv / 4)
        : paymentFrequency === 'Semi-Annual'
        ? this.round(netAnnualCashflowToSpv / 2)
        : paymentFrequency === 'Annual'
        ? this.round(netAnnualCashflowToSpv)
        : this.round(netAnnualCashflowToSpv / 12);

    const totalRevenue = contractedAnnualRevenue + merchantAnnualRevenueNet;
    const contractedRevenuePct = totalRevenue > 0 ? this.round((contractedAnnualRevenue / totalRevenue) * 100) : 0;
    const merchantRevenuePct = totalRevenue > 0 ? this.round((merchantAnnualRevenueNet / totalRevenue) * 100) : 0;

    const targetReturnMultiple = this.toNumber(project.target_return_multiple, 1);
    const targetCashReturn = this.round(totalCapitalRaise * targetReturnMultiple);
    const estimatedDurationYears =
      netAnnualCashflowToSpv > 0 ? this.round(targetCashReturn / netAnnualCashflowToSpv, 2) : 0;
    const impliedIrrPct = this.computeSimpleIrr(targetReturnMultiple, estimatedDurationYears);

    const riskFlags: string[] = [];

    if (spvSharePct > 75) riskFlags.push('High SPV share may reduce host-site acceptability');
    if (!minimumPaymentFloor || minimumPaymentFloor <= 0) riskFlags.push('No minimum payment floor. Revenue is more variable');
    if (merchantRevenuePct > 40) riskFlags.push('Merchant revenue exceeds 40% of total revenue');
    if ((project.credit_quality ?? '').toLowerCase() === 'low') riskFlags.push('Low counterparty credit quality');
    if (investmentTermYears > 0 && estimatedDurationYears > investmentTermYears) {
      riskFlags.push('Target return may not be achieved within maximum term');
    }
    if (Math.round(spvSharePct + hostSharePct) !== 100) {
      riskFlags.push('SPV share and host share do not total 100%');
    }
    if (this.toNumber(project.contracted_allocation_pct) + this.toNumber(project.merchant_allocation_pct) !== 100) {
      riskFlags.push('Contracted and merchant allocation do not total 100%');
    }

    return {
      dealOverview: {
        projectName: project.name ?? '',
        assetType: project.project_type ?? project.technology_type ?? null,
        location: project.location ?? null,
        capacityKwMw: this.toNumber(project.capacity_kw_mw),
        storageCapacityKwhMwh: this.toNumber(project.storage_capacity_kwh_mwh),
        totalProjectCapex,
        totalCapitalRaise,
        investmentTermYears,
      },
      counterparty: {
        hostSiteName: project.host_site_name ?? null,
        counterpartyType: project.counterparty_type ?? null,
        industry: project.host_site_industry ?? null,
        creditQuality: project.credit_quality ?? null,
        primaryOfftaker: project.primary_counterparty ?? project.host_site_name ?? null,
      },
      agreement: {
        agreementType: project.agreement_type ?? null,
        contractLengthYears: this.toNumber(project.contract_length_years),
        extensionOption: this.toBool(project.extension_option),
        paymentFrequency,
        paymentDelayDays: this.toNumber(project.payment_delay_days),
        baselineMethod: project.baseline_method ?? null,
        escalationPct: this.toNumber(project.escalation),
        returnType: project.return_type ?? null,
        targetReturnMultiple,
        terminationTrigger: project.termination_trigger ?? null,
      },
      revenue: {
        estimatedAnnualSavings,
        spvSharePct,
        hostSharePct,
        contractedAnnualRevenue,
        expectedAnnualMerchantRevenue,
        aggregatorName: project.aggregator_name ?? null,
        aggregatorFeePct,
        aggregatorFeeAmount,
        merchantAnnualRevenueNet,
        contractedRevenuePct,
        merchantRevenuePct,
      },
      cashflow: {
        grossAnnualRevenueToSpv,
        netAnnualCashflowToSpv,
        monthlyDistribution,
        targetCashReturn,
        estimatedDurationYears,
        impliedIrrPct,
      },
      riskFlags,
    };
  }
}
