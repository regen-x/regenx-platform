import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectCashflowAllocationEntity } from '../../infrastructure/persistence/entities/project-cashflow-allocation.entity';
import { ProjectEnergyConfigurationEntity } from '../../infrastructure/persistence/entities/project-energy-configuration.entity';
import { ProjectInvestmentStructureEntity } from '../../infrastructure/persistence/entities/project-investment-structure.entity';
import { ProjectIssuanceEntity } from '../../infrastructure/persistence/entities/project-issuance.entity';
import { ProjectReturnOutputsEntity } from '../../infrastructure/persistence/entities/project-return-outputs.entity';
import { ProjectRevenueProfileEntity } from '../../infrastructure/persistence/entities/project-revenue-profile.entity';
import { ProjectRiskInputsEntity } from '../../infrastructure/persistence/entities/project-risk-inputs.entity';
import { ProjectEntity } from '../../infrastructure/persistence/entities/project.entity';

type SummarySection = {
  key: string;
  title: string;
  body: string;
};

type RpaSummary = {
  title: string;
  subtitle: string;
  status: string;
  sections: SummarySection[];
};

@Injectable()
export class RpaSummaryService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(ProjectEnergyConfigurationEntity)
    private readonly energyRepo: Repository<ProjectEnergyConfigurationEntity>,

    @InjectRepository(ProjectRevenueProfileEntity)
    private readonly revenueRepo: Repository<ProjectRevenueProfileEntity>,

    @InjectRepository(ProjectCashflowAllocationEntity)
    private readonly cashflowRepo: Repository<ProjectCashflowAllocationEntity>,

    @InjectRepository(ProjectRiskInputsEntity)
    private readonly riskRepo: Repository<ProjectRiskInputsEntity>,

    @InjectRepository(ProjectInvestmentStructureEntity)
    private readonly investmentRepo: Repository<ProjectInvestmentStructureEntity>,

    @InjectRepository(ProjectIssuanceEntity)
    private readonly issuanceRepo: Repository<ProjectIssuanceEntity>,

    @InjectRepository(ProjectReturnOutputsEntity)
    private readonly returnsRepo: Repository<ProjectReturnOutputsEntity>,
  ) {}

  private asRecord(value: unknown): Record<string, any> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, any>;
  }

  private first(...values: unknown[]) {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  }

  private text(value: unknown, fallback = 'Not provided') {
    const normalized = String(value ?? '').trim();
    return normalized || fallback;
  }

  private number(value: unknown, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  private pct(value: unknown) {
    const numeric = this.number(value, NaN);
    return Number.isFinite(numeric) ? this.round(numeric).toString() : 'Not provided';
  }

  private round(value: number, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private currency(value: unknown) {
    const numeric = this.number(value, NaN);
    if (!Number.isFinite(numeric)) return 'Not provided';
    return numeric.toLocaleString('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    });
  }

  private enumLabel(value: unknown) {
    const raw = String(value ?? '').trim();
    if (!raw) return 'Not provided';
    return raw
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private list(values: unknown) {
    const entries = Array.isArray(values) ? values : values ? [values] : [];
    const labels = entries.map((entry) => this.enumLabel(entry)).filter(Boolean);
    return labels.length ? labels.join(', ') : 'Not provided';
  }

  private async findProject(projectId: string | number) {
    const numericId = Number(projectId);
    const project = Number.isFinite(numericId) && numericId > 0
      ? await this.projectRepo.findOne({ where: { id: numericId } })
      : await this.projectRepo.findOne({ where: { uuid: String(projectId) } as any });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async generateRpaSummary(projectId: string | number): Promise<RpaSummary> {
    const project = await this.findProject(projectId);
    const id = Number(project.id);
    const payload = this.asRecord(project.draftPayload ?? project.payloadJson);

    const [
      energy,
      revenue,
      cashflow,
      risk,
      investment,
      issuance,
      returns,
    ] = await Promise.all([
      this.energyRepo.findOne({ where: { projectId: id } }),
      this.revenueRepo.findOne({ where: { projectId: id } }),
      this.cashflowRepo.findOne({ where: { projectId: id } }),
      this.riskRepo.findOne({ where: { projectId: id } }),
      this.investmentRepo.findOne({ where: { projectId: id } }),
      this.issuanceRepo.findOne({ where: { projectId: id } }),
      this.returnsRepo.findOne({ where: { projectId: id } }),
    ]);

    const assetType = this.first(
      project.projectType,
      project.technologyType,
      payload.projectType,
      payload.asset?.technologyType,
    );
    const capex = this.first(
      project.totalProjectCapex,
      payload.capitalStructure?.totalProjectCapex,
      payload.totalProjectCapex,
    );
    const capitalRaise = this.first(
      project.fundingGoal,
      payload.capitalStructure?.fundingGoal,
      payload.fundingGoal,
      capex,
    );
    const contractedPct = this.first(
      revenue?.contractedRevenuePct,
      payload.revenueModel?.contractedRevenuePct,
      project.contractedAllocationPct,
    );
    const marketPct = this.first(
      revenue?.marketRevenuePct,
      payload.revenueModel?.marketRevenuePct,
      project.merchantAllocationPct,
    );
    const annualContracted = this.first(
      revenue?.annualContractedRevenue,
      payload.revenueModel?.estimatedAnnualSavings,
      project.projectedAnnualRevenue,
    );
    const annualMerchant = this.first(
      revenue?.annualMerchantRevenue,
      payload.revenueModel?.expectedAnnualMerchantRevenue,
      project.expectedAnnualMerchantRevenue,
    );
    const grossRevenue = this.number(annualContracted) + this.number(annualMerchant);
    const annualOpex = this.first(cashflow?.annualOpex, project.operatingCostsPerYear);
    const maintenanceCosts = this.first(cashflow?.maintenanceCosts, 0);
    const feePct =
      this.number(cashflow?.platformFeePct) +
      this.number(cashflow?.operatorFeePct) +
      this.number(cashflow?.otherFeePct);
    const netProjectCashflow =
      grossRevenue - this.number(annualOpex) - this.number(maintenanceCosts) - grossRevenue * (feePct / 100);
    const spvPct = this.first(cashflow?.spvPct, project.spvSharePct, 100);
    const investorAllocation = this.first(investment?.investorAllocationPct, 100);
    const netSpvCashflow = netProjectCashflow * (this.number(spvPct, 100) / 100);
    const distributionAmount = this.first(
      returns?.estimatedPeriodicDistribution,
      project.monthlyDistribution,
      netSpvCashflow * (this.number(investorAllocation, 100) / 100) /
        (String(investment?.distributionFrequency ?? project.distributionFrequency).toLowerCase() === 'quarterly' ? 4 : 12),
    );
    const repaymentStructure = this.text(
      investment?.repaymentStructure ?? payload.investorStructure?.repaymentStructure ?? 'fixed_term',
      'fixed_term',
    );
    const investmentTerm = this.first(
      investment?.investmentTermYears,
      project.investmentTermYears,
      payload.investorStructure?.investmentTermYears,
      payload.investorStructure?.maximumTermYears,
    );
    const targetMultiple = this.first(
      investment?.targetReturnMultiple,
      project.targetReturnMultiple,
      payload.investorStructure?.targetReturnMultiple,
    );
    const minimumTerm = this.first(
      investment?.minimumTermYears,
      payload.investorStructure?.minimumTermYears,
    );

    let investorReturnsBody =
      'Investor returns are structured based on the selected repayment model.\n\n';
    if (repaymentStructure === 'target_multiple') {
      investorReturnsBody += `For this Target Multiple structure, investors receive distributions until a target return multiple of ${this.text(targetMultiple)}x is achieved. Based on projected cashflows, this is expected to occur over an estimated period of ${this.text(returns?.estimatedPaybackYears)} years, with corresponding yield and IRR metrics derived from the underlying revenue profile. The agreement is intended to end once the target multiple is achieved, subject to final legal documentation.`;
    } else if (repaymentStructure === 'hybrid') {
      investorReturnsBody += `For this Hybrid structure, investor returns incorporate both a minimum investment term of ${this.text(minimumTerm)} years and a target return multiple of ${this.text(targetMultiple)}x. This structure is intended to balance duration certainty with performance-based upside, with final exit conditions subject to formal legal documentation.`;
    } else {
      investorReturnsBody += `For this Fixed Term structure, the investment is held over a defined period of ${this.text(investmentTerm)} years, during which investors receive distributions derived from project cashflows. Based on current projections, this corresponds to an estimated annual yield of ${this.pct(returns?.projectedYieldPct)}%, an implied internal rate of return (IRR) of ${this.pct(returns?.impliedIrrPct)}%, and an implied return multiple of ${this.pct(returns?.impliedReturnMultiple)}x over the investment term.`;
    }
    investorReturnsBody +=
      '\n\nAll return metrics are indicative and based on projected cashflows derived from the project’s revenue model and cost assumptions.';

    return {
      title: 'Revenue Participation Agreement Summary',
      subtitle: 'Structured investment summary generated from project inputs',
      status: 'Read only',
      sections: [
        {
          key: 'dealOverview',
          title: '1. Deal Overview',
          body: `This Revenue Participation Agreement Summary outlines the key characteristics of the investment opportunity in the underlying clean energy asset and the capital structure supporting investor participation.\n\nThe project relates to a ${this.text(assetType)} located at ${this.text(project.location ?? payload.siteAddress ?? payload.location)}, with a total project capital requirement of ${this.currency(capex)}. The total capital raise for this opportunity is ${this.currency(capitalRaise)}, representing the amount made available to investors through the RegenX platform.\n\nThe project is structured under a ${this.enumLabel(revenue?.revenueStrategy ?? payload.revenueModel?.revenueStrategy)} revenue model, with an expected revenue mix comprising ${this.pct(contractedPct)}% contracted revenue and ${this.pct(marketPct)}% market-based revenue. This structure reflects the balance between income stability and exposure to market-driven performance.`,
        },
        {
          key: 'revenueModel',
          title: '2. Revenue Model',
          body: `The asset generates revenue through a combination of operational and market-based activities. Primary revenue drivers include ${this.list(revenue?.revenueDrivers ?? payload.revenueModel?.revenueDrivers)}, supported by participation in relevant energy markets and contractual arrangements where applicable.\n\nRevenue is derived from both contracted sources, providing predictable income streams, and merchant activities, which introduce variability based on market conditions. The degree of market exposure is assessed as ${this.enumLabel(revenue?.marketExposure ?? payload.revenueModel?.marketExposure)}, reflecting the project’s sensitivity to wholesale pricing, volatility, and external energy system dynamics.\n\nOperational optimisation of the asset is managed by ${this.enumLabel(revenue?.optimisationResponsibility ?? payload.revenueModel?.optimisationResponsibility)}, responsible for dispatch decisions, market participation, and revenue maximisation strategies.`,
        },
        {
          key: 'cashflowSummary',
          title: '3. Cashflow Summary',
          body: `The project is expected to generate gross annual revenue of approximately ${this.currency(grossRevenue)}, from which operating costs, fees, and allocations are deducted to arrive at net distributable cashflow.\n\nNet cashflow available at the SPV level is estimated at ${this.currency(netSpvCashflow)} per annum, forming the basis for investor distributions.\n\nDistributions are expected to be made on a ${this.enumLabel(investment?.distributionFrequency ?? project.distributionFrequency)} basis, with estimated periodic distributions of approximately ${this.currency(distributionAmount)}, subject to actual project performance and market conditions.`,
        },
        {
          key: 'investorReturns',
          title: '4. Investor Returns',
          body: investorReturnsBody,
        },
        {
          key: 'counterpartyRisk',
          title: '5. Counterparty and Risk Overview',
          body: `The project’s primary revenue counterparty is ${this.text(risk?.counterpartyName ?? project.primaryCounterparty ?? payload.risks?.counterpartyName)}, acting in the capacity of ${this.enumLabel(risk?.counterpartyRole ?? payload.risks?.counterpartyRole)}. The current contract status is ${this.enumLabel(risk?.contractStatus ?? payload.risks?.contractStatus)}, indicating the level of contractual certainty underpinning projected revenues.\n\nThe reliability of project assumptions is based on ${this.enumLabel(risk?.dataConfidence ?? payload.risks?.dataConfidence)}, reflecting whether projections are supported by executed agreements, detailed modelling, or early-stage estimates.\n\nKey dependencies influencing project performance include ${this.list(risk?.operationalDependencies ?? payload.risks?.operationalDependencies)}, such as reliance on market participation, aggregators, or single counterparties. Additional risk considerations include ${this.list(risk?.keyRiskFactors ?? payload.risks?.keyRiskFactors)}, which may impact revenue variability, operational performance, or regulatory outcomes.\n\nInvestors should consider these factors when assessing the overall risk-return profile of the investment.`,
        },
        {
          key: 'investmentStructure',
          title: '6. Investment Structure',
          body: `Investor participation is structured as a ${this.enumLabel(investment?.structureType ?? payload.investorStructure?.structureType)}, providing exposure to project cashflows on a ${this.enumLabel(investment?.cashflowBasis ?? payload.investorStructure?.cashflowBasis)} basis.\n\nInvestors are allocated ${this.pct(investorAllocation)}% of the project’s distributable cashflows, with distributions made on a ${this.enumLabel(investment?.distributionFrequency ?? project.distributionFrequency)} basis. Payment timing is expected to occur ${this.enumLabel(investment?.paymentTiming ?? payload.investorStructure?.paymentTiming)} following revenue realisation.\n\nWhere applicable, investor distributions may be prioritised on a ${this.enumLabel(investment?.investorPriority ?? payload.investorStructure?.investorPriority)} basis within the project’s cashflow waterfall.`,
        },
        {
          key: 'capitalRaisingIssuance',
          title: '7. Capital Raising & Issuance',
          body: `The investment opportunity is facilitated through the issuance of digital units representing proportional participation in project cashflows.\n\nUnits are issued at a price of ${this.currency(issuance?.pricePerUnit ?? payload.tokenStructure?.pricePerToken ?? 1)}, with a total issuance aligned to the project’s capital raise. The minimum investment amount is ${this.currency(issuance?.minimumInvestment ?? project.minimumInvestment ?? payload.capitalStructure?.minimumInvestment)}, corresponding to a defined number of units.\n\nSubject to platform settings, units may be subject to transfer restrictions, lock-up periods, and eligibility requirements. Distribution of investor returns is executed via ${this.enumLabel(issuance?.distributionMethod ?? payload.tokenStructure?.distributionMethod)}, ensuring transparency and traceability of payments.`,
        },
        {
          key: 'agreementBasisDisclaimer',
          title: '8. Agreement Basis and Disclaimer',
          body: 'This document is a structured summary of the proposed investment and is provided for informational purposes only. It does not constitute a legally binding agreement or an offer to invest.\n\nAll financial projections, including yield, IRR, and return multiples, are indicative and based on assumptions derived from the project’s revenue model, cost structure, and market conditions. Actual results may vary.\n\nFinal investment terms, rights, and obligations will be defined in formal legal documentation executed between relevant parties.',
        },
      ],
    };
  }
}
