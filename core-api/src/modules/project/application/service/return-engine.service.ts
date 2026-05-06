import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectEntity } from '../../infrastructure/persistence/entities/project.entity';
import { ProjectCashflowAllocationEntity } from '../../infrastructure/persistence/entities/project-cashflow-allocation.entity';
import { ProjectInvestmentStructureEntity } from '../../infrastructure/persistence/entities/project-investment-structure.entity';
import { ProjectReturnOutputsEntity } from '../../infrastructure/persistence/entities/project-return-outputs.entity';
import { ProjectRevenueProfileEntity } from '../../infrastructure/persistence/entities/project-revenue-profile.entity';

type CashflowSeries = number[];

@Injectable()
export class ReturnEngineService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(ProjectRevenueProfileEntity)
    private readonly revenueRepo: Repository<ProjectRevenueProfileEntity>,

    @InjectRepository(ProjectCashflowAllocationEntity)
    private readonly cashflowRepo: Repository<ProjectCashflowAllocationEntity>,

    @InjectRepository(ProjectInvestmentStructureEntity)
    private readonly investmentStructureRepo: Repository<ProjectInvestmentStructureEntity>,

    @InjectRepository(ProjectReturnOutputsEntity)
    private readonly returnOutputsRepo: Repository<ProjectReturnOutputsEntity>,
  ) {}

  private toNumber(value: unknown, fallback = 0): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  private round(value: number, decimals = 2): number {
    if (!Number.isFinite(value)) return 0;
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private calculateIrr(cashflows: CashflowSeries): number {
    if (cashflows.length < 2 || cashflows[0] >= 0) return 0;

    let low = -0.9999;
    let high = 10;

    const npv = (rate: number) =>
      cashflows.reduce((sum, cashflow, index) => {
        return sum + cashflow / Math.pow(1 + rate, index);
      }, 0);

    let lowValue = npv(low);
    let highValue = npv(high);

    for (let expansions = 0; lowValue * highValue > 0 && expansions < 10; expansions += 1) {
      high *= 2;
      highValue = npv(high);
    }

    if (lowValue * highValue > 0) return 0;

    for (let index = 0; index < 100; index += 1) {
      const mid = (low + high) / 2;
      const midValue = npv(mid);

      if (Math.abs(midValue) < 0.000001) {
        return this.round(mid * 100);
      }

      if (lowValue * midValue < 0) {
        high = mid;
        highValue = midValue;
      } else {
        low = mid;
        lowValue = midValue;
      }
    }

    return this.round(((low + high) / 2) * 100);
  }

  private buildFixedTermCashflows(totalCapitalRaise: number, annualCashflow: number, termYears: number) {
    const fullYears = Math.max(0, Math.floor(termYears));
    const fractionalYear = termYears - fullYears;
    const cashflows: CashflowSeries = [-totalCapitalRaise];

    for (let index = 0; index < fullYears; index += 1) {
      cashflows.push(annualCashflow);
    }

    if (fractionalYear > 0) {
      cashflows.push(annualCashflow * fractionalYear);
    }

    return cashflows;
  }

  private buildPaybackCashflows(totalCapitalRaise: number, annualCashflow: number, paybackYears: number) {
    return this.buildFixedTermCashflows(totalCapitalRaise, annualCashflow, paybackYears);
  }

  async calculateProjectReturns(projectId: number | string) {
    const numericProjectId = Number(projectId);
    const project = await this.projectRepo.findOne({ where: { id: numericProjectId } });
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const [revenue, cashflow, structure] = await Promise.all([
      this.revenueRepo.findOne({ where: { projectId: numericProjectId } }),
      this.cashflowRepo.findOne({ where: { projectId: numericProjectId } }),
      this.investmentStructureRepo.findOne({ where: { projectId: numericProjectId } }),
    ]);

    const totalCapitalRaise = this.toNumber(project.fundingGoal || project.totalProjectCapex);
    const annualContractedRevenue = this.toNumber(
      revenue?.annualContractedRevenue ?? project.projectedAnnualRevenue,
    );
    const annualMerchantRevenue = this.toNumber(
      revenue?.annualMerchantRevenue ?? project.expectedAnnualMerchantRevenue,
    );
    const grossAnnualRevenue = annualContractedRevenue + annualMerchantRevenue;
    const annualOpex = this.toNumber(cashflow?.annualOpex ?? project.operatingCostsPerYear);
    const maintenanceCosts = this.toNumber(cashflow?.maintenanceCosts);
    const feePct =
      this.toNumber(cashflow?.platformFeePct) +
      this.toNumber(cashflow?.operatorFeePct) +
      this.toNumber(cashflow?.otherFeePct);
    const applicableFees = grossAnnualRevenue * (feePct / 100);
    const netProjectCashflow = grossAnnualRevenue - annualOpex - maintenanceCosts - applicableFees;
    const spvPct = this.toNumber(cashflow?.spvPct ?? project.spvSharePct, 100);
    const investorAllocationPct = this.toNumber(structure?.investorAllocationPct, 100);
    const netSpvCashflow = netProjectCashflow * (spvPct / 100);
    const investorAnnualCashflow = netSpvCashflow * (investorAllocationPct / 100);
    const repaymentStructure = structure?.repaymentStructure ?? 'fixed_term';
    const distributionFrequency = structure?.distributionFrequency ?? project.distributionFrequency ?? 'monthly';
    const periodsPerYear = distributionFrequency === 'quarterly' ? 4 : 12;

    if (totalCapitalRaise <= 0) {
      throw new BadRequestException('Capital raise must be greater than zero before returns can be calculated');
    }

    const projectedYieldPct = this.round((investorAnnualCashflow / totalCapitalRaise) * 100);
    const estimatedPeriodicDistribution = this.round(investorAnnualCashflow / periodsPerYear);

    let impliedReturnMultiple = 0;
    let impliedIrrPct = 0;
    let estimatedPaybackYears: number | null = null;
    let totalDistributionsRequired: number | null = null;

    if (repaymentStructure === 'target_multiple') {
      const targetReturnMultiple = this.toNumber(structure?.targetReturnMultiple);
      if (targetReturnMultiple <= 0) {
        throw new BadRequestException('target_return_multiple is required for target_multiple repayment structures');
      }

      totalDistributionsRequired = this.round(totalCapitalRaise * targetReturnMultiple);
      estimatedPaybackYears =
        investorAnnualCashflow > 0
          ? this.round(totalDistributionsRequired / investorAnnualCashflow, 2)
          : null;
      impliedReturnMultiple = this.round(targetReturnMultiple);
      impliedIrrPct =
        estimatedPaybackYears && estimatedPaybackYears > 0
          ? this.calculateIrr(
              this.buildPaybackCashflows(
                totalCapitalRaise,
                investorAnnualCashflow,
                estimatedPaybackYears,
              ),
            )
          : 0;
    } else if (repaymentStructure === 'hybrid') {
      const targetReturnMultiple = this.toNumber(structure?.targetReturnMultiple);
      const minimumTermYears = this.toNumber(structure?.minimumTermYears);
      if (targetReturnMultiple <= 0 || minimumTermYears <= 0) {
        throw new BadRequestException('minimum_term_years and target_return_multiple are required for hybrid repayment structures');
      }

      totalDistributionsRequired = this.round(totalCapitalRaise * targetReturnMultiple);
      estimatedPaybackYears =
        investorAnnualCashflow > 0
          ? this.round(totalDistributionsRequired / investorAnnualCashflow, 2)
          : null;
      const exitYears = Math.max(minimumTermYears, estimatedPaybackYears ?? minimumTermYears);
      impliedReturnMultiple = this.round(
        (investorAnnualCashflow * exitYears) / totalCapitalRaise,
      );
      impliedIrrPct = this.calculateIrr(
        this.buildFixedTermCashflows(totalCapitalRaise, investorAnnualCashflow, exitYears),
      );
    } else {
      const investmentTermYears = this.toNumber(
        structure?.investmentTermYears ?? project.investmentTermYears,
      );
      if (investmentTermYears <= 0) {
        throw new BadRequestException('investment_term_years is required for fixed_term repayment structures');
      }

      const totalProjectedDistributions = investorAnnualCashflow * investmentTermYears;
      impliedReturnMultiple = this.round(totalProjectedDistributions / totalCapitalRaise);
      impliedIrrPct = this.calculateIrr(
        this.buildFixedTermCashflows(totalCapitalRaise, investorAnnualCashflow, investmentTermYears),
      );
    }

    const generatedAt = new Date();
    const existing = await this.returnOutputsRepo.findOne({
      where: { projectId: numericProjectId },
    });
    const output = this.returnOutputsRepo.create({
      ...(existing ?? {}),
      projectId: numericProjectId,
      projectedYieldPct: String(projectedYieldPct),
      impliedIrrPct: String(impliedIrrPct),
      impliedReturnMultiple: String(impliedReturnMultiple),
      estimatedPaybackYears:
        estimatedPaybackYears == null ? null : String(estimatedPaybackYears),
      totalDistributionsRequired:
        totalDistributionsRequired == null ? null : String(totalDistributionsRequired),
      annualNetCashflow: String(this.round(investorAnnualCashflow)),
      estimatedPeriodicDistribution: String(estimatedPeriodicDistribution),
      generatedAt,
    });

    return this.returnOutputsRepo.save(output);
  }
}
