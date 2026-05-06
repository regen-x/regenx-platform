import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import { databaseSafeDateType } from '../../../../../common/application/constant/persistence.constant';
import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';
import { OfferEntity } from '../../../../offer/infrastructure/persistence/entities/offer.entity';
import { TransactionEntity } from '../../../../transaction/infrastructure/persistence/entities/transaction.entity';
import { ProjectCashflowAllocationEntity } from './project-cashflow-allocation.entity';
import { ProjectEnergyConfigurationEntity } from './project-energy-configuration.entity';
import { ProjectInvestmentStructureEntity } from './project-investment-structure.entity';
import { ProjectIssuanceEntity } from './project-issuance.entity';
import { ProjectReturnOutputsEntity } from './project-return-outputs.entity';
import { ProjectRevenueProfileEntity } from './project-revenue-profile.entity';
import { ProjectRiskInputsEntity } from './project-risk-inputs.entity';

@Entity('project')
export class ProjectEntity extends BaseEntity {
  @Column({ nullable: true })
  name?: string;

  get projectName(): string | undefined {
    return this.name;
  }

  set projectName(value: string | undefined) {
    this.name = value as any;
  }

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'funding_goal', type: 'integer', nullable: true })
  fundingGoal?: number;

  @Column({ name: 'amount_raised', type: 'numeric', nullable: true })
  amountRaised?: string;

  @Column({ type: databaseSafeDateType, nullable: true, name: 'start_date' })
  startDate?: string;

  @Column({ type: databaseSafeDateType, nullable: true, name: 'end_date' })
  endDate?: string;

  @Column({ nullable: true, name: 'climate_impact' })
  climateImpact?: string;

  @Column({ unique: true, nullable: true, name: 'token_symbol' })
  tokenSymbol?: string;

  @Column({ type: 'bigint', nullable: true, name: 'token_supply' })
  tokenSupply?: number;

  @Column({ type: 'bigint', nullable: true, name: 'token_price' })
  tokenPrice?: number;

  @Column({ nullable: true, name: 'token_address' })
  tokenAddress?: string;

  @Column({ nullable: true, name: 'spv_wallet_address', type: 'text' })
  spvWalletAddress?: string;

  @Column({ nullable: true, name: 'developer_wallet_address', type: 'text' })
  developerWalletAddress?: string;

  @Column({ nullable: true, name: 'proceeds_wallet_address', type: 'text' })
  proceedsWalletAddress?: string;

  @Column({
    nullable: true,
    name: 'custody_mode',
    type: 'varchar',
    length: 30,
  })
  custodyMode?: 'self_custody' | 'regenx_custody';

  @Column({ nullable: true, name: 'spv_id', type: 'integer' })
  spvId?: number;

  @Column({ nullable: true, name: 'sponsor_entity_id', type: 'integer' })
  sponsorEntityId?: number;

  @Column({ nullable: true, name: 'series_id', type: 'integer' })
  seriesId?: number;

  @Column({ nullable: true, name: 'issuer_wallet_public', type: 'text' })
  issuerWalletPublic?: string;

  @Column({ nullable: true, name: 'distributor_wallet_public', type: 'text' })
  distributorWalletPublic?: string;

  @Column({ nullable: true, name: 'asset_code', type: 'varchar', length: 20 })
  assetCode?: string;

  @Column({ nullable: true, name: 'asset_issuer', type: 'text' })
  assetIssuer?: string;

  @Column({ nullable: true, name: 'issued_supply', type: 'numeric' })
  issuedSupply?: string;

  @Column({ nullable: true, name: 'issuance_status', type: 'varchar', length: 30, default: 'not_started' })
  issuanceStatus?: string;

  @Column({ nullable: true, name: 'issuance_tx_hash', type: 'text' })
  issuanceTxHash?: string;

  @Column({ nullable: true, name: 'issuance_failure_reason', type: 'text' })
  issuanceFailureReason?: string;

  @Column({ nullable: true, name: 'issuance_failure_payload', type: 'jsonb' })
  issuanceFailurePayload?: Record<string, unknown> | null;

  @Column({ nullable: true, name: 'issuance_initiated_by', type: 'integer' })
  issuanceInitiatedBy?: number;

  @Column({ nullable: true, name: 'wallet_config_locked_at' })
  walletConfigLockedAt?: Date;

  @Column({ nullable: true, name: 'wallet_config_locked_reason', type: 'text' })
  walletConfigLockedReason?: string;

  @Column({ nullable: true, name: 'wallet_last_updated_at' })
  walletLastUpdatedAt?: Date;

  @Column({ nullable: true, name: 'wallet_last_updated_by', type: 'integer' })
  walletLastUpdatedBy?: number;

  @Column({
    nullable: true,
    name: 'custody_setup_status',
    type: 'varchar',
    length: 30,
  })
  custodySetupStatus?: string;

  @Column({ nullable: true, name: 'custody_reviewed_at' })
  custodyReviewedAt?: Date;

  @Column({ nullable: true, name: 'custody_reviewed_by', type: 'integer' })
  custodyReviewedBy?: number;

  @Column({ nullable: true, name: 'custody_block_reason', type: 'text' })
  custodyBlockReason?: string;

  @Column({
    nullable: false,
    name: 'issuance_blocked_by_custody',
    type: 'boolean',
    default: false,
  })
  issuanceBlockedByCustody: boolean;

  @Column({ nullable: true, name: 'issued_at' })
  issuedAt?: Date;

  @Column({ nullable: true, name: 'live_at' })
  liveAt?: Date;

  @Column({ nullable: true, name: 'thumbnail_url' })
  thumbnailUrl?: string;

  get thumbnailImageUrl(): string | undefined {
    return this.thumbnailUrl;
  }

  set thumbnailImageUrl(value: string | undefined) {
    this.thumbnailUrl = value;
  }

  @Column({ default: false, name: 'generates_carbon_credits' })
  generatesCarbonCredits: boolean;

  @Column({ nullable: true, name: 'owner_address' })
  ownerAddress?: string;

  @Column({ nullable: true, name: 'project_type' })
  projectType?: string;

  @Column({ nullable: true, name: 'dse_type' })
  dseType?: string;

  @Column({ nullable: true })
  stage?: string;

  @Column({ nullable: true })
  jurisdiction?: string;

  @Column({ nullable: true, name: 'minimum_investment', type: 'numeric' })
  minimumInvestment?: string;

  @Column({ nullable: true, name: 'total_project_capex', type: 'numeric' })
  totalProjectCapex?: string;

  @Column({ nullable: true, name: 'target_irr', type: 'numeric' })
  targetIrr?: string;

  @Column({ nullable: true, name: 'target_annual_yield', type: 'numeric' })
  targetAnnualYield?: string;

  @Column({ nullable: true, name: 'investment_term_years', type: 'integer' })
  investmentTermYears?: string;

  @Column({ type: 'text', nullable: true, name: 'investment_summary' })
  investmentSummary?: string;

  @Column({ nullable: true, name: 'technology_type', type: 'text' })
  technologyType?: string;

  @Column({ nullable: true, name: 'capacity_kw_mw', type: 'numeric' })
  capacityKwMw?: string;

  @Column({ nullable: true, name: 'energy_output_mwh_year', type: 'numeric' })
  energyOutputMwhYear?: string;

  @Column({ nullable: true, name: 'asset_lifetime_years', type: 'integer' })
  assetLifetimeYears?: string;

  @Column({ nullable: true, name: 'manufacturer', type: 'text' })
  manufacturer?: string;

  @Column({ nullable: true, name: 'model_system_type', type: 'text' })
  modelSystemType?: string;

  @Column({ nullable: true, name: 'site_ownership', type: 'text' })
  siteOwnership?: string;

  @Column({ nullable: true, name: 'land_status', type: 'text' })
  landStatus?: string;

  @Column({ nullable: true, name: 'grid_connection_status', type: 'text' })
  gridConnectionStatus?: string;

  @Column({ nullable: true, name: 'epc_contractor', type: 'text' })
  epcContractor?: string;

  @Column({ nullable: true, name: 'installation_timeline_months', type: 'integer' })
  installationTimelineMonths?: string;

  @Column({ nullable: true, name: 'commissioning_date', type: 'date' })
  commissioningDate?: string;

  @Column({ nullable: true, name: 'expected_utilisation', type: 'numeric' })
  expectedUtilisation?: string;

  @Column({ nullable: true, name: 'degradation_rate', type: 'numeric' })
  degradationRate?: string;

  @Column({ nullable: true, name: 'warranty_terms_years', type: 'integer' })
  warrantyTermsYears?: string;

  @Column({ nullable: true, name: 'om_provider', type: 'text' })
  omProvider?: string;

  @Column({ nullable: true, name: 'primary_counterparty', type: 'text' })
  primaryCounterparty?: string;

  @Column({ nullable: true, name: 'counterparty_type', type: 'text' })
  counterpartyType?: string;

  @Column({ nullable: true, name: 'contract_length_years', type: 'integer' })
  contractLengthYears?: string;

  @Column({ nullable: true, name: 'contract_price', type: 'numeric' })
  contractPrice?: string;

  @Column({ nullable: true, name: 'escalation', type: 'numeric' })
  escalation?: string;

  @Column({ nullable: true, name: 'projected_annual_revenue', type: 'numeric' })
  projectedAnnualRevenue?: string;

  @Column({ nullable: true, name: 'operating_costs_per_year', type: 'numeric' })
  operatingCostsPerYear?: string;

  @Column({ nullable: true, name: 'net_yield', type: 'numeric' })
  netYield?: string;

  @Column({ nullable: true, name: 'equipment_cost', type: 'numeric' })
  equipmentCost?: string;

  @Column({ nullable: true, name: 'installation_cost', type: 'numeric' })
  installationCost?: string;

  @Column({ nullable: true, name: 'grid_connection_cost', type: 'numeric' })
  gridConnectionCost?: string;

  @Column({ nullable: true, name: 'development_costs', type: 'numeric' })
  developmentCosts?: string;

  @Column({ nullable: true, name: 'contingency', type: 'numeric' })
  contingency?: string;

  @Column({ nullable: true, name: 'regenx_fees', type: 'numeric' })
  regenxFees?: string;

  @Column({ nullable: true, name: 'permits_status', type: 'text' })
  permitsStatus?: string;

  @Column({ nullable: true, name: 'environmental_approvals', type: 'text' })
  environmentalApprovals?: string;

  @Column({ nullable: true, name: 'grid_approval_status', type: 'text' })
  gridApprovalStatus?: string;

  @Column({ nullable: true, name: 'construction_risk_level', type: 'text' })
  constructionRiskLevel?: string;

  @Column({ nullable: true, name: 'counterparty_risk_level', type: 'text' })
  counterpartyRiskLevel?: string;

  @Column({ nullable: true, name: 'market_risk_level', type: 'text' })
  marketRiskLevel?: string;

  @Column({ nullable: true, name: 'hedging_strategy', type: 'text' })
  hedgingStrategy?: string;

  @Column({ nullable: true, name: 'fixed_price_epc', type: 'boolean', default: false })
  fixedPriceEpc?: boolean;

  @Column({ nullable: true, name: 'insurance_in_place', type: 'boolean', default: false })
  insuranceInPlace?: boolean;

  @Column({ nullable: true, name: 'spv_name', type: 'text' })
  spvName?: string;

  @Column({ nullable: true, name: 'entity_type', type: 'text' })
  entityType?: string;

  @Column({ nullable: true, name: 'legal_jurisdiction', type: 'text' })
  legalJurisdiction?: string;

  @Column({ nullable: true, name: 'trustee_name', type: 'text' })
  trusteeName?: string;

  @Column({ nullable: true, name: 'custodian', type: 'text' })
  custodian?: string;

  @Column({ nullable: true, name: 'token_type_series', type: 'text' })
  tokenTypeSeries?: string;

  @Column({ nullable: true, name: 'distribution_frequency', type: 'text' })
  distributionFrequency?: string;

  @Column({ nullable: true, name: 'token_name', type: 'text' })
  tokenName?: string;

  @Column({ nullable: true, name: 'mis_structure', type: 'boolean', default: false })
  misStructure?: boolean;

  @Column({ nullable: true, name: 'platform_agreement_accepted', type: 'boolean', default: false })
  platformAgreementAccepted?: boolean;

  @Column({ nullable: true, name: 'developer_declaration_accepted', type: 'boolean', default: false })
  developerDeclarationAccepted?: boolean;

  @Column({ nullable: true, name: 'offering_terms_accepted', type: 'boolean', default: false })
  offeringTermsAccepted?: boolean;

  @Column({ nullable: true, name: 'signatory_full_name', type: 'text' })
  signatoryFullName?: string;

  @Column({ nullable: true, name: 'signatory_title', type: 'text' })
  signatoryTitle?: string;

  @Column({ nullable: true, name: 'signatory_authority', type: 'text' })
  signatoryAuthority?: string;

  @Column({ nullable: true, name: 'signatory_date', type: 'date' })
  signatoryDate?: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb", name: 'payload_json' })
  payloadJson: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb", name: 'workflow_status_json' })
  workflowStatusJson: Record<string, unknown>;

  get workflowStatus(): Record<string, unknown> {
    return this.workflowStatusJson || {};
  }

  set workflowStatus(value: Record<string, unknown>) {
    this.workflowStatusJson = value || {};
  }

  @Column({
    name: 'draft_payload',
    type: 'jsonb',
    nullable: false,
    default: () => "'{}'::jsonb",
  })
  draftPayload: Record<string, unknown>;

  @Column({ default: 0, name: 'completed_count' })
  completedCount: number;

  @Column({ default: 0, name: 'total_sections' })
  totalSections: number;

  @Column({ type: 'text', nullable: true, name: 'admin_notes' })
  adminNotes?: string;

  @Column({
    name: 'review_sections_json',
    type: 'jsonb',
    nullable: true,
    default: () => "'{}'::jsonb",
  })
  reviewSectionsJson?: Record<string, { status: string; comment: string }>;

  @Column({ default: false, name: 'agreement_accepted' })
  agreementAccepted: boolean;

  @Column({ nullable: true, name: 'agreement_accepted_at' })
  agreementAcceptedAt?: Date;

  @Column({ nullable: true, name: 'agreement_version' })
  agreementVersion?: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ nullable: true, name: 'submitted_at' })
  submittedAt?: Date;

  @Column({ name: 'last_saved_at', type: 'timestamptz', nullable: true })
  lastSavedAt?: Date | null;

  @Column({ nullable: true, name: 'approved_at' })
  approvedAt?: Date;

  @Column({ nullable: true, name: 'rejected_at' })
  rejectedAt?: Date;

  @Column({ nullable: true, name: 'locked_at' })
  lockedAt?: Date;

  @Column({ nullable: true, type: 'text', name: 'lock_reason' })
  lockReason?: string;

  @Column({ nullable: true, name: 'last_reviewed_at' })
  lastReviewedAt?: Date;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'last_reviewed_by' })
  lastReviewedBy?: UserEntity;

  @Column({ nullable: true, name: 'current_version_id' })
  currentVersionId?: number;

  @ManyToOne(() => UserEntity, (user) => user.projects)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => OfferEntity, (offer) => offer.project)
  offers: OfferEntity[];

  @OneToMany(() => TransactionEntity, (transaction) => transaction.project)
  transactions: TransactionEntity[];

  @OneToMany(
    () => ProjectEnergyConfigurationEntity,
    (energyConfiguration) => energyConfiguration.project,
  )
  energyConfigurations: ProjectEnergyConfigurationEntity[];

  @OneToMany(
    () => ProjectRevenueProfileEntity,
    (revenueProfile) => revenueProfile.project,
  )
  revenueProfiles: ProjectRevenueProfileEntity[];

  @OneToMany(
    () => ProjectCashflowAllocationEntity,
    (cashflowAllocation) => cashflowAllocation.project,
  )
  cashflowAllocations: ProjectCashflowAllocationEntity[];

  @OneToMany(
    () => ProjectRiskInputsEntity,
    (riskInputs) => riskInputs.project,
  )
  riskInputs: ProjectRiskInputsEntity[];

  @OneToMany(
    () => ProjectInvestmentStructureEntity,
    (investmentStructure) => investmentStructure.project,
  )
  investmentStructures: ProjectInvestmentStructureEntity[];

  @OneToMany(() => ProjectIssuanceEntity, (issuance) => issuance.project)
  issuances: ProjectIssuanceEntity[];

  @OneToMany(
    () => ProjectReturnOutputsEntity,
    (returnOutputs) => returnOutputs.project,
  )
  returnOutputs: ProjectReturnOutputsEntity[];


  // =========================
  // RPA / Revenue Fields
  // =========================

  @Column({ name: 'estimated_annual_savings', type: 'numeric', nullable: true })
  estimatedAnnualSavings?: number;

  @Column({ name: 'spv_share_pct', type: 'numeric', nullable: true })
  spvSharePct?: number;

  @Column({ name: 'host_share_pct', type: 'numeric', nullable: true })
  hostSharePct?: number;

  @Column({ name: 'minimum_payment_floor', type: 'numeric', nullable: true })
  minimumPaymentFloor?: number;

  @Column({ name: 'expected_annual_merchant_revenue', type: 'numeric', nullable: true })
  expectedAnnualMerchantRevenue?: number;

  @Column({ name: 'aggregator_fee_pct', type: 'numeric', nullable: true })
  aggregatorFeePct?: number;

  @Column({ name: 'contracted_allocation_pct', type: 'numeric', nullable: true })
  contractedAllocationPct?: number;

  @Column({ name: 'merchant_allocation_pct', type: 'numeric', nullable: true })
  merchantAllocationPct?: number;

  @Column({ name: 'target_return_multiple', type: 'numeric', nullable: true })
  targetReturnMultiple?: number;

  @Column({ name: 'return_type', type: 'text', nullable: true })
  returnType?: string;

  @Column({ name: 'termination_trigger', type: 'text', nullable: true })
  terminationTrigger?: string;


  @Column({ name: 'rpa_output_json', type: 'jsonb', nullable: true })
  rpaOutputJson?: Record<string, any> | null;

  @Column({ name: 'estimated_duration_years', type: 'numeric', nullable: true })
  estimatedDurationYears?: number | null;

  @Column({ name: 'implied_irr_pct', type: 'numeric', nullable: true })
  impliedIrrPct?: number | null;

  @Column({ name: 'gross_annual_revenue_to_spv', type: 'numeric', nullable: true })
  grossAnnualRevenueToSpv?: number | null;

  @Column({ name: 'net_annual_cashflow_to_spv', type: 'numeric', nullable: true })
  netAnnualCashflowToSpv?: number | null;

  @Column({ name: 'monthly_distribution', type: 'numeric', nullable: true })
  monthlyDistribution?: number | null;

  @Column({ name: 'target_cash_return', type: 'numeric', nullable: true })
  targetCashReturn?: number | null;

}
