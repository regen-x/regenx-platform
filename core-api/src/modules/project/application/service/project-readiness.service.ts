import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectCashflowAllocationEntity } from '../../infrastructure/persistence/entities/project-cashflow-allocation.entity';
import { ProjectEnergyConfigurationEntity } from '../../infrastructure/persistence/entities/project-energy-configuration.entity';
import { ProjectEntity } from '../../infrastructure/persistence/entities/project.entity';
import { ProjectInvestmentStructureEntity } from '../../infrastructure/persistence/entities/project-investment-structure.entity';
import { ProjectIssuanceEntity } from '../../infrastructure/persistence/entities/project-issuance.entity';
import { ProjectReturnOutputsEntity } from '../../infrastructure/persistence/entities/project-return-outputs.entity';
import { ProjectRevenueProfileEntity } from '../../infrastructure/persistence/entities/project-revenue-profile.entity';
import { ProjectRiskInputsEntity } from '../../infrastructure/persistence/entities/project-risk-inputs.entity';
import { ReturnEngineService } from './return-engine.service';

type AnyRecord = Record<string, any>;
type SectionName =
  | 'energy-configuration'
  | 'revenue-profile'
  | 'cashflow-allocation'
  | 'risk-inputs'
  | 'investment-structure'
  | 'issuance'
  | 'return-outputs';

@Injectable()
export class ProjectReadinessService {
  private readonly blockedManualFields = new Set([
    'yield',
    'targetYield',
    'targetAnnualYield',
    'target_annual_yield',
    'projectedYieldPct',
    'projected_yield_pct',
    'irr',
    'targetIrr',
    'target_irr',
    'impliedIrrPct',
    'implied_irr_pct',
    'riskScore',
    'risk_score',
    'impliedMultiple',
    'implied_multiple',
    'impliedReturnMultiple',
    'implied_return_multiple',
    'ownershipPerToken',
    'ownership_per_token',
    'tokenSupply',
    'token_supply',
    'totalTokenSupply',
    'total_token_supply',
    'totalUnitsIssued',
    'total_units_issued',
    'unitsAvailableToInvestors',
    'units_available_to_investors',
    'unitsPerMinimum',
    'units_per_minimum',
  ]);

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
    private readonly investmentStructureRepo: Repository<ProjectInvestmentStructureEntity>,

    @InjectRepository(ProjectIssuanceEntity)
    private readonly issuanceRepo: Repository<ProjectIssuanceEntity>,

    @InjectRepository(ProjectReturnOutputsEntity)
    private readonly returnOutputsRepo: Repository<ProjectReturnOutputsEntity>,

    private readonly returnEngineService: ReturnEngineService,
  ) {}

  private toNumber(value: unknown, fallback = 0): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  private normalizeText(value: unknown): string | null {
    if (value === undefined) return undefined as any;
    if (value === null) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
  }

  private normalizeNumber(value: unknown): string | null {
    if (value === undefined) return undefined as any;
    if (value === null || value === '') return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw new BadRequestException('Numeric fields must contain valid numbers');
    }
    return String(numeric);
  }

  private normalizeBoolean(value: unknown): boolean | null {
    if (value === undefined) return undefined as any;
    if (value === null || value === '') return null;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    throw new BadRequestException('Boolean fields must contain true or false');
  }

  private normalizeStringList(value: unknown): string[] | null {
    if (value === undefined) return undefined as any;
    if (value === null || value === '') return null;
    const entries = Array.isArray(value) ? value : [value];
    return entries
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  private camelizeBody(body: AnyRecord): AnyRecord {
    return Object.entries(body ?? {}).reduce((memo, [key, value]) => {
      const normalizedKey = key.replace(/_([a-z])/g, (_, character: string) =>
        character.toUpperCase(),
      );
      memo[normalizedKey] = value;
      return memo;
    }, {} as AnyRecord);
  }

  private assertAllowedFields(body: AnyRecord, allowedFields: string[]) {
    const allowed = new Set(allowedFields);
    const blocked = Object.keys(body).filter((key) => this.blockedManualFields.has(key));
    if (blocked.length > 0) {
      throw new BadRequestException(
        `Calculated fields cannot be supplied manually: ${blocked.join(', ')}`,
      );
    }

    const unknown = Object.keys(body).filter((key) => !allowed.has(key));
    if (unknown.length > 0) {
      throw new BadRequestException(`Unsupported fields: ${unknown.join(', ')}`);
    }
  }

  private assertEnum(value: unknown, allowedValues: string[], fieldName: string) {
    if (value === undefined || value === null || value === '') return;
    if (!allowedValues.includes(String(value))) {
      throw new BadRequestException(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
    }
  }

  private assertPctSum(fields: Array<[string, unknown]>, expected = 100) {
    if (fields.every(([, value]) => value !== undefined && value !== null && value !== '')) {
      const total = fields.reduce((sum, [, value]) => sum + this.toNumber(value), 0);
      if (Math.abs(total - expected) > 0.000001) {
        throw new BadRequestException(
          `${fields.map(([name]) => name).join(' + ')} must equal ${expected}`,
        );
      }
    }
  }

  private async findProjectOrThrow(id: string | number) {
    const numericId = Number(id);
    const project = Number.isFinite(numericId) && numericId > 0
      ? await this.projectRepo.findOne({ where: { id: numericId }, relations: ['user'] })
      : await this.projectRepo.findOne({ where: { uuid: String(id) } as any, relations: ['user'] });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private assertCanReadProject(project: ProjectEntity, userId: number, isAdmin: boolean) {
    if (isAdmin) return;
    if (!project.user || Number(project.user.id) !== Number(userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private assertCanEditProject(project: ProjectEntity, userId: number, isAdmin: boolean) {
    this.assertCanReadProject(project, userId, isAdmin);
    if (!['draft', 'changes_requested'].includes(String(project.status ?? 'draft'))) {
      throw new BadRequestException('Project cannot be edited in its current status');
    }
  }

  private async upsert<T extends { projectId: number }>(
    repo: Repository<T>,
    projectId: number,
    values: Partial<T>,
  ) {
    const existing = await repo.findOne({ where: { projectId } as any });
    const entity = repo.create({
      ...(existing ?? {}),
      ...values,
      projectId,
    } as any);
    return repo.save(entity);
  }

  private serializeSection(value: unknown) {
    if (!value) return null;
    return value;
  }

  async getReadiness(projectId: string, userId: number, isAdmin: boolean) {
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanReadProject(project, userId, isAdmin);
    const id = Number(project.id);

    const [
      energyConfiguration,
      revenueProfile,
      cashflowAllocation,
      riskInputs,
      investmentStructure,
      issuance,
      returnOutputs,
    ] = await Promise.all([
      this.energyRepo.findOne({ where: { projectId: id } }),
      this.revenueRepo.findOne({ where: { projectId: id } }),
      this.cashflowRepo.findOne({ where: { projectId: id } }),
      this.riskRepo.findOne({ where: { projectId: id } }),
      this.investmentStructureRepo.findOne({ where: { projectId: id } }),
      this.issuanceRepo.findOne({ where: { projectId: id } }),
      this.returnOutputsRepo.findOne({ where: { projectId: id } }),
    ]);

    return {
      projectId: id,
      energyConfiguration: this.serializeSection(energyConfiguration),
      revenueProfile: this.serializeSection(revenueProfile),
      cashflowAllocation: this.serializeSection(cashflowAllocation),
      riskInputs: this.serializeSection(riskInputs),
      investmentStructure: this.serializeSection(investmentStructure),
      issuance: this.serializeSection(issuance),
      returnOutputs: this.serializeSection(returnOutputs),
    };
  }

  async getSection(projectId: string, section: SectionName, userId: number, isAdmin: boolean) {
    const readiness = await this.getReadiness(projectId, userId, isAdmin);
    const map: Record<SectionName, unknown> = {
      'energy-configuration': readiness.energyConfiguration,
      'revenue-profile': readiness.revenueProfile,
      'cashflow-allocation': readiness.cashflowAllocation,
      'risk-inputs': readiness.riskInputs,
      'investment-structure': readiness.investmentStructure,
      issuance: readiness.issuance,
      'return-outputs': readiness.returnOutputs,
    };

    return map[section] ?? null;
  }

  async saveEnergyConfiguration(projectId: string, body: AnyRecord, userId: number, isAdmin: boolean) {
    body = this.camelizeBody(body);
    this.assertAllowedFields(body, [
      'gridPosition',
      'electricitySupplyArrangement',
      'tariffStructure',
      'onsiteGenerationType',
      'demandChargesStatus',
      'marketAccess',
    ]);
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanEditProject(project, userId, isAdmin);
    this.assertEnum(body.gridPosition, ['behind_the_meter', 'embedded_network', 'front_of_meter'], 'gridPosition');
    this.assertEnum(body.electricitySupplyArrangement, ['standard_retail_contract', 'negotiated_commercial_contract', 'no_agreement', 'unknown'], 'electricitySupplyArrangement');
    this.assertEnum(body.onsiteGenerationType, ['solar', 'other', 'none'], 'onsiteGenerationType');
    this.assertEnum(body.demandChargesStatus, ['yes', 'no', 'unknown'], 'demandChargesStatus');
    this.assertEnum(body.marketAccess, ['aggregator_vpp', 'direct_participation', 'no', 'planned'], 'marketAccess');

    return this.upsert(this.energyRepo, Number(project.id), {
      gridPosition: this.normalizeText(body.gridPosition),
      electricitySupplyArrangement: this.normalizeText(body.electricitySupplyArrangement),
      tariffStructure: this.normalizeStringList(body.tariffStructure),
      onsiteGenerationType: this.normalizeText(body.onsiteGenerationType),
      demandChargesStatus: this.normalizeText(body.demandChargesStatus),
      marketAccess: this.normalizeText(body.marketAccess),
    });
  }

  async saveRevenueProfile(projectId: string, body: AnyRecord, userId: number, isAdmin: boolean) {
    body = this.camelizeBody(body);
    this.assertAllowedFields(body, [
      'revenueStrategy',
      'revenueDrivers',
      'marketRevenuePct',
      'contractedRevenuePct',
      'annualContractedRevenue',
      'annualMerchantRevenue',
      'marketParticipation',
      'optimisationResponsibility',
      'revenueRiskManagement',
      'marketExposure',
      'marketGridDrivers',
    ]);
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanEditProject(project, userId, isAdmin);
    this.assertEnum(body.revenueStrategy, ['primarily_contracted', 'primarily_merchant', 'hybrid'], 'revenueStrategy');
    this.assertEnum(body.marketParticipation, ['full_merchant', 'hybrid_participation', 'fully_contracted'], 'marketParticipation');
    this.assertEnum(body.optimisationResponsibility, ['internal_operator', 'external_optimiser_aggregator'], 'optimisationResponsibility');
    this.assertEnum(body.marketExposure, ['high', 'medium', 'low'], 'marketExposure');
    this.assertPctSum([
      ['marketRevenuePct', body.marketRevenuePct],
      ['contractedRevenuePct', body.contractedRevenuePct],
    ]);

    return this.upsert(this.revenueRepo, Number(project.id), {
      revenueStrategy: this.normalizeText(body.revenueStrategy),
      revenueDrivers: this.normalizeStringList(body.revenueDrivers),
      marketRevenuePct: this.normalizeNumber(body.marketRevenuePct),
      contractedRevenuePct: this.normalizeNumber(body.contractedRevenuePct),
      annualContractedRevenue: this.normalizeNumber(body.annualContractedRevenue),
      annualMerchantRevenue: this.normalizeNumber(body.annualMerchantRevenue),
      marketParticipation: this.normalizeText(body.marketParticipation),
      optimisationResponsibility: this.normalizeText(body.optimisationResponsibility),
      revenueRiskManagement: this.normalizeStringList(body.revenueRiskManagement),
      marketExposure: this.normalizeText(body.marketExposure),
      marketGridDrivers: this.normalizeStringList(body.marketGridDrivers),
    });
  }

  async saveCashflowAllocation(projectId: string, body: AnyRecord, userId: number, isAdmin: boolean) {
    body = this.camelizeBody(body);
    this.assertAllowedFields(body, [
      'spvPct',
      'hostPct',
      'operatorAggregatorPct',
      'platformFeePct',
      'operatorFeePct',
      'otherFeePct',
      'annualOpex',
      'maintenanceCosts',
    ]);
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanEditProject(project, userId, isAdmin);
    this.assertPctSum([
      ['spvPct', body.spvPct],
      ['hostPct', body.hostPct],
      ['operatorAggregatorPct', body.operatorAggregatorPct],
    ]);

    return this.upsert(this.cashflowRepo, Number(project.id), {
      spvPct: this.normalizeNumber(body.spvPct),
      hostPct: this.normalizeNumber(body.hostPct),
      operatorAggregatorPct: this.normalizeNumber(body.operatorAggregatorPct),
      platformFeePct: this.normalizeNumber(body.platformFeePct),
      operatorFeePct: this.normalizeNumber(body.operatorFeePct),
      otherFeePct: this.normalizeNumber(body.otherFeePct),
      annualOpex: this.normalizeNumber(body.annualOpex),
      maintenanceCosts: this.normalizeNumber(body.maintenanceCosts),
    });
  }

  async saveRiskInputs(projectId: string, body: AnyRecord, userId: number, isAdmin: boolean) {
    body = this.camelizeBody(body);
    this.assertAllowedFields(body, [
      'counterpartyName',
      'counterpartyType',
      'counterpartyRole',
      'contractStatus',
      'siteSecured',
      'gridConnectionStatus',
      'permitsStatus',
      'epcContractorStatus',
      'operationalDependencies',
      'keyRiskFactors',
      'dataConfidence',
    ]);
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanEditProject(project, userId, isAdmin);
    this.assertEnum(body.counterpartyType, ['energy_retailer', 'corporate_offtaker', 'government_utility', 'aggregator', 'host_site', 'none_merchant_exposure'], 'counterpartyType');
    this.assertEnum(body.counterpartyRole, ['offtaker', 'host', 'aggregator', 'none'], 'counterpartyRole');
    this.assertEnum(body.contractStatus, ['signed', 'term_sheet_loi', 'in_negotiation', 'none'], 'contractStatus');
    this.assertEnum(body.gridConnectionStatus, ['not_started', 'in_progress', 'approved'], 'gridConnectionStatus');
    this.assertEnum(body.permitsStatus, ['not_started', 'in_progress', 'approved'], 'permitsStatus');
    this.assertEnum(body.epcContractorStatus, ['engaged', 'not_engaged'], 'epcContractorStatus');
    this.assertEnum(body.dataConfidence, ['signed_agreements', 'detailed_modelling', 'early_stage_assumptions'], 'dataConfidence');

    return this.upsert(this.riskRepo, Number(project.id), {
      counterpartyName: this.normalizeText(body.counterpartyName),
      counterpartyType: this.normalizeText(body.counterpartyType),
      counterpartyRole: this.normalizeText(body.counterpartyRole),
      contractStatus: this.normalizeText(body.contractStatus),
      siteSecured: this.normalizeBoolean(body.siteSecured),
      gridConnectionStatus: this.normalizeText(body.gridConnectionStatus),
      permitsStatus: this.normalizeText(body.permitsStatus),
      epcContractorStatus: this.normalizeText(body.epcContractorStatus),
      operationalDependencies: this.normalizeStringList(body.operationalDependencies),
      keyRiskFactors: this.normalizeStringList(body.keyRiskFactors),
      dataConfidence: this.normalizeText(body.dataConfidence),
    });
  }

  async saveInvestmentStructure(projectId: string, body: AnyRecord, userId: number, isAdmin: boolean) {
    body = this.camelizeBody(body);
    this.assertAllowedFields(body, [
      'structureType',
      'investorAllocationPct',
      'repaymentStructure',
      'investmentTermYears',
      'targetReturnMultiple',
      'minimumTermYears',
      'distributionFrequency',
      'returnType',
      'cashflowBasis',
      'investorPriority',
      'paymentTiming',
    ]);
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanEditProject(project, userId, isAdmin);
    this.assertEnum(body.structureType, ['revenue_participation_agreement', 'energy_services_agreement', 'hybrid'], 'structureType');
    this.assertEnum(body.repaymentStructure, ['fixed_term', 'target_multiple', 'hybrid'], 'repaymentStructure');
    this.assertEnum(body.distributionFrequency, ['monthly', 'quarterly'], 'distributionFrequency');
    this.assertEnum(body.returnType, ['yield_income', 'growth_capital_income'], 'returnType');
    this.assertEnum(body.cashflowBasis, ['share_total_project_revenue', 'share_net_cashflow', 'share_energy_savings'], 'cashflowBasis');
    this.assertEnum(body.investorPriority, ['preferred_distribution', 'pro_rata'], 'investorPriority');
    this.assertEnum(body.paymentTiming, ['immediate', 'days_30', 'days_60'], 'paymentTiming');

    if (body.repaymentStructure === 'fixed_term' && body.investmentTermYears === undefined) {
      throw new BadRequestException('investmentTermYears is required for fixed_term repayment structures');
    }
    if (body.repaymentStructure === 'target_multiple' && body.targetReturnMultiple === undefined) {
      throw new BadRequestException('targetReturnMultiple is required for target_multiple repayment structures');
    }
    if (
      body.repaymentStructure === 'hybrid' &&
      (body.minimumTermYears === undefined || body.targetReturnMultiple === undefined)
    ) {
      throw new BadRequestException('minimumTermYears and targetReturnMultiple are required for hybrid repayment structures');
    }

    const saved = await this.upsert(this.investmentStructureRepo, Number(project.id), {
      structureType: this.normalizeText(body.structureType),
      investorAllocationPct: this.normalizeNumber(body.investorAllocationPct),
      repaymentStructure: this.normalizeText(body.repaymentStructure),
      investmentTermYears: this.normalizeNumber(body.investmentTermYears),
      targetReturnMultiple: this.normalizeNumber(body.targetReturnMultiple),
      minimumTermYears: this.normalizeNumber(body.minimumTermYears),
      distributionFrequency: this.normalizeText(body.distributionFrequency),
      returnType: this.normalizeText(body.returnType),
      cashflowBasis: this.normalizeText(body.cashflowBasis),
      investorPriority: this.normalizeText(body.investorPriority),
      paymentTiming: this.normalizeText(body.paymentTiming),
    });

    await this.recalculateIssuanceIfPresent(project);
    return saved;
  }

  private tokenPrefix(project: ProjectEntity) {
    const type = `${project.projectType ?? ''} ${project.technologyType ?? ''} ${project.dseType ?? ''}`.toLowerCase();
    const hasBattery = type.includes('battery');
    const hasSolar = type.includes('solar');
    if (hasBattery && hasSolar) return 'BAS';
    if (hasBattery) return 'BAT';
    if (hasSolar) return 'SOL';
    if (type.includes('wind')) return 'WND';
    if (type.includes('hydrogen')) return 'HYD';
    return 'OTH';
  }

  private validateTokenSymbol(symbol: string) {
    const normalized = String(symbol ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{1,5}$/.test(normalized)) {
      throw new BadRequestException('tokenSymbol must be uppercase alphanumeric, unique, and no more than 5 characters');
    }
    return normalized;
  }

  private async generateTokenSymbol(project: ProjectEntity) {
    const prefix = this.tokenPrefix(project);
    for (let index = 1; index <= 99; index += 1) {
      const candidate = `${prefix}${String(index).padStart(2, '0')}`;
      const existing = await this.issuanceRepo.findOne({
        where: { tokenSymbol: candidate },
      });
      if (!existing) return candidate;
    }

    throw new BadRequestException(`No available token symbols for prefix ${prefix}`);
  }

  private async recalculateIssuance(project: ProjectEntity, issuance: ProjectIssuanceEntity) {
    const structure = await this.investmentStructureRepo.findOne({
      where: { projectId: Number(project.id) },
    });
    const pricePerUnit = this.toNumber(issuance.pricePerUnit, 1);
    const totalCapitalRaise = this.toNumber(project.fundingGoal || project.totalProjectCapex);
    const investorAllocationPct = this.toNumber(structure?.investorAllocationPct, 100);
    const minimumInvestment = this.toNumber(issuance.minimumInvestment ?? project.minimumInvestment);

    if (pricePerUnit <= 0) {
      throw new BadRequestException('pricePerUnit must be greater than zero');
    }
    if (totalCapitalRaise <= 0) {
      throw new BadRequestException('Capital raise must be set before issuance can be calculated');
    }

    issuance.totalUnitsIssued = String(totalCapitalRaise / pricePerUnit);
    issuance.unitsAvailableToInvestors = String(
      (this.toNumber(issuance.totalUnitsIssued) * investorAllocationPct) / 100,
    );
    issuance.unitsPerMinimum = minimumInvestment > 0 ? String(minimumInvestment / pricePerUnit) : null;
  }

  private async recalculateIssuanceIfPresent(project: ProjectEntity) {
    const issuance = await this.issuanceRepo.findOne({ where: { projectId: Number(project.id) } });
    if (!issuance) return;
    if (this.toNumber(project.fundingGoal || project.totalProjectCapex) <= 0) return;
    if (this.toNumber(issuance.pricePerUnit, 1) <= 0) return;
    await this.recalculateIssuance(project, issuance);
    await this.issuanceRepo.save(issuance);
  }

  async saveIssuance(projectId: string, body: AnyRecord, userId: number, isAdmin: boolean) {
    body = this.camelizeBody(body);
    this.assertAllowedFields(body, [
      'pricePerUnit',
      'tokenSymbol',
      'minimumInvestment',
      'distributionMethod',
      'secondaryTradingEnabled',
      'lockupPeriodMonths',
      'transferRestrictions',
      'walletRequired',
    ]);
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanEditProject(project, userId, isAdmin);
    this.assertEnum(body.distributionMethod, ['on_chain_payout'], 'distributionMethod');

    const existing = await this.issuanceRepo.findOne({ where: { projectId: Number(project.id) } });
    let requestedSymbol = body.tokenSymbol
      ? this.validateTokenSymbol(body.tokenSymbol)
      : existing?.tokenSymbol ?? await this.generateTokenSymbol(project);
    const symbolOwner = await this.issuanceRepo.findOne({ where: { tokenSymbol: requestedSymbol } });
    if (symbolOwner && Number(symbolOwner.projectId) !== Number(project.id)) {
      requestedSymbol = existing?.tokenSymbol ?? await this.generateTokenSymbol(project);
    }

    const issuance = this.issuanceRepo.create({
      ...(existing ?? {}),
      projectId: Number(project.id),
      pricePerUnit: this.normalizeNumber(body.pricePerUnit) ?? existing?.pricePerUnit ?? '1',
      tokenSymbol: requestedSymbol,
      minimumInvestment: this.normalizeNumber(body.minimumInvestment) ?? existing?.minimumInvestment ?? project.minimumInvestment ?? null,
      distributionMethod: this.normalizeText(body.distributionMethod) ?? existing?.distributionMethod ?? 'on_chain_payout',
      secondaryTradingEnabled:
        this.normalizeBoolean(body.secondaryTradingEnabled) ?? existing?.secondaryTradingEnabled ?? false,
      lockupPeriodMonths:
        body.lockupPeriodMonths === undefined || body.lockupPeriodMonths === null || body.lockupPeriodMonths === ''
          ? existing?.lockupPeriodMonths ?? null
          : Math.trunc(this.toNumber(body.lockupPeriodMonths)),
      transferRestrictions:
        this.normalizeText(body.transferRestrictions) ?? existing?.transferRestrictions ?? null,
      walletRequired: this.normalizeBoolean(body.walletRequired) ?? existing?.walletRequired ?? true,
    });

    if (
      this.toNumber(project.fundingGoal || project.totalProjectCapex) > 0 &&
      this.toNumber(issuance.pricePerUnit, 1) > 0
    ) {
      await this.recalculateIssuance(project, issuance);
    }
    const saved = await this.issuanceRepo.save(issuance);

    project.tokenSymbol = saved.tokenSymbol;
    project.tokenPrice = Math.round(this.toNumber(saved.pricePerUnit) * 10 ** 7);
    await this.projectRepo.save(project);

    return saved;
  }

  async calculateReturns(projectId: string, userId: number, isAdmin: boolean) {
    const project = await this.findProjectOrThrow(projectId);
    this.assertCanReadProject(project, userId, isAdmin);

    if (this.toNumber(project.fundingGoal || project.totalProjectCapex) <= 0) {
      return {
        projectId: Number(project.id),
        status: 'incomplete',
        message: 'Capital raise must be greater than zero before returns can be calculated',
      };
    }

    try {
      return await this.returnEngineService.calculateProjectReturns(Number(project.id));
    } catch (error) {
      return {
        projectId: Number(project.id),
        status: 'incomplete',
        message: (error as Error)?.message ?? 'Return inputs are incomplete',
      };
    }
  }
}
