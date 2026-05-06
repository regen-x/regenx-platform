import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/components/admin-ui';
import ProjectLifecycleStatusCard from '@/components/project/ProjectLifecycleStatusCard';
import RevenueParticipationAgreementModal, {
	RevenueParticipationAgreementContent,
	type RpaSummary,
} from '@/components/rpa/RevenueParticipationAgreementModal';
import type { IProject } from '@/interfaces/api/IProject';
import { projectService } from '@/services/project.service';

type DseType = 'Operating DSE' | 'Development DSE' | 'Hybrid DSE';
type ProjectType = 'Battery BESS' | 'Solar' | 'Hybrid';
type ProjectStage = 'Development' | 'Construction' | 'Operating';
type SiteControl =
	| 'Owned'
	| 'Leased'
	| 'Option to Lease'
	| 'Host Site Agreement';
type GridConnectionStatus =
	| 'Not started'
	| 'Feasibility underway'
	| 'Application submitted'
	| 'Approved'
	| 'Connected';
type RevenueStructure = 'ESA' | 'RPA' | 'Hybrid';
type RevenueSource =
	| 'Savings'
	| 'FCAS'
	| 'Arbitrage'
	| 'VPP'
	| 'Energy Sales'
	| 'Demand Charge Reduction'
	| 'Solar Optimisation';
type CounterpartyType =
	| 'Retailer'
	| 'Corporate'
	| 'Utility'
	| 'Aggregator'
	| 'Government'
	| 'N/A';
type DistributionFrequency = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
type ReturnType =
	| 'yield_income'
	| 'growth_capital_income'
	| 'Yield'
	| 'IRR'
	| 'Multiple';
type RiskLevel = 'Low' | 'Medium' | 'High';
type DocumentStatus = 'Available' | 'Pending' | 'Not Applicable';
type FireControl =
	| 'Integrated suppression'
	| 'Water tanks'
	| 'Gas suppression'
	| 'Hybrid system'
	| 'To be confirmed';
type CreditQuality = 'Strong' | 'Good' | 'Average' | 'Weak' | 'Unknown';
type BaselineMethod = 'Fixed' | 'Dynamic' | '';
type RevenueModelType =
	| 'Percent of savings'
	| 'Fixed $/kWh equivalent'
	| 'Hybrid'
	| '';
type TokenDistributionMethod = 'On-chain payout' | 'Off-chain distribution';
type WorkflowStatus = 'Not Started' | 'In Progress' | 'Completed';

type WorkflowKey =
	| 'projectBasics'
	| 'assetModule'
	| 'capitalStructure'
	| 'energyGridConfiguration'
	| 'revenueModel'
	| 'cashflowAllocation'
	| 'riskInputs'
	| 'documents'
	| 'investmentStructure'
	| 'tokenStructure'
	| 'rpaReviewSubmit';

type WorkflowItem = {
	key: WorkflowKey;
	title: string;
	description: string;
};

type UseOfFunds = {
	equipmentCost: string;
	installationCost: string;
	gridConnectionCost: string;
	developmentCosts: string;
	contingency: string;
	regenxFees: string;
};

type BatteryAssetFields = {
	powerCapacityMw: string;
	energyCapacityMwh: string;
	durationHours: string;
	cyclesPerDay: string;
	expectedAnnualThroughputMwh: string;
	batteryManufacturer: string;
	batteryModel: string;
	augmentationPlan: string;
	replacementScheduleYears: string;
	fireEmergencyControls: FireControl;
};

type SolarAssetFields = {
	dcCapacityMw: string;
	acCapacityMw: string;
	expectedAnnualGenerationMwh: string;
	capacityFactorPct: string;
	panelManufacturer: string;
	panelType: string;
	inverterManufacturer: string;
	inverterType: string;
	mountingSystem: string;
	irradianceYieldAssumptions: string;
	curtailmentAssumptionPct: string;
};

type HybridAssetFields = {
	coLocated: boolean;
	sharedGridConnection: boolean;
	dispatchStrategy: string;
	sharedInfrastructureNotes: string;
};

type RevenueModelFields = {
	recommendedStructure: RevenueStructure;
	recommendedReason: string;
	overrideRecommendedStructure: boolean;
	overrideReasonText: string;
	selectedStructure: RevenueStructure;
	revenueSources: RevenueSource[];
	hostSiteName: string;
	counterpartyType: CounterpartyType;
	industry: string;
	creditQuality: CreditQuality;
	primaryCounterparty: string;
	agreementType: string;
	contractLengthYears: string;
	extensionOption: string;
	earlyTerminationNotes: string;
	baselineMethod: BaselineMethod;
	escalationPct: string;
	revenueModelType: RevenueModelType;
	estimatedAnnualSavings: string;
	spvSharePct: string;
	hostSharePct: string;
	minimumPaymentFloor: string;
	merchantEnabled: boolean;
	expectedAnnualMerchantRevenue: string;
	aggregatorName: string;
	aggregatorFeePct: string;
	merchantRevenueStreams: RevenueSource[];
	contractedAllocationPct: string;
	merchantAllocationPct: string;
	paymentFrequency: DistributionFrequency;
	paymentDelayDays: string;
	revenueAllocationPriority: string;
	revenueStrategy: string;
	revenueDrivers: string[];
	marketRevenuePct: string;
	contractedRevenuePct: string;
	marketParticipation: string;
	optimisationResponsibility: string;
	revenueRiskManagement: string[];
	marketExposure: string;
	marketGridDrivers: string[];
};

type EnergyGridConfigurationFields = {
	gridPosition: string;
	electricitySupplyArrangement: string;
	tariffStructure: string[];
	onsiteGenerationType: string;
	demandChargesStatus: string;
	marketAccess: string;
};

type CashflowAllocationFields = {
	spvPct: string;
	hostPct: string;
	operatorAggregatorPct: string;
	platformFeePct: string;
	operatorFeePct: string;
	otherFeePct: string;
	annualOpex: string;
	maintenanceCosts: string;
};

type CapitalStructureFields = {
	totalProjectCapex: string;
	fundingGoal: string;
	investorAllocation: string;
	investorOwnershipPct: string;
	minimumInvestment: string;
	fundingTranches: string;
	fundingDrawdownStages: string;
};

type InvestorStructureFields = {
	returnType: ReturnType;
	distributionFrequency: DistributionFrequency;
	targetReturnMultiple: string;
	maximumTermYears: string;
	terminationTrigger: string;
	targetIrrExpectation: string;
	targetAnnualYieldExpectation: string;
	structureType: string;
	investorAllocationPct: string;
	repaymentStructure: string;
	investmentTermYears: string;
	minimumTermYears: string;
	cashflowBasis: string;
	investorPriority: string;
	paymentTiming: string;
};

type ReturnOutputsFields = {
	projectedYieldPct: string;
	impliedIrrPct: string;
	impliedReturnMultiple: string;
	estimatedPaybackYears: string;
	totalDistributionsRequired: string;
	annualNetCashflow: string;
	estimatedPeriodicDistribution: string;
};

type RisksFields = {
	counterpartyCreditQuality: CreditQuality;
	dependsOnSolarGeneration: boolean;
	dependsOnSiteConsumption: boolean;
	marketExposurePresent: boolean;
	merchantExposurePresent: boolean;
	paymentDelayDays: string;
	constructionRiskLevel: RiskLevel;
	counterpartyRiskLevel: RiskLevel;
	marketRiskLevel: RiskLevel;
	technologyRiskLevel: RiskLevel;
	fixedPriceEpc: boolean;
	insuranceInPlace: boolean;
	hedgingStrategy: string;
	riskMitigants: string;
	counterpartyName: string;
	counterpartyType: string;
	counterpartyRole: string;
	contractStatus: string;
	siteSecured: boolean;
	riskGridConnectionStatus: string;
	permitsStatus: string;
	epcContractorStatus: string;
	operationalDependencies: string[];
	keyRiskFactors: string[];
	dataConfidence: string;
};

type UploadedProjectAsset = {
	id: string;
	category: string;
	purpose: string;
	documentKey?: string | null;
	storageKey: string;
	originalFilename: string;
	mimeType: string;
	fileSize?: number | null;
	uploadedBy?: number | null;
	uploadedAt: string;
	url?: string;
};

type DocumentItem = {
	url: string;
	status: DocumentStatus;
	fileId?: string;
	fileName?: string;
	mimeType?: string;
	storageKey?: string;
	uploadedAt?: string;
};

type DocumentsFields = {
	hostAgreement: DocumentItem;
	epcContract: DocumentItem;
	financialModel: DocumentItem;
	gridConnectionDocs: DocumentItem;
	siteAgreement: DocumentItem;
	technicalReport: DocumentItem;
	insuranceSummary: DocumentItem;
	legalDocs: DocumentItem;
	investmentMemo: DocumentItem;
};

type TokenStructureFields = {
	tokenStandard: string;
	dseType: DseType;
	tokenName: string;
	tokenSymbol: string;
	totalTokenSupply: string;
	pricePerToken: string;
	minimumInvestmentDerived: string;
	ownershipPerTokenPct: string;
	distributionMethod: TokenDistributionMethod;
	walletRequired: boolean;
	secondaryTradingEnabled: boolean;
	lockupPeriod: string;
	transferRestrictions: string;
	totalUnitsIssued: string;
	unitsAvailableToInvestors: string;
	unitsPerMinimum: string;
};

type RpaOutputFields = {
	riskFlags: string[];
};

type AgreementSection = {
	platformAgreementAccepted: boolean;
	developerDeclarationAccepted: boolean;
	offeringTermsAccepted: boolean;
	signatoryFullName: string;
	signatoryTitle: string;
	signatoryAuthority: string;
	signatoryDate: string;
};

type ProjectSetupForm = {
	projectName: string;
	projectType: ProjectType;
	dseType: DseType;
	stage: ProjectStage;
	jurisdiction: string;
	siteAddress: string;
	sponsorDeveloper: string;
	investmentSummary: string;
	thumbnailImageUrl: string;
	thumbnailAsset?: UploadedProjectAsset | null;
	siteControl: SiteControl;
	landRightsNotes: string;
	gridConnectionStatus: GridConnectionStatus;
	commissioningDate: string;
	uptimeAvailabilityPct: string;
	battery: BatteryAssetFields;
	solar: SolarAssetFields;
	hybrid: HybridAssetFields;
	revenueModel: RevenueModelFields;
	energyGridConfiguration: EnergyGridConfigurationFields;
	capitalStructure: CapitalStructureFields;
	cashflowAllocation: CashflowAllocationFields;
	useOfFunds: UseOfFunds;
	investorStructure: InvestorStructureFields;
	risks: RisksFields;
	documents: DocumentsFields;
	rpaOutput: RpaOutputFields;
	returnOutputs: ReturnOutputsFields;
	tokenStructure: TokenStructureFields;
	agreement: AgreementSection;
};

const workflowItems: WorkflowItem[] = [
	{
		key: 'projectBasics',
		title: 'Project Basics',
		description: 'Identity and routing logic for the rest of the workflow.',
	},
	{
		key: 'assetModule',
		title: 'Asset',
		description: 'Physical asset assumptions and delivery context.',
	},
	{
		key: 'capitalStructure',
		title: 'Capital',
		description: 'Use of funds, capex, and raise structure.',
	},
	{
		key: 'energyGridConfiguration',
		title: 'Energy & Grid Configuration',
		description: 'Energy system connection and market access.',
	},
	{
		key: 'revenueModel',
		title: 'Revenue',
		description: 'Income strategy, drivers, and market exposure.',
	},
	{
		key: 'cashflowAllocation',
		title: 'Cashflow Allocation',
		description: 'Cashflow splits, fees, and operating costs.',
	},
	{
		key: 'riskInputs',
		title: 'Risk Inputs',
		description: 'Objective underwriting facts only.',
	},
	{
		key: 'documents',
		title: 'Documents',
		description: 'Evidence that proves the deal is real.',
	},
	{
		key: 'investmentStructure',
		title: 'Investment Structure',
		description: 'How investors participate in cashflows.',
	},
	{
		key: 'tokenStructure',
		title: 'Capital Raising & Issuance',
		description: 'Capital raise, units, and issuance controls.',
	},
	{
		key: 'rpaReviewSubmit',
		title: 'Revenue Participation Agreement Review & Submit',
		description: 'Generated RPA summary and developer declaration.',
	},
];

const sectionHelpText: Record<WorkflowKey, string> = {
	projectBasics:
		'This section captures the basic project identity, including the project name, type, location, and ownership details. These inputs help RegenX understand what is being submitted and how the opportunity should be classified.',
	assetModule:
		'This section captures the technical profile of the asset, including capacity, battery configuration, operating assumptions, and delivery readiness. These inputs help support revenue modelling, risk review, and investor disclosure.',
	capitalStructure:
		'This section captures the expected cost base, funding requirement, and capital structure of the project. RegenX uses these inputs to assess whether the project can be structured into an investable opportunity.',
	energyGridConfiguration:
		'This section explains how the project connects to customers, the grid, or a host site. Behind-the-meter projects usually rely on a host-site energy arrangement, while front-of-the-meter projects usually rely on wholesale market, tolling, capacity, or offtake revenue structures.',
	revenueModel:
		'This section captures how the asset is expected to generate revenue. Modern battery and clean energy projects often combine multiple revenue streams, such as energy trading, FCAS, capacity payments, tolling, system support contracts, and government-backed schemes.',
	cashflowAllocation:
		'This section captures key financial assumptions, including expected revenue, operating costs, investor returns, and distribution logic. These inputs help RegenX assess whether the opportunity is commercially viable.',
	riskInputs:
		'This section captures the key risks, dependencies, and delivery constraints that may affect the project. Clear risk disclosure helps RegenX assess project quality, investor suitability, and whether further review is required before approval.',
	documents:
		'This section captures the legal, regulatory, and project documentation required to support review. RegenX uses these documents to assess project readiness, investor disclosure requirements, and whether the opportunity can progress toward structuring.',
	investmentStructure:
		'This section defines how investors participate in project cashflows, including allocation, repayment structure, distribution frequency, and return type. RegenX uses these settings to assess whether the investor offer is commercially clear and suitable for structuring.',
	tokenStructure:
		'This section converts the approved capital raise into investor units and issuance settings. RegenX uses these inputs to support ownership records, distribution administration, transfer rules, and investor-facing offer controls.',
	rpaReviewSubmit:
		'This section gives the developer a final review before submission. RegenX uses the completed information to assess readiness, prepare internal review, and determine whether the project can move toward approval, structuring, and issuance.',
};

const defaultForm: ProjectSetupForm = {
	projectName: '',
	projectType: 'Battery BESS',
	dseType: 'Operating DSE',
	stage: 'Development',
	jurisdiction: 'Australia',
	siteAddress: '',
	sponsorDeveloper: '',
	investmentSummary: '',
	thumbnailImageUrl: '',
	thumbnailAsset: null,
	siteControl: 'Owned',
	landRightsNotes: '',
	gridConnectionStatus: 'Not started',
	commissioningDate: '',
	uptimeAvailabilityPct: '',
	battery: {
		powerCapacityMw: '',
		energyCapacityMwh: '',
		durationHours: '',
		cyclesPerDay: '',
		expectedAnnualThroughputMwh: '',
		batteryManufacturer: '',
		batteryModel: '',
		augmentationPlan: '',
		replacementScheduleYears: '',
		fireEmergencyControls: 'To be confirmed',
	},
	solar: {
		dcCapacityMw: '',
		acCapacityMw: '',
		expectedAnnualGenerationMwh: '',
		capacityFactorPct: '',
		panelManufacturer: '',
		panelType: '',
		inverterManufacturer: '',
		inverterType: '',
		mountingSystem: '',
		irradianceYieldAssumptions: '',
		curtailmentAssumptionPct: '',
	},
	hybrid: {
		coLocated: false,
		sharedGridConnection: false,
		dispatchStrategy: '',
		sharedInfrastructureNotes: '',
	},
	revenueModel: {
		recommendedStructure: 'Hybrid',
		recommendedReason: '',
		overrideRecommendedStructure: false,
		overrideReasonText: '',
		selectedStructure: 'Hybrid',
		revenueSources: [],
		hostSiteName: '',
		counterpartyType: 'N/A',
		industry: '',
		creditQuality: 'Unknown',
		primaryCounterparty: '',
		agreementType: '',
		contractLengthYears: '',
		extensionOption: '',
		earlyTerminationNotes: '',
		baselineMethod: '',
		escalationPct: '',
		revenueModelType: '',
		estimatedAnnualSavings: '',
		spvSharePct: '',
		hostSharePct: '',
		minimumPaymentFloor: '',
		merchantEnabled: false,
		expectedAnnualMerchantRevenue: '',
		aggregatorName: '',
		aggregatorFeePct: '',
		merchantRevenueStreams: [],
		contractedAllocationPct: '',
		merchantAllocationPct: '',
		paymentFrequency: 'Quarterly',
		paymentDelayDays: '',
		revenueAllocationPriority: '',
		revenueStrategy: 'hybrid',
		revenueDrivers: [],
		marketRevenuePct: '',
		contractedRevenuePct: '',
		marketParticipation: 'hybrid_participation',
		optimisationResponsibility: 'external_optimiser_aggregator',
		revenueRiskManagement: [],
		marketExposure: 'medium',
		marketGridDrivers: [],
	},
	energyGridConfiguration: {
		gridPosition: 'behind_the_meter',
		electricitySupplyArrangement: 'unknown',
		tariffStructure: [],
		onsiteGenerationType: 'none',
		demandChargesStatus: 'unknown',
		marketAccess: 'planned',
	},
	capitalStructure: {
		totalProjectCapex: '',
		fundingGoal: '',
		investorAllocation: '',
		investorOwnershipPct: '100',
		minimumInvestment: '',
		fundingTranches: 'single_raise',
		fundingDrawdownStages: '',
	},
	cashflowAllocation: {
		spvPct: '',
		hostPct: '',
		operatorAggregatorPct: '',
		platformFeePct: '',
		operatorFeePct: '',
		otherFeePct: '',
		annualOpex: '',
		maintenanceCosts: '',
	},
	useOfFunds: {
		equipmentCost: '',
		installationCost: '',
		gridConnectionCost: '',
		developmentCosts: '',
		contingency: '',
		regenxFees: '',
	},
	investorStructure: {
		returnType: 'yield_income',
		distributionFrequency: 'Quarterly',
		targetReturnMultiple: '',
		maximumTermYears: '',
		terminationTrigger: '',
		targetIrrExpectation: '',
		targetAnnualYieldExpectation: '',
		structureType: 'revenue_participation_agreement',
		investorAllocationPct: '100',
		repaymentStructure: 'target_multiple',
		investmentTermYears: '',
		minimumTermYears: '',
		cashflowBasis: 'share_net_cashflow',
		investorPriority: 'preferred_distribution',
		paymentTiming: 'days_30',
	},
	risks: {
		counterpartyCreditQuality: 'Unknown',
		dependsOnSolarGeneration: false,
		dependsOnSiteConsumption: false,
		marketExposurePresent: false,
		merchantExposurePresent: false,
		paymentDelayDays: '',
		constructionRiskLevel: 'Medium',
		counterpartyRiskLevel: 'Medium',
		marketRiskLevel: 'Medium',
		technologyRiskLevel: 'Medium',
		fixedPriceEpc: false,
		insuranceInPlace: false,
		hedgingStrategy: '',
		riskMitigants: '',
		counterpartyName: '',
		counterpartyType: 'none_merchant_exposure',
		counterpartyRole: 'none',
		contractStatus: 'none',
		siteSecured: false,
		riskGridConnectionStatus: 'not_started',
		permitsStatus: 'not_started',
		epcContractorStatus: 'not_engaged',
		operationalDependencies: [],
		keyRiskFactors: [],
		dataConfidence: 'early_stage_assumptions',
	},
	documents: {
		hostAgreement: { url: '', status: 'Pending' },
		epcContract: { url: '', status: 'Pending' },
		financialModel: { url: '', status: 'Pending' },
		gridConnectionDocs: { url: '', status: 'Pending' },
		siteAgreement: { url: '', status: 'Pending' },
		technicalReport: { url: '', status: 'Pending' },
		insuranceSummary: { url: '', status: 'Pending' },
		legalDocs: { url: '', status: 'Pending' },
		investmentMemo: { url: '', status: 'Pending' },
	},
	rpaOutput: {
		riskFlags: [],
	},
	returnOutputs: {
		projectedYieldPct: '',
		impliedIrrPct: '',
		impliedReturnMultiple: '',
		estimatedPaybackYears: '',
		totalDistributionsRequired: '',
		annualNetCashflow: '',
		estimatedPeriodicDistribution: '',
	},
	tokenStructure: {
		tokenStandard: 'Stellar asset',
		dseType: 'Development DSE',
		tokenName: '',
		tokenSymbol: '',
		totalTokenSupply: '',
		pricePerToken: '1.00',
		minimumInvestmentDerived: '',
		ownershipPerTokenPct: '',
		distributionMethod: 'On-chain payout',
		walletRequired: true,
		secondaryTradingEnabled: false,
		lockupPeriod: '',
		transferRestrictions: '',
		totalUnitsIssued: '',
		unitsAvailableToInvestors: '',
		unitsPerMinimum: '',
	},
	agreement: {
		platformAgreementAccepted: false,
		developerDeclarationAccepted: false,
		offeringTermsAccepted: false,
		signatoryFullName: '',
		signatoryTitle: '',
		signatoryAuthority: '',
		signatoryDate: '',
	},
};

const textareaClass =
	'w-full min-h-[160px] rounded-2xl border border-[#D6DCE5] bg-white px-4 py-3.5 text-sm leading-[1.65] outline-none focus:border-[#1D4ED8] text-[#0F6A99]';

const toNumber = (value: string | number | null | undefined) => {
	const cleaned = String(value ?? '')
		.replace(/,/g, '')
		.trim();
	if (!cleaned) return 0;
	const num = Number(cleaned);
	return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (value: number) =>
	value.toLocaleString('en-AU', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

const calculateRegenxFees = (base: number) => Math.round(base * 0.03);

const getRecommendedStructure = (
	projectType: ProjectType,
): { structure: RevenueStructure; reason: string } => {
	switch (projectType) {
		case 'Solar':
			return {
				structure: 'ESA',
				reason:
					'Solar projects are best anchored by site savings and contracted host-site economics.',
			};
		case 'Battery BESS':
			return {
				structure: 'Hybrid',
				reason:
					'Battery systems often need a stable contracted base layer plus merchant upside.',
			};
		case 'Hybrid':
		default:
			return {
				structure: 'Hybrid',
				reason:
					'Integrated solar and battery assets usually combine contracted value with controlled upside.',
			};
	}
};

const mergeForm = (
	payload: Partial<ProjectSetupForm> | null | undefined,
): ProjectSetupForm => ({
	...defaultForm,
	...(payload ?? {}),
	battery: {
		...defaultForm.battery,
		...(payload?.battery ?? {}),
	},
	solar: {
		...defaultForm.solar,
		...(payload?.solar ?? {}),
	},
	hybrid: {
		...defaultForm.hybrid,
		...(payload?.hybrid ?? {}),
	},
	revenueModel: {
		...defaultForm.revenueModel,
		...(payload?.revenueModel ?? {}),
	},
	energyGridConfiguration: {
		...defaultForm.energyGridConfiguration,
		...(payload?.energyGridConfiguration ?? {}),
	},
	capitalStructure: {
		...defaultForm.capitalStructure,
		...(payload?.capitalStructure ?? {}),
	},
	cashflowAllocation: {
		...defaultForm.cashflowAllocation,
		...(payload?.cashflowAllocation ?? {}),
	},
	useOfFunds: {
		...defaultForm.useOfFunds,
		...(payload?.useOfFunds ?? {}),
	},
	investorStructure: {
		...defaultForm.investorStructure,
		...(payload?.investorStructure ?? {}),
	},
	risks: {
		...defaultForm.risks,
		...(payload?.risks ?? {}),
	},
	documents: {
		...defaultForm.documents,
		...(payload?.documents ?? {}),
		hostAgreement: {
			...defaultForm.documents.hostAgreement,
			...(payload?.documents?.hostAgreement ?? {}),
		},
		epcContract: {
			...defaultForm.documents.epcContract,
			...(payload?.documents?.epcContract ?? {}),
		},
		financialModel: {
			...defaultForm.documents.financialModel,
			...(payload?.documents?.financialModel ?? {}),
		},
		gridConnectionDocs: {
			...defaultForm.documents.gridConnectionDocs,
			...(payload?.documents?.gridConnectionDocs ?? {}),
		},
		siteAgreement: {
			...defaultForm.documents.siteAgreement,
			...(payload?.documents?.siteAgreement ?? {}),
		},
		technicalReport: {
			...defaultForm.documents.technicalReport,
			...(payload?.documents?.technicalReport ?? {}),
		},
		insuranceSummary: {
			...defaultForm.documents.insuranceSummary,
			...(payload?.documents?.insuranceSummary ?? {}),
		},
		legalDocs: {
			...defaultForm.documents.legalDocs,
			...(payload?.documents?.legalDocs ?? {}),
		},
		investmentMemo: {
			...defaultForm.documents.investmentMemo,
			...(payload?.documents?.investmentMemo ?? {}),
		},
	},
	tokenStructure: {
		...defaultForm.tokenStructure,
		...(payload?.tokenStructure ?? {}),
	},
	returnOutputs: {
		...defaultForm.returnOutputs,
		...(payload?.returnOutputs ?? {}),
	},
	agreement: {
		...defaultForm.agreement,
		...(payload?.agreement ?? {}),
	},
});

const asRecord = (value: unknown): Record<string, any> | null => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	return value as Record<string, any>;
};

const hasMeaningfulProjectPayload = (
	value: unknown,
): value is Record<string, any> => {
	const record = asRecord(value);
	if (!record) return false;

	return Object.values(record).some((entry) => {
		if (entry == null) return false;
		if (typeof entry === 'string') return entry.trim() !== '';
		if (typeof entry === 'number') return !Number.isNaN(entry);
		if (typeof entry === 'boolean') return true;
		if (Array.isArray(entry)) return entry.length > 0;
		if (typeof entry === 'object') return Object.keys(entry).length > 0;
		return false;
	});
};

const buildProjectFallbackForm = (
	project: Record<string, any> | null | undefined,
): Partial<ProjectSetupForm> => {
	if (!project) return {};

	return {
		projectName: String(project.projectName ?? project.name ?? ''),
		projectType: (project.projectType ??
			defaultForm.projectType) as ProjectType,
		dseType: (project.dseType ?? defaultForm.dseType) as DseType,
		stage: (project.stage ?? defaultForm.stage) as ProjectStage,
		jurisdiction: String(
			project.jurisdiction ?? defaultForm.jurisdiction ?? '',
		),
		siteAddress: String(
			project.siteAddress ?? project.fullAddress ?? project.location ?? '',
		),
		investmentSummary: String(
			project.investmentSummary ?? project.description ?? '',
		),
		thumbnailImageUrl: String(
			project.thumbnailImageUrl ?? project.thumbnailUrl ?? '',
		),
		thumbnailAsset: asRecord(
			project.thumbnailFile,
		) as UploadedProjectAsset | null,
		commissioningDate: String(project.commissioningDate ?? ''),
		capitalStructure: {
			...defaultForm.capitalStructure,
			minimumInvestment: String(project.minimumInvestment ?? ''),
			totalProjectCapex: String(project.totalProjectCapex ?? ''),
			fundingGoal: String(project.fundingGoal ?? ''),
		},
		investorStructure: {
			...defaultForm.investorStructure,
			targetIrrExpectation: String(project.targetIrr ?? ''),
			targetAnnualYieldExpectation: String(project.targetAnnualYield ?? ''),
			maximumTermYears: String(project.investmentTermYears ?? ''),
		},
		tokenStructure: {
			...defaultForm.tokenStructure,
			tokenName: String(project.tokenName ?? ''),
			tokenSymbol: String(project.tokenSymbol ?? ''),
			totalTokenSupply: String(project.tokenSupply ?? ''),
		},
	};
};

const extractProjectSetupPayload = (
	project: Record<string, any> | null | undefined,
): Partial<ProjectSetupForm> | null => {
	if (!project) return null;

	const preferredPayloads = [
		project.draftPayload,
		project.draft_payload,
		project.payloadJson,
		project.payload_json,
	];

	for (const candidate of preferredPayloads) {
		if (hasMeaningfulProjectPayload(candidate)) {
			return candidate as Partial<ProjectSetupForm>;
		}
	}

	const fallback = buildProjectFallbackForm(project);
	return hasMeaningfulProjectPayload(fallback) ? fallback : null;
};

const getFieldCompletion = (values: unknown[]) => {
	const filled = values.filter((value) => {
		if (typeof value === 'boolean') return value;
		if (Array.isArray(value)) return value.length > 0;
		return String(value ?? '').trim() !== '';
	}).length;

	if (filled === 0) return 'Not Started' as WorkflowStatus;
	if (filled === values.length) return 'Completed' as WorkflowStatus;
	return 'In Progress' as WorkflowStatus;
};

const isValidHttpsUrl = (value: string) =>
	!value.trim() || /^https:\/\/.+/i.test(value.trim());
const isValidDate = (value: string) =>
	!value.trim() || !Number.isNaN(Date.parse(value));
const isValidNumeric = (value: string) =>
	!value.trim() || !Number.isNaN(Number(value));
const isValidPercent = (value: string) =>
	!value.trim() || (Number(value) >= 0 && Number(value) <= 100);

const generateTokenSymbolExample = (projectType: string) => {
	const normalized = String(projectType || '').toLowerCase();
	if (normalized.includes('hybrid')) return 'BAS01';
	if (normalized.includes('battery')) return 'BAT01';
	if (normalized.includes('solar')) return 'SOL01';
	if (normalized.includes('wind')) return 'WND01';
	if (normalized.includes('hydrogen')) return 'HYD01';
	return 'OTH01';
};

const getSuggestedMinimumInvestment = (
	projectType: string,
	gridPosition: string,
	totalProjectCapex: number,
) => {
	const normalizedType = String(projectType || '').toLowerCase();
	const normalizedGrid = String(gridPosition || '').toLowerCase();
	const isSmallBtm =
		normalizedGrid === 'behind_the_meter' && totalProjectCapex <= 1000000;

	if (isSmallBtm) return '100';
	if (normalizedType.includes('hybrid') || totalProjectCapex > 5000000)
		return '10000';
	return '1000';
};

function SectionHeader({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<>
			<h2 className="text-[30px] font-semibold tracking-[-0.02em] text-[#163F74] md:text-[34px]">
				{title}
			</h2>
			<p className="mt-2 max-w-[760px] text-sm leading-[1.7] text-[#6B7280] md:text-[15px]">
				{description}
			</p>
		</>
	);
}

function SectionHelpCard({ children }: { children: ReactNode }) {
	return (
		<div className="mt-6 rounded-2xl border border-[#E7ECF4] bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.03)]">
			<h3 className="text-[16px] font-semibold text-[#163F74]">
				What this section means
			</h3>
			<p className="mt-2 text-sm leading-6 text-[#5F6C86]">{children}</p>
		</div>
	);
}

function Field({
	label,
	children,
	hint,
}: {
	label: string;
	children: ReactNode;
	hint?: string;
}) {
	return (
		<div>
			<label className="mb-2.5 block text-[13px] font-semibold text-[#475467]">
				{label}
			</label>
			{children}
			{hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
		</div>
	);
}

const selectOptions = {
	gridPosition: [
		['behind_the_meter', 'Behind-the-meter'],
		['embedded_network', 'Embedded network'],
		['front_of_meter', 'Front-of-the-meter'],
	],
	electricitySupplyArrangement: [
		['standard_retail_contract', 'Yes - standard retail contract'],
		['negotiated_commercial_contract', 'Yes - negotiated commercial contract'],
		['no_agreement', 'No'],
		['unknown', 'Unknown'],
	],
	tariffStructure: [
		['flat_rate', 'Flat rate'],
		['time_of_use', 'Time-of-use pricing'],
		['demand_charges', 'Demand charges'],
		['dynamic_spot_linked', 'Dynamic / spot-linked pricing'],
	],
	onsiteGenerationType: [
		['solar', 'Yes - solar'],
		['other', 'Yes - other'],
		['none', 'No'],
	],
	demandChargesStatus: [
		['yes', 'Yes'],
		['no', 'No'],
		['unknown', 'Unknown'],
	],
	marketAccess: [
		['aggregator_vpp', 'Yes - via aggregator / VPP'],
		['direct_participation', 'Yes - direct participation'],
		['no', 'No'],
		['planned', 'Planned'],
	],
	revenueStrategy: [
		['primarily_contracted', 'Primarily contracted'],
		['primarily_merchant', 'Primarily merchant'],
		['hybrid', 'Hybrid (recommended)'],
	],
	revenueDrivers: [
		['energy_arbitrage', 'Energy arbitrage'],
		['fcas', 'Frequency control services (FCAS)'],
		['capacity_availability_payments', 'Capacity / availability payments'],
		['network_system_support_contracts', 'Network / system support contracts'],
		['government_backed_schemes', 'Government-backed schemes (CIS / LTESA)'],
	],
	marketParticipation: [
		['full_merchant', 'Yes - full merchant participation'],
		['hybrid_participation', 'Yes - hybrid participation'],
		['fully_contracted', 'No - fully contracted'],
	],
	optimisationResponsibility: [
		['internal_operator', 'Internal operator'],
		['external_optimiser_aggregator', 'External optimiser / aggregator'],
	],
	revenueRiskManagement: [
		['physical_tolling', 'Physical tolling agreement'],
		['virtual_toll_structured_offtake', 'Virtual toll / structured offtake'],
		['revenue_share_swap', 'Revenue share / swap agreement'],
		['floor_price', 'Floor price agreement'],
		['government_support', 'Government support (CIS / LTESA)'],
		['none', 'None'],
	],
	marketExposure: [
		['high', 'High'],
		['medium', 'Medium'],
		['low', 'Low'],
	],
	marketGridDrivers: [
		['wholesale_price_volatility', 'Wholesale price volatility'],
		['grid_congestion_constraints', 'Grid congestion / constraints'],
		['renewable_energy_penetration', 'Renewable energy penetration'],
		['extreme_events', 'Extreme events'],
	],
	counterpartyType: [
		['energy_retailer', 'Energy retailer'],
		['corporate_offtaker', 'Corporate offtaker'],
		['government_utility', 'Government / utility'],
		['aggregator', 'Aggregator'],
		['host_site', 'Host site'],
		['none_merchant_exposure', 'None - merchant exposure'],
	],
	counterpartyRole: [
		['offtaker', 'Offtaker'],
		['host', 'Host'],
		['aggregator', 'Aggregator'],
		['none', 'None'],
	],
	contractStatus: [
		['signed', 'Signed'],
		['term_sheet_loi', 'Term sheet / LOI'],
		['in_negotiation', 'In negotiation'],
		['none', 'None'],
	],
	developmentStatus: [
		['not_started', 'Not started'],
		['in_progress', 'In progress'],
		['approved', 'Approved'],
	],
	epcContractorStatus: [
		['engaged', 'Engaged'],
		['not_engaged', 'Not engaged'],
	],
	operationalDependencies: [
		['requires_aggregator', 'Requires aggregator'],
		['requires_market_participation', 'Requires market participation'],
		['relies_on_single_counterparty', 'Relies on single counterparty'],
	],
	keyRiskFactors: [
		['market_volatility', 'Market volatility'],
		['regulatory_dependency', 'Regulatory dependency'],
		['counterparty_dependency', 'Counterparty dependency'],
		['technology_performance', 'Technology performance'],
		['construction_execution', 'Construction execution'],
	],
	dataConfidence: [
		['signed_agreements', 'Based on signed agreements'],
		['detailed_modelling', 'Based on detailed modelling'],
		['early_stage_assumptions', 'Early-stage assumptions'],
	],
	structureType: [
		['revenue_participation_agreement', 'Revenue Participation Agreement'],
		['energy_services_agreement', 'Energy Services Agreement'],
		['hybrid', 'Hybrid'],
	],
	repaymentStructure: [
		['fixed_term', 'Fixed Term'],
		['target_multiple', 'Target Multiple'],
		['hybrid', 'Hybrid'],
	],
	returnType: [
		['yield_income', 'Yield - income-focused'],
		['growth_capital_income', 'Growth - capital + income'],
	],
	cashflowBasis: [
		['share_total_project_revenue', 'Share of total project revenue'],
		['share_net_cashflow', 'Share of net cashflow'],
		['share_energy_savings', 'Share of energy savings'],
	],
	investorPriority: [
		['preferred_distribution', 'Preferred distribution'],
		['pro_rata', 'Pro-rata'],
	],
	paymentTiming: [
		['immediate', 'Immediate'],
		['days_30', '30 days'],
		['days_60', '60 days'],
	],
	fundingStructure: [
		['single_raise', 'Single raise (100% upfront)'],
		['staged_funding', 'Staged funding (multiple drawdowns)'],
		['milestone_based', 'Milestone-based funding'],
	],
} as const;

type MultiSelectOption = readonly [string, string];
type MultiSelectGroup = {
	title: string;
	description: string;
	options: readonly MultiSelectOption[];
};

const groupedMultiSelects = {
	tariffStructure: [
		{
			title: 'Tariff Structure',
			description: 'Select all electricity pricing features that apply.',
			options: selectOptions.tariffStructure,
		},
	],
	revenueDrivers: [
		{
			title: 'Market revenue',
			description: 'Income linked to energy market activity.',
			options: [
				['energy_arbitrage', 'Energy arbitrage'],
				['fcas', 'Frequency control services (FCAS)'],
			],
		},
		{
			title: 'Contracted revenue',
			description: 'Income supported by contracts or fixed arrangements.',
			options: [
				['capacity_availability_payments', 'Capacity / availability payments'],
				[
					'network_system_support_contracts',
					'Network / system support contracts',
				],
				[
					'government_backed_schemes',
					'Government-backed schemes (CIS / LTESA)',
				],
			],
		},
	],
	revenueRiskManagement: [
		{
			title: 'Contract structures',
			description: 'Arrangements that transfer or stabilise market risk.',
			options: [
				['physical_tolling', 'Physical tolling agreement'],
				[
					'virtual_toll_structured_offtake',
					'Virtual toll / structured offtake',
				],
				['revenue_share_swap', 'Revenue share / swap agreement'],
			],
		},
		{
			title: 'Downside protection',
			description: 'Mechanisms that reduce revenue downside.',
			options: [
				['floor_price', 'Floor price agreement'],
				['government_support', 'Government support (CIS / LTESA)'],
				['none', 'None'],
			],
		},
	],
	marketGridDrivers: [
		{
			title: 'Market conditions',
			description: 'External factors that can influence revenue performance.',
			options: [
				['wholesale_price_volatility', 'Wholesale price volatility'],
				['extreme_events', 'Extreme events'],
			],
		},
		{
			title: 'Grid and system factors',
			description:
				'Network and renewable system conditions affecting performance.',
			options: [
				['grid_congestion_constraints', 'Grid congestion / constraints'],
				['renewable_energy_penetration', 'Renewable energy penetration'],
			],
		},
	],
	operationalDependencies: [
		{
			title: 'Operational Dependencies',
			description:
				'These are factors the project relies on to operate or generate revenue.',
			options: selectOptions.operationalDependencies,
		},
	],
	keyRiskFactors: [
		{
			title: 'Key Risk Factors',
			description:
				'Select the main factors that could impact project performance.',
			options: selectOptions.keyRiskFactors,
		},
	],
} as const satisfies Record<string, readonly MultiSelectGroup[]>;

type ProjectSetupProps = {
	forcedProjectId?: string | null;
	forceReadOnly?: boolean;
	embedded?: boolean;
	showLifecycleStatus?: boolean;
};

function SectionCard({
	children,
	className = '',
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 xl:p-10 ${className}`}
		>
			{children}
		</div>
	);
}

export default function ProjectSetup({
	forcedProjectId = null,
	forceReadOnly = false,
	embedded = false,
	showLifecycleStatus = true,
}: ProjectSetupProps = {}) {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const mode = searchParams.get('mode');
	const queryProjectId = searchParams.get('projectId');
	const projectId = forcedProjectId ?? queryProjectId;
	const isReadOnly = forceReadOnly || mode === 'readonly';

	const [activeKey, setActiveKey] = useState<WorkflowKey>('projectBasics');
	const [form, setForm] = useState<ProjectSetupForm>(() => {
		const rec = getRecommendedStructure(defaultForm.projectType);
		return {
			...defaultForm,
			revenueModel: {
				...defaultForm.revenueModel,
				recommendedStructure: rec.structure,
				recommendedReason: rec.reason,
				selectedStructure: rec.structure,
			},
		};
	});
	const [backendProjectId, setBackendProjectId] = useState<string | null>(
		projectId && !Number.isNaN(Number(projectId)) ? String(projectId) : null,
	);
	const [projectMeta, setProjectMeta] = useState<Partial<IProject> | null>(
		null,
	);
	const [isHydrated, setIsHydrated] = useState(false);
	const [isSavingDraft, setIsSavingDraft] = useState(false);
	const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
	const [uploadingDocumentKey, setUploadingDocumentKey] = useState<
		keyof DocumentsFields | null
	>(null);
	const [saveMessage, setSaveMessage] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState('');
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [rpaSummary, setRpaSummary] = useState<RpaSummary | null>(null);
	const [isLoadingRpaSummary, setIsLoadingRpaSummary] = useState(false);
	const [rpaSummaryError, setRpaSummaryError] = useState('');
	const [isRpaModalOpen, setIsRpaModalOpen] = useState(false);
	const [tokenSymbolManuallyEdited, setTokenSymbolManuallyEdited] =
		useState(false);
	const [capexManuallyOverridden, setCapexManuallyOverridden] = useState(false);
	const [minimumInvestmentManuallyEdited, setMinimumInvestmentManuallyEdited] =
		useState(false);

	const isBattery = form.projectType === 'Battery BESS';
	const isSolar = form.projectType === 'Solar';
	const isHybrid = form.projectType === 'Hybrid';

	useEffect(() => {
		if (tokenSymbolManuallyEdited || form.tokenStructure.tokenSymbol.trim()) {
			return;
		}

		const generated = generateTokenSymbolExample(form.projectType);
		setForm((prev) => ({
			...prev,
			tokenStructure: {
				...prev.tokenStructure,
				tokenSymbol: generated,
			},
		}));
	}, [
		form.projectType,
		form.tokenStructure.tokenSymbol,
		tokenSymbolManuallyEdited,
	]);

	const inputClass = (field: string) =>
		`w-full rounded-2xl border px-4 py-3.5 text-sm outline-none ${
			errors[field]
				? 'border-red-500 bg-red-50'
				: 'bg-white border-[#D6DCE5] text-[#0F6A99] focus:border-[#1D4ED8]'
		}`;

	const useOfFundsBaseValue = useMemo(() => {
		return (
			toNumber(form.useOfFunds.equipmentCost) +
			toNumber(form.useOfFunds.installationCost) +
			toNumber(form.useOfFunds.gridConnectionCost) +
			toNumber(form.useOfFunds.developmentCosts) +
			toNumber(form.useOfFunds.contingency)
		);
	}, [form.useOfFunds]);

	const allCapexBreakdownFieldsFilled = useMemo(
		() =>
			[
				form.useOfFunds.equipmentCost,
				form.useOfFunds.installationCost,
				form.useOfFunds.gridConnectionCost,
				form.useOfFunds.developmentCosts,
				form.useOfFunds.contingency,
			].every((value) => String(value ?? '').trim() !== ''),
		[form.useOfFunds],
	);
	const manualTotalProjectCapex = toNumber(
		form.capitalStructure.totalProjectCapex,
	);
	const totalProjectCapexValue =
		manualTotalProjectCapex > 0 ? manualTotalProjectCapex : useOfFundsBaseValue;
	const regenxFeeValue = useMemo(
		() => calculateRegenxFees(totalProjectCapexValue),
		[totalProjectCapexValue],
	);
	const totalCapitalRaiseValue = useMemo(
		() => totalProjectCapexValue + regenxFeeValue,
		[totalProjectCapexValue, regenxFeeValue],
	);

	useEffect(() => {
		if (!allCapexBreakdownFieldsFilled || capexManuallyOverridden) return;

		const autoTotal = String(useOfFundsBaseValue);
		if (form.capitalStructure.totalProjectCapex === autoTotal) return;

		setForm((prev) => ({
			...prev,
			capitalStructure: {
				...prev.capitalStructure,
				totalProjectCapex: autoTotal,
			},
		}));
	}, [
		allCapexBreakdownFieldsFilled,
		capexManuallyOverridden,
		form.capitalStructure.totalProjectCapex,
		useOfFundsBaseValue,
	]);

	useEffect(() => {
		const allowedFundingStructures = selectOptions.fundingStructure.map(
			([value]) => value,
		);
		if (
			allowedFundingStructures.includes(
				form.capitalStructure.fundingTranches as any,
			)
		) {
			return;
		}

		setForm((prev) => ({
			...prev,
			capitalStructure: {
				...prev.capitalStructure,
				fundingTranches: 'single_raise',
			},
		}));
	}, [form.capitalStructure.fundingTranches]);

	useEffect(() => {
		if (minimumInvestmentManuallyEdited || totalProjectCapexValue <= 0) return;

		const suggestedMinimum = getSuggestedMinimumInvestment(
			form.projectType,
			form.energyGridConfiguration.gridPosition,
			totalProjectCapexValue,
		);
		if (form.capitalStructure.minimumInvestment === suggestedMinimum) return;

		setForm((prev) => ({
			...prev,
			capitalStructure: {
				...prev.capitalStructure,
				minimumInvestment: suggestedMinimum,
			},
		}));
	}, [
		form.capitalStructure.minimumInvestment,
		form.energyGridConfiguration.gridPosition,
		form.projectType,
		minimumInvestmentManuallyEdited,
		totalProjectCapexValue,
	]);

	const impliedMinimumInvestment =
		form.capitalStructure.minimumInvestment || '';
	const tokenPriceValue = toNumber(form.tokenStructure.pricePerToken);
	const minimumInvestmentValue = toNumber(impliedMinimumInvestment);
	const derivedTokenCount =
		tokenPriceValue > 0
			? Math.floor(minimumInvestmentValue / tokenPriceValue)
			: 0;

	const revenueSourcesDisplay = useMemo(
		() => form.revenueModel.revenueSources.join(', '),
		[form.revenueModel.revenueSources],
	);

	const loadRpaSummary = async (id: string | number) => {
		try {
			setIsLoadingRpaSummary(true);
			setRpaSummaryError('');
			const response = await projectService.getRpaSummary(id);
			setRpaSummary((response?.data ?? response) as RpaSummary);
		} catch (error: any) {
			console.error('Failed to load RPA summary', error);
			setRpaSummaryError(
				error?.response?.data?.message ||
					error?.message ||
					'Unable to generate the RPA summary from backend project data.',
			);
		} finally {
			setIsLoadingRpaSummary(false);
		}
	};

	const rpaComputed = useMemo(() => {
		const contractedRevenueAmount =
			toNumber(form.revenueModel.estimatedAnnualSavings) *
			(toNumber(form.revenueModel.spvSharePct) / 100);
		const merchantRevenueAmount = form.revenueModel.merchantEnabled
			? toNumber(form.revenueModel.expectedAnnualMerchantRevenue)
			: 0;
		const grossAnnualRevenueToSpv =
			contractedRevenueAmount + merchantRevenueAmount;
		const aggregatorFeeAmount =
			merchantRevenueAmount *
			(toNumber(form.revenueModel.aggregatorFeePct) / 100);
		const netAnnualCashflowToSpv = Math.max(
			0,
			grossAnnualRevenueToSpv - aggregatorFeeAmount,
		);
		const monthlyDistribution = netAnnualCashflowToSpv / 12;

		const riskFlags: string[] = [];
		if (!toNumber(form.revenueModel.minimumPaymentFloor))
			riskFlags.push('No minimum payment floor');
		if (toNumber(form.revenueModel.merchantAllocationPct) > 35)
			riskFlags.push('Merchant revenue exceeds threshold');
		const allocationTotal =
			toNumber(form.revenueModel.contractedAllocationPct) +
			toNumber(form.revenueModel.merchantAllocationPct);
		if (allocationTotal > 0 && allocationTotal !== 100)
			riskFlags.push('Allocation percentages do not total 100');
		if (
			form.revenueModel.creditQuality === 'Weak' ||
			form.risks.counterpartyCreditQuality === 'Weak'
		) {
			riskFlags.push('Low credit quality');
		}
		if (toNumber(form.revenueModel.spvSharePct) > 80)
			riskFlags.push('High SPV share may reduce host-site acceptability');
		if (
			form.investorStructure.returnType === 'Multiple' &&
			toNumber(form.investorStructure.targetReturnMultiple) > 3 &&
			toNumber(form.investorStructure.maximumTermYears) > 0
		) {
			riskFlags.push('Target return may not be achieved within max term');
		}

		return {
			contractedRevenueAmount,
			merchantRevenueAmount,
			grossAnnualRevenueToSpv,
			netAnnualCashflowToSpv,
			monthlyDistribution,
			riskFlags,
		};
	}, [form]);

	const issuanceComputed = useMemo(() => {
		const pricePerUnit = toNumber(form.tokenStructure.pricePerToken) || 1;
		const totalUnitsIssued =
			pricePerUnit > 0 ? totalCapitalRaiseValue / pricePerUnit : 0;
		const investorAllocationPct = toNumber(
			form.investorStructure.investorAllocationPct || 100,
		);
		const unitsAvailableToInvestors =
			totalUnitsIssued * (investorAllocationPct / 100);
		const unitsPerMinimum =
			pricePerUnit > 0 ? minimumInvestmentValue / pricePerUnit : 0;

		return {
			pricePerUnit,
			totalUnitsIssued,
			unitsAvailableToInvestors,
			unitsPerMinimum,
		};
	}, [
		form.investorStructure.investorAllocationPct,
		form.tokenStructure.pricePerToken,
		minimumInvestmentValue,
		totalCapitalRaiseValue,
	]);

	const returnComputed = useMemo(() => {
		const grossAnnualRevenue =
			toNumber(form.revenueModel.estimatedAnnualSavings) +
			toNumber(form.revenueModel.expectedAnnualMerchantRevenue);
		const feePct =
			toNumber(form.cashflowAllocation.platformFeePct) +
			toNumber(form.cashflowAllocation.operatorFeePct) +
			toNumber(form.cashflowAllocation.otherFeePct);
		const netProjectCashflow =
			grossAnnualRevenue -
			toNumber(form.cashflowAllocation.annualOpex) -
			toNumber(form.cashflowAllocation.maintenanceCosts) -
			grossAnnualRevenue * (feePct / 100);
		const netSpvCashflow =
			netProjectCashflow *
			(toNumber(form.cashflowAllocation.spvPct || 100) / 100);
		const investorAnnualCashflow =
			netSpvCashflow *
			(toNumber(form.investorStructure.investorAllocationPct || 100) / 100);
		const projectedYieldPct =
			totalCapitalRaiseValue > 0
				? (investorAnnualCashflow / totalCapitalRaiseValue) * 100
				: 0;
		const termYears = toNumber(form.investorStructure.investmentTermYears);
		const targetMultiple = toNumber(
			form.investorStructure.targetReturnMultiple,
		);
		const minimumTerm = toNumber(form.investorStructure.minimumTermYears);
		const totalDistributionsRequired =
			targetMultiple > 0 ? totalCapitalRaiseValue * targetMultiple : 0;
		const estimatedPaybackYears =
			investorAnnualCashflow > 0 && totalDistributionsRequired > 0
				? totalDistributionsRequired / investorAnnualCashflow
				: 0;
		const fixedMultiple =
			totalCapitalRaiseValue > 0 && termYears > 0
				? (investorAnnualCashflow * termYears) / totalCapitalRaiseValue
				: 0;
		const impliedMultiple =
			form.investorStructure.repaymentStructure === 'fixed_term'
				? fixedMultiple
				: form.investorStructure.repaymentStructure === 'hybrid'
				? Math.max(targetMultiple, fixedMultiple)
				: targetMultiple;
		const impliedIrrPct =
			impliedMultiple > 0
				? (Math.pow(
						impliedMultiple,
						1 /
							Math.max(
								termYears || estimatedPaybackYears || minimumTerm || 1,
								1,
							),
				  ) -
						1) *
				  100
				: 0;
		const periodic =
			investorAnnualCashflow /
			(form.investorStructure.distributionFrequency === 'Monthly' ? 12 : 4);

		return {
			grossAnnualRevenue,
			netProjectCashflow,
			investorAnnualCashflow,
			projectedYieldPct,
			impliedIrrPct,
			impliedMultiple,
			estimatedPaybackYears,
			totalDistributionsRequired,
			periodic,
		};
	}, [form, totalCapitalRaiseValue]);

	const workflowStatus = useMemo<Record<WorkflowKey, WorkflowStatus>>(() => {
		return workflowItems.reduce((acc, item) => {
			switch (item.key) {
				case 'projectBasics':
					acc[item.key] = getFieldCompletion([
						form.projectName,
						form.projectType,
						form.stage,
						form.jurisdiction,
						form.siteAddress,
						form.sponsorDeveloper,
						form.investmentSummary,
					]);
					break;
				case 'assetModule':
					acc[item.key] = getFieldCompletion([
						form.siteControl,
						form.gridConnectionStatus,
						isBattery || isHybrid ? form.battery.powerCapacityMw : 'na',
						isBattery || isHybrid ? form.battery.energyCapacityMwh : 'na',
						isSolar || isHybrid ? form.solar.acCapacityMw : 'na',
					]);
					break;
				case 'capitalStructure':
					acc[item.key] = getFieldCompletion([
						form.useOfFunds.equipmentCost,
						form.useOfFunds.installationCost,
						form.capitalStructure.minimumInvestment,
						form.capitalStructure.fundingTranches,
					]);
					break;
				case 'energyGridConfiguration':
					acc[item.key] = getFieldCompletion([
						form.energyGridConfiguration.gridPosition,
						form.energyGridConfiguration.electricitySupplyArrangement,
						form.energyGridConfiguration.tariffStructure,
						form.energyGridConfiguration.onsiteGenerationType,
						form.energyGridConfiguration.demandChargesStatus,
						form.energyGridConfiguration.marketAccess,
					]);
					break;
				case 'revenueModel':
					acc[item.key] = getFieldCompletion([
						form.revenueModel.revenueStrategy,
						form.revenueModel.revenueDrivers,
						form.revenueModel.marketRevenuePct,
						form.revenueModel.contractedRevenuePct,
						form.revenueModel.marketParticipation,
						form.revenueModel.optimisationResponsibility,
					]);
					break;
				case 'cashflowAllocation':
					acc[item.key] = getFieldCompletion([
						form.cashflowAllocation.spvPct,
						form.cashflowAllocation.hostPct,
						form.cashflowAllocation.operatorAggregatorPct,
						form.cashflowAllocation.annualOpex,
						form.cashflowAllocation.maintenanceCosts,
					]);
					break;
				case 'riskInputs':
					acc[item.key] = getFieldCompletion([
						form.risks.counterpartyName,
						form.risks.counterpartyType,
						form.risks.counterpartyRole,
						form.risks.contractStatus,
						form.risks.riskGridConnectionStatus,
						form.risks.permitsStatus,
					]);
					break;
				case 'investmentStructure':
					acc[item.key] = getFieldCompletion([
						form.investorStructure.structureType,
						form.investorStructure.investorAllocationPct,
						form.investorStructure.repaymentStructure,
						form.investorStructure.distributionFrequency,
						form.investorStructure.returnType,
						form.investorStructure.cashflowBasis,
					]);
					break;
				case 'documents':
					acc[item.key] = getFieldCompletion([
						form.documents.investmentMemo.status,
						form.documents.financialModel.status,
						form.documents.hostAgreement.status,
						form.documents.technicalReport.status,
					]);
					break;
				case 'tokenStructure':
					acc[item.key] = getFieldCompletion([
						form.tokenStructure.tokenSymbol,
						form.tokenStructure.pricePerToken,
						form.capitalStructure.minimumInvestment,
						String(issuanceComputed.totalUnitsIssued || ''),
					]);
					break;
				case 'rpaReviewSubmit':
					acc[item.key] = getFieldCompletion([
						form.agreement.developerDeclarationAccepted,
					]);
					break;
				default:
					acc[item.key as WorkflowKey] = 'Not Started' as WorkflowStatus;
			}
			return acc;
		}, {} as Record<WorkflowKey, WorkflowStatus>);
	}, [form, isBattery, isHybrid, isSolar, issuanceComputed.totalUnitsIssued]);

	useEffect(() => {
		const loadProject = async () => {
			if (projectId && !Number.isNaN(Number(projectId))) {
				try {
					const response = await projectService.getProject(projectId);
					const project = (response?.data ?? response) as Record<string, any>;
					const payload = extractProjectSetupPayload(project);

					if (payload) {
						const hydrated = mergeForm(payload);
						const recommended = getRecommendedStructure(hydrated.projectType);
						hydrated.revenueModel.recommendedStructure = recommended.structure;
						hydrated.revenueModel.recommendedReason =
							hydrated.revenueModel.recommendedReason || recommended.reason;
						hydrated.revenueModel.selectedStructure =
							hydrated.revenueModel.selectedStructure || recommended.structure;
						hydrated.capitalStructure.totalProjectCapex = String(
							toNumber(hydrated.useOfFunds.equipmentCost) +
								toNumber(hydrated.useOfFunds.installationCost) +
								toNumber(hydrated.useOfFunds.gridConnectionCost) +
								toNumber(hydrated.useOfFunds.developmentCosts) +
								toNumber(hydrated.useOfFunds.contingency),
						);
						const raise =
							toNumber(hydrated.capitalStructure.totalProjectCapex) +
							calculateRegenxFees(
								toNumber(hydrated.capitalStructure.totalProjectCapex),
							);
						hydrated.capitalStructure.fundingGoal = String(raise);
						hydrated.capitalStructure.investorAllocation = String(raise);
						hydrated.capitalStructure.investorOwnershipPct = '100';
						hydrated.useOfFunds.regenxFees = String(
							calculateRegenxFees(
								toNumber(hydrated.capitalStructure.totalProjectCapex),
							),
						);
						hydrated.tokenStructure.minimumInvestmentDerived =
							hydrated.capitalStructure.minimumInvestment || '';
						setForm(hydrated);
					}

					setProjectMeta(project as IProject);
					const loadedProjectId = String(project?.id ?? projectId);
					setBackendProjectId(loadedProjectId);
					void loadRpaSummary(loadedProjectId);
					setSaveMessage('Draft loaded from backend');
					window.setTimeout(() => setSaveMessage(''), 1500);
				} catch (error) {
					console.error('Failed to load project', error);
					setSubmitError('Failed to load project');
				} finally {
					setIsHydrated(true);
				}
				return;
			}

			setIsHydrated(true);
		};

		void loadProject();
	}, [projectId, isReadOnly]);

	const handleFieldChange =
		(field: keyof ProjectSetupForm) =>
		(
			event: ChangeEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			>,
		) => {
			const value = event.target.value;
			setForm((prev) => {
				const next = { ...prev, [field]: value };
				if (field === 'projectType') {
					const recommended = getRecommendedStructure(value as ProjectType);
					const repaymentStructure =
						value === 'Battery BESS'
							? form.energyGridConfiguration.gridPosition === 'front_of_meter'
								? 'fixed_term'
								: 'target_multiple'
							: value === 'Hybrid'
							? 'hybrid'
							: 'fixed_term';
					next.revenueModel = {
						...prev.revenueModel,
						recommendedStructure: recommended.structure,
						recommendedReason: recommended.reason,
						selectedStructure: prev.revenueModel.overrideRecommendedStructure
							? prev.revenueModel.selectedStructure
							: recommended.structure,
					};
					next.investorStructure = {
						...prev.investorStructure,
						repaymentStructure,
					};
				}
				return next;
			});
		};

	const handleNestedChange =
		<
			T extends keyof Pick<
				ProjectSetupForm,
				| 'battery'
				| 'solar'
				| 'hybrid'
				| 'energyGridConfiguration'
				| 'revenueModel'
				| 'capitalStructure'
				| 'cashflowAllocation'
				| 'useOfFunds'
				| 'investorStructure'
				| 'risks'
				| 'tokenStructure'
				| 'agreement'
			>,
		>(
			parent: T,
			field: keyof ProjectSetupForm[T],
		) =>
		(
			event: ChangeEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			>,
		) => {
			const value = event.target.value;
			setForm((prev) => ({
				...prev,
				[parent]: {
					...prev[parent],
					[field]: value,
				},
			}));
		};

	const handleMinimumInvestmentChange = (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		setMinimumInvestmentManuallyEdited(true);
		handleNestedChange('capitalStructure', 'minimumInvestment')(event);
	};

	const handleDocumentChange =
		(docKey: keyof DocumentsFields, field: keyof DocumentItem) =>
		(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
			const value = event.target.value;
			setForm((prev) => ({
				...prev,
				documents: {
					...prev.documents,
					[docKey]: {
						...prev.documents[docKey],
						[field]: value,
					},
				},
			}));
		};

	const handleCheckboxChange =
		<
			T extends keyof Pick<
				ProjectSetupForm,
				'hybrid' | 'revenueModel' | 'risks' | 'tokenStructure' | 'agreement'
			>,
		>(
			parent: T,
			field: keyof ProjectSetupForm[T],
		) =>
		(event: ChangeEvent<HTMLInputElement>) => {
			const checked = event.target.checked;
			setForm((prev) => ({
				...prev,
				[parent]: {
					...prev[parent],
					[field]: checked,
				},
			}));
		};

	const handleCombinedAgreementAcceptance = (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		const checked = event.target.checked;
		setForm((prev) => ({
			...prev,
			agreement: {
				...prev.agreement,
				platformAgreementAccepted: checked,
				developerDeclarationAccepted: checked,
				offeringTermsAccepted: checked,
			},
		}));
	};

	const handleRevenueSourceToggle = (value: RevenueSource) => {
		setForm((prev) => {
			const exists = prev.revenueModel.revenueSources.includes(value);
			return {
				...prev,
				revenueModel: {
					...prev.revenueModel,
					revenueSources: exists
						? prev.revenueModel.revenueSources.filter((item) => item !== value)
						: [...prev.revenueModel.revenueSources, value],
				},
			};
		});
	};

	const handleMerchantRevenueSourceToggle = (value: RevenueSource) => {
		setForm((prev) => {
			const exists = prev.revenueModel.merchantRevenueStreams.includes(value);
			return {
				...prev,
				revenueModel: {
					...prev.revenueModel,
					merchantRevenueStreams: exists
						? prev.revenueModel.merchantRevenueStreams.filter(
								(item) => item !== value,
						  )
						: [...prev.revenueModel.merchantRevenueStreams, value],
				},
			};
		});
	};

	const toggleStringList = (
		parent: 'energyGridConfiguration' | 'revenueModel' | 'risks',
		field: string,
		value: string,
	) => {
		setForm((prev) => {
			const current = ((prev[parent] as any)[field] ?? []) as string[];
			const exists = current.includes(value);
			return {
				...prev,
				[parent]: {
					...prev[parent],
					[field]: exists
						? current.filter((item) => item !== value)
						: [...current, value],
				},
			};
		});
	};

	const buildPayload = (payloadForm: ProjectSetupForm) => {
		const useOfFundsBase =
			toNumber(payloadForm.useOfFunds.equipmentCost) +
			toNumber(payloadForm.useOfFunds.installationCost) +
			toNumber(payloadForm.useOfFunds.gridConnectionCost) +
			toNumber(payloadForm.useOfFunds.developmentCosts) +
			toNumber(payloadForm.useOfFunds.contingency);

		const totalProjectCapex =
			toNumber(payloadForm.capitalStructure.totalProjectCapex) ||
			useOfFundsBase;
		const regenxFees = calculateRegenxFees(totalProjectCapex);
		const fundingGoal = totalProjectCapex + regenxFees;

		const normalizedForm: ProjectSetupForm = {
			...payloadForm,
			capitalStructure: {
				...payloadForm.capitalStructure,
				totalProjectCapex: String(totalProjectCapex),
				fundingGoal: String(fundingGoal),
				investorAllocation: String(fundingGoal),
				investorOwnershipPct: '100',
			},
			useOfFunds: {
				...payloadForm.useOfFunds,
				regenxFees: String(regenxFees),
			},
			tokenStructure: {
				...payloadForm.tokenStructure,
				pricePerToken: '1.00',
				minimumInvestmentDerived:
					payloadForm.capitalStructure.minimumInvestment || '',
				totalTokenSupply: '',
				ownershipPerTokenPct: '',
				totalUnitsIssued: String(issuanceComputed.totalUnitsIssued || ''),
				unitsAvailableToInvestors: String(
					issuanceComputed.unitsAvailableToInvestors || '',
				),
				unitsPerMinimum: String(issuanceComputed.unitsPerMinimum || ''),
			},
			agreement: {
				...payloadForm.agreement,
				signatoryAuthority: payloadForm.agreement.signatoryTitle,
			},
			rpaOutput: {
				riskFlags: rpaComputed.riskFlags,
			},
		};

		const payloadWorkflowStatus = workflowItems.reduce((acc, item) => {
			acc[item.key] = workflowStatus[item.key];
			return acc;
		}, {} as Record<WorkflowKey, WorkflowStatus>);

		const payloadCompletedCount = workflowItems.filter(
			(item) => payloadWorkflowStatus[item.key] === 'Completed',
		).length;

		return {
			...normalizedForm,
			name: normalizedForm.projectName?.trim() || `Draft-${Date.now()}`,
			projectType: normalizedForm.projectType,
			description: normalizedForm.investmentSummary?.trim() || '',
			location: normalizedForm.siteAddress?.trim() || '',
			fundingGoal,
			minimumInvestment: toNumber(
				normalizedForm.capitalStructure.minimumInvestment,
			),
			investmentTermYears: toNumber(
				normalizedForm.investorStructure.investmentTermYears,
			),
			investmentSummary: normalizedForm.investmentSummary?.trim() || '',
			thumbnailUrl: normalizedForm.thumbnailAsset?.id
				? ''
				: normalizedForm.thumbnailImageUrl?.trim() || '',
			stage: normalizedForm.stage,
			dseType: normalizedForm.dseType,
			jurisdiction: normalizedForm.jurisdiction,
			commissioningDate: normalizedForm.commissioningDate || null,
			payloadJson: normalizedForm,
			draftPayload: normalizedForm,
			workflowStatusJson: payloadWorkflowStatus,
			completedCount: payloadCompletedCount,
			totalSections: workflowItems.length,
			status: 'draft',
		};
	};

	const validateForm = (payload: ProjectSetupForm): Record<string, string> => {
		const next: Record<string, string> = {};

		if (!payload.projectName.trim())
			next.projectName = 'Project name is required';
		if (!payload.siteAddress.trim())
			next.siteAddress = 'Site address is required';
		if (!payload.sponsorDeveloper.trim())
			next.sponsorDeveloper = 'Sponsor / developer is required';
		if (!payload.investmentSummary.trim())
			next.investmentSummary = 'Investment summary is required';
		if (
			!payload.thumbnailAsset?.id &&
			!isValidHttpsUrl(payload.thumbnailImageUrl)
		)
			next.thumbnailImageUrl = 'Enter a valid https URL';
		if (!isValidDate(payload.commissioningDate))
			next.commissioningDate = 'Enter a valid date';

		const numericFields: Array<[string, string, string]> = [
			[
				'capitalStructure.totalProjectCapex',
				payload.capitalStructure.totalProjectCapex,
				'Enter a valid currency amount',
			],
			[
				'capitalStructure.minimumInvestment',
				payload.capitalStructure.minimumInvestment,
				'Enter a valid currency amount',
			],
			[
				'battery.powerCapacityMw',
				payload.battery.powerCapacityMw,
				'Enter a valid number',
			],
			[
				'battery.energyCapacityMwh',
				payload.battery.energyCapacityMwh,
				'Enter a valid number',
			],
			[
				'battery.durationHours',
				payload.battery.durationHours,
				'Enter a valid number',
			],
			[
				'solar.dcCapacityMw',
				payload.solar.dcCapacityMw,
				'Enter a valid number',
			],
			[
				'solar.acCapacityMw',
				payload.solar.acCapacityMw,
				'Enter a valid number',
			],
			[
				'useOfFunds.equipmentCost',
				payload.useOfFunds.equipmentCost,
				'Enter a valid currency amount',
			],
			[
				'useOfFunds.installationCost',
				payload.useOfFunds.installationCost,
				'Enter a valid currency amount',
			],
			[
				'useOfFunds.gridConnectionCost',
				payload.useOfFunds.gridConnectionCost,
				'Enter a valid currency amount',
			],
			[
				'useOfFunds.developmentCosts',
				payload.useOfFunds.developmentCosts,
				'Enter a valid currency amount',
			],
			[
				'useOfFunds.contingency',
				payload.useOfFunds.contingency,
				'Enter a valid currency amount',
			],
			[
				'revenueModel.contractLengthYears',
				payload.revenueModel.contractLengthYears,
				'Enter a valid number',
			],
			[
				'revenueModel.estimatedAnnualSavings',
				payload.revenueModel.estimatedAnnualSavings,
				'Enter a valid currency amount',
			],
			[
				'revenueModel.minimumPaymentFloor',
				payload.revenueModel.minimumPaymentFloor,
				'Enter a valid currency amount',
			],
			[
				'revenueModel.expectedAnnualMerchantRevenue',
				payload.revenueModel.expectedAnnualMerchantRevenue,
				'Enter a valid currency amount',
			],
			[
				'revenueModel.paymentDelayDays',
				payload.revenueModel.paymentDelayDays,
				'Enter a valid number',
			],
			[
				'investorStructure.targetReturnMultiple',
				payload.investorStructure.targetReturnMultiple,
				'Enter a valid number',
			],
			[
				'investorStructure.investmentTermYears',
				payload.investorStructure.investmentTermYears,
				'Enter a valid number',
			],
			[
				'tokenStructure.pricePerToken',
				payload.tokenStructure.pricePerToken,
				'Enter a valid currency amount',
			],
		];

		for (const [key, value, message] of numericFields) {
			if (!isValidNumeric(value)) next[key] = message;
		}

		const percentFields: Array<[string, string]> = [
			['revenueModel.escalationPct', payload.revenueModel.escalationPct],
			['revenueModel.spvSharePct', payload.revenueModel.spvSharePct],
			['revenueModel.hostSharePct', payload.revenueModel.hostSharePct],
			['revenueModel.aggregatorFeePct', payload.revenueModel.aggregatorFeePct],
			[
				'revenueModel.contractedAllocationPct',
				payload.revenueModel.contractedAllocationPct,
			],
			[
				'revenueModel.merchantAllocationPct',
				payload.revenueModel.merchantAllocationPct,
			],
			['revenueModel.marketRevenuePct', payload.revenueModel.marketRevenuePct],
			[
				'revenueModel.contractedRevenuePct',
				payload.revenueModel.contractedRevenuePct,
			],
			['cashflowAllocation.spvPct', payload.cashflowAllocation.spvPct],
			['cashflowAllocation.hostPct', payload.cashflowAllocation.hostPct],
			[
				'cashflowAllocation.operatorAggregatorPct',
				payload.cashflowAllocation.operatorAggregatorPct,
			],
			[
				'investorStructure.investorAllocationPct',
				payload.investorStructure.investorAllocationPct,
			],
		];

		for (const [key, value] of percentFields) {
			if (!isValidPercent(value))
				next[key] = 'Enter a percent between 0 and 100';
		}

		if (useOfFundsBaseValue <= 0) {
			next['useOfFunds.equipmentCost'] =
				'Use of funds must be greater than zero';
			next['useOfFunds.installationCost'] =
				'Use of funds must be greater than zero';
			next['useOfFunds.gridConnectionCost'] =
				'Use of funds must be greater than zero';
			next['useOfFunds.developmentCosts'] =
				'Use of funds must be greater than zero';
			next['useOfFunds.contingency'] = 'Use of funds must be greater than zero';
		}

		if (toNumber(payload.capitalStructure.minimumInvestment) <= 0) {
			next['capitalStructure.minimumInvestment'] =
				'Minimum investment must be greater than 0';
		}

		if (!payload.capitalStructure.fundingTranches.trim()) {
			next['capitalStructure.fundingTranches'] =
				'Funding tranches / drawdown structure is required';
		}

		if (isBattery || isHybrid) {
			if (!payload.battery.powerCapacityMw.trim())
				next['battery.powerCapacityMw'] = 'Power capacity is required';
			if (!payload.battery.energyCapacityMwh.trim())
				next['battery.energyCapacityMwh'] = 'Energy capacity is required';
			if (!payload.battery.durationHours.trim())
				next['battery.durationHours'] = 'Duration is required';
		}

		if (isSolar || isHybrid) {
			if (!payload.solar.dcCapacityMw.trim())
				next['solar.dcCapacityMw'] = 'DC capacity is required';
			if (!payload.solar.acCapacityMw.trim())
				next['solar.acCapacityMw'] = 'AC capacity is required';
		}

		if (!payload.energyGridConfiguration.tariffStructure.length)
			next['energyGridConfiguration.tariffStructure'] =
				'Select at least one tariff structure';
		if (!payload.revenueModel.revenueDrivers.length)
			next['revenueModel.revenueDrivers'] =
				'Select at least one revenue driver';
		const revenueMixTotal =
			toNumber(payload.revenueModel.marketRevenuePct) +
			toNumber(payload.revenueModel.contractedRevenuePct);
		if (revenueMixTotal !== 100)
			next['revenueModel.revenueMix'] = 'Revenue mix must equal 100';
		const cashflowSplitTotal =
			toNumber(payload.cashflowAllocation.spvPct) +
			toNumber(payload.cashflowAllocation.hostPct) +
			toNumber(payload.cashflowAllocation.operatorAggregatorPct);
		if (cashflowSplitTotal !== 100)
			next['cashflowAllocation.split'] =
				'SPV, Host, and Operator / Aggregator percentages should add up to 100%.';

		if (!payload.risks.counterpartyName.trim())
			next['risks.counterpartyName'] = 'Primary counterparty name is required';

		if (!payload.investorStructure.investorAllocationPct.trim())
			next['investorStructure.investorAllocationPct'] =
				'Investor allocation is required';
		if (
			payload.investorStructure.repaymentStructure === 'fixed_term' &&
			!payload.investorStructure.investmentTermYears.trim()
		)
			next['investorStructure.investmentTermYears'] =
				'Investment term years is required';
		if (
			payload.investorStructure.repaymentStructure === 'target_multiple' &&
			!payload.investorStructure.targetReturnMultiple.trim()
		)
			next['investorStructure.targetReturnMultiple'] =
				'Target return multiple is required';
		if (payload.investorStructure.repaymentStructure === 'hybrid') {
			if (!payload.investorStructure.minimumTermYears.trim())
				next['investorStructure.minimumTermYears'] = 'Minimum term is required';
			if (!payload.investorStructure.targetReturnMultiple.trim())
				next['investorStructure.targetReturnMultiple'] =
					'Target return multiple is required';
		}

		if (
			!payload.documents.investmentMemo.fileId &&
			!isValidHttpsUrl(payload.documents.investmentMemo.url)
		)
			next['documents.investmentMemo.url'] = 'Enter a valid https URL';
		if (
			!payload.documents.financialModel.fileId &&
			!isValidHttpsUrl(payload.documents.financialModel.url)
		)
			next['documents.financialModel.url'] = 'Enter a valid https URL';
		if (
			!payload.documents.hostAgreement.fileId &&
			!isValidHttpsUrl(payload.documents.hostAgreement.url)
		)
			next['documents.hostAgreement.url'] = 'Enter a valid https URL';

		if (!payload.tokenStructure.tokenSymbol.trim())
			next['tokenStructure.tokenSymbol'] = 'Token symbol is required';
		else if (payload.tokenStructure.tokenSymbol.trim().length > 5)
			next['tokenStructure.tokenSymbol'] = 'Max 5 characters';
		else if (!/^[A-Z0-9]+$/.test(payload.tokenStructure.tokenSymbol.trim()))
			next['tokenStructure.tokenSymbol'] =
				'Use uppercase letters and numbers only';
		if (
			payload.tokenStructure.lockupPeriod.trim() &&
			!/^\d+$/.test(payload.tokenStructure.lockupPeriod.trim())
		) {
			next['tokenStructure.lockupPeriod'] = 'Enter whole months only';
		}

		if (!payload.agreement.developerDeclarationAccepted)
			next['agreement.developerDeclarationAccepted'] = 'Required';

		return next;
	};

	const persistReadinessSections = async (savedId: string) => {
		const saveSection = async (
			section: string,
			data: Record<string, unknown>,
		) => {
			try {
				await projectService.saveReadinessSection(savedId, section, data);
			} catch (error) {
				console.info(`Readiness section ${section} not saved yet`, error);
			}
		};

		await saveSection('energy-configuration', {
			...form.energyGridConfiguration,
		});
		await saveSection('revenue-profile', {
			revenueStrategy: form.revenueModel.revenueStrategy,
			revenueDrivers: form.revenueModel.revenueDrivers,
			marketRevenuePct: form.revenueModel.marketRevenuePct,
			contractedRevenuePct: form.revenueModel.contractedRevenuePct,
			annualContractedRevenue: form.revenueModel.estimatedAnnualSavings,
			annualMerchantRevenue: form.revenueModel.expectedAnnualMerchantRevenue,
			marketParticipation: form.revenueModel.marketParticipation,
			optimisationResponsibility: form.revenueModel.optimisationResponsibility,
			revenueRiskManagement: form.revenueModel.revenueRiskManagement,
			marketExposure: form.revenueModel.marketExposure,
			marketGridDrivers: form.revenueModel.marketGridDrivers,
		});
		await saveSection('cashflow-allocation', {
			...form.cashflowAllocation,
		});
		await saveSection('risk-inputs', {
			counterpartyName: form.risks.counterpartyName,
			counterpartyType: form.risks.counterpartyType,
			counterpartyRole: form.risks.counterpartyRole,
			contractStatus: form.risks.contractStatus,
			siteSecured: form.risks.siteSecured,
			gridConnectionStatus: form.risks.riskGridConnectionStatus,
			permitsStatus: form.risks.permitsStatus,
			epcContractorStatus: form.risks.epcContractorStatus,
			operationalDependencies: form.risks.operationalDependencies,
			keyRiskFactors: form.risks.keyRiskFactors,
			dataConfidence: form.risks.dataConfidence,
		});
		await saveSection('investment-structure', {
			structureType: form.investorStructure.structureType,
			investorAllocationPct: form.investorStructure.investorAllocationPct,
			repaymentStructure: form.investorStructure.repaymentStructure,
			investmentTermYears: form.investorStructure.investmentTermYears,
			targetReturnMultiple: form.investorStructure.targetReturnMultiple,
			minimumTermYears: form.investorStructure.minimumTermYears,
			distributionFrequency:
				form.investorStructure.distributionFrequency === 'Monthly'
					? 'monthly'
					: 'quarterly',
			returnType: form.investorStructure.returnType,
			cashflowBasis: form.investorStructure.cashflowBasis,
			investorPriority: form.investorStructure.investorPriority,
			paymentTiming: form.investorStructure.paymentTiming,
		});
		await saveSection('issuance', {
			pricePerUnit: form.tokenStructure.pricePerToken || '1',
			tokenSymbol: form.tokenStructure.tokenSymbol || undefined,
			minimumInvestment: form.capitalStructure.minimumInvestment,
			distributionMethod: 'on_chain_payout',
			secondaryTradingEnabled: form.tokenStructure.secondaryTradingEnabled,
			lockupPeriodMonths: form.tokenStructure.lockupPeriod,
			transferRestrictions: form.tokenStructure.transferRestrictions,
			walletRequired: form.tokenStructure.walletRequired,
		});
		try {
			const calculated = await projectService.calculateReadinessReturns(
				savedId,
			);
			const outputs = (calculated?.data ?? calculated) as Record<string, any>;
			setForm((prev) => ({
				...prev,
				returnOutputs: {
					projectedYieldPct: String(outputs.projectedYieldPct ?? ''),
					impliedIrrPct: String(outputs.impliedIrrPct ?? ''),
					impliedReturnMultiple: String(outputs.impliedReturnMultiple ?? ''),
					estimatedPaybackYears: String(outputs.estimatedPaybackYears ?? ''),
					totalDistributionsRequired: String(
						outputs.totalDistributionsRequired ?? '',
					),
					annualNetCashflow: String(outputs.annualNetCashflow ?? ''),
					estimatedPeriodicDistribution: String(
						outputs.estimatedPeriodicDistribution ?? '',
					),
				},
			}));
		} catch (error) {
			console.info(
				'Return calculation will run after required inputs are complete',
				error,
			);
		}
	};

	const persistDraftToBackend = async (): Promise<string | null> => {
		try {
			setSubmitError('');
			setIsSavingDraft(true);
			const payload = buildPayload(form);
			const response = backendProjectId
				? await projectService.saveDraft(backendProjectId, payload)
				: await projectService.createProject(payload);

			const saved = response?.data ?? response;
			const savedId = String(saved?.id ?? saved?.project?.id ?? '') || null;

			if (savedId) {
				setBackendProjectId(savedId);
				await persistReadinessSections(savedId);
				if (projectId !== savedId) {
					navigate(`/project-setup?projectId=${savedId}`, { replace: true });
				}
			}

			setSaveMessage('Draft saved');
			window.setTimeout(() => setSaveMessage(''), 1500);
			return savedId;
		} catch (error) {
			console.error('Failed to save draft', error);
			setSubmitError(
				'Draft could not be saved. Please check required project basics and try again.',
			);
			setSaveMessage('Draft save failed');
			window.setTimeout(() => setSaveMessage(''), 2500);
			return null;
		} finally {
			setIsSavingDraft(false);
		}
	};

	const normalizeUploadedAsset = (asset: any): UploadedProjectAsset => ({
		id: String(asset?.id ?? ''),
		category: String(asset?.category ?? ''),
		purpose: String(asset?.purpose ?? ''),
		documentKey: asset?.documentKey ?? null,
		storageKey: String(asset?.storageKey ?? ''),
		originalFilename: String(asset?.originalFilename ?? ''),
		mimeType: String(asset?.mimeType ?? ''),
		fileSize: Number.isFinite(Number(asset?.fileSize))
			? Number(asset.fileSize)
			: null,
		uploadedBy: Number.isFinite(Number(asset?.uploadedBy))
			? Number(asset.uploadedBy)
			: null,
		uploadedAt: String(asset?.uploadedAt ?? ''),
		url: String(asset?.url ?? ''),
	});

	const ensureProjectIdForUpload = async () => {
		if (backendProjectId) return backendProjectId;

		const savedId = await persistDraftToBackend();
		if (!savedId) {
			throw new Error('Save the draft before uploading files.');
		}

		return savedId;
	};

	const handleThumbnailUpload = async (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			setErrors((prev) => ({
				...prev,
				thumbnailImageUrl: 'Upload an image file for the thumbnail',
			}));
			return;
		}

		try {
			setErrors((prev) => {
				const next = { ...prev };
				delete next.thumbnailImageUrl;
				return next;
			});
			setIsUploadingThumbnail(true);
			const savedId = await ensureProjectIdForUpload();
			const uploaded = normalizeUploadedAsset(
				await projectService.uploadProjectFile(
					savedId,
					file,
					'PROJECT_THUMBNAIL',
				),
			);

			setForm((prev) => ({
				...prev,
				thumbnailImageUrl: uploaded.url || prev.thumbnailImageUrl,
				thumbnailAsset: uploaded,
			}));
			setSaveMessage('Thumbnail uploaded');
			window.setTimeout(() => setSaveMessage(''), 1500);
		} catch (error) {
			console.error('Failed to upload thumbnail', error);
			setErrors((prev) => ({
				...prev,
				thumbnailImageUrl: 'Thumbnail upload failed',
			}));
		} finally {
			setIsUploadingThumbnail(false);
		}
	};

	const handleDocumentUpload =
		(docKey: keyof DocumentsFields) =>
		async (event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			event.target.value = '';
			if (!file) return;

			if (file.type !== 'application/pdf') {
				setErrors((prev) => ({
					...prev,
					[`documents.${docKey}.url`]: 'Upload a PDF document',
				}));
				return;
			}

			try {
				setErrors((prev) => {
					const next = { ...prev };
					delete next[`documents.${docKey}.url`];
					return next;
				});
				setUploadingDocumentKey(docKey);
				const savedId = await ensureProjectIdForUpload();
				const uploaded = normalizeUploadedAsset(
					await projectService.uploadProjectFile(
						savedId,
						file,
						'PROJECT_DOCUMENT',
						String(docKey),
					),
				);

				setForm((prev) => ({
					...prev,
					documents: {
						...prev.documents,
						[docKey]: {
							...prev.documents[docKey],
							url: uploaded.url || prev.documents[docKey].url,
							fileId: uploaded.id,
							fileName: uploaded.originalFilename,
							mimeType: uploaded.mimeType,
							storageKey: uploaded.storageKey,
							uploadedAt: uploaded.uploadedAt,
							status:
								prev.documents[docKey].status === 'Not Applicable'
									? 'Available'
									: prev.documents[docKey].status,
						},
					},
				}));
				setSaveMessage('Document uploaded');
				window.setTimeout(() => setSaveMessage(''), 1500);
			} catch (error) {
				console.error(`Failed to upload document ${String(docKey)}`, error);
				setErrors((prev) => ({
					...prev,
					[`documents.${docKey}.url`]: 'Document upload failed',
				}));
			} finally {
				setUploadingDocumentKey(null);
			}
		};

	const handleClearDraft = async () => {
		const rec = getRecommendedStructure(defaultForm.projectType);
		setForm({
			...defaultForm,
			revenueModel: {
				...defaultForm.revenueModel,
				recommendedStructure: rec.structure,
				recommendedReason: rec.reason,
				selectedStructure: rec.structure,
			},
		});
		setActiveKey('projectBasics');
		setCapexManuallyOverridden(false);
		setMinimumInvestmentManuallyEdited(false);
		setTokenSymbolManuallyEdited(false);
		setErrors({});
		setSubmitError('');
		setSaveMessage('Draft cleared');
		window.setTimeout(() => setSaveMessage(''), 1500);
	};

	const handleSubmitProject = async () => {
		if (isSubmitting) return;

		const validationErrors = validateForm(form);
		setErrors(validationErrors);
		if (Object.keys(validationErrors).length > 0) {
			setSubmitError('Fix errors before submitting.');
			return;
		}

		try {
			setIsSubmitting(true);
			const savedId = await persistDraftToBackend();
			if (!savedId) {
				alert('Project draft could not be saved. Submission stopped.');
				return;
			}
			await projectService.submitProject(savedId);
			alert('Project submitted for review');
			navigate('/projects');
		} catch (error) {
			console.error('Failed to submit project', error);
			setSubmitError(
				error instanceof Error
					? error.message
					: 'Project submission failed. Please try again.',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const goToNextSection = () => {
		const validationErrors = validateForm(form);
		const currentSectionErrors = getSectionErrors(validationErrors, activeKey);
		setErrors(validationErrors);

		if (Object.keys(currentSectionErrors).length > 0) {
			setSubmitError(
				'Complete the required fields in this section before continuing.',
			);
			return;
		}

		setSubmitError('');
		const currentIndex = workflowItems.findIndex(
			(item) => item.key === activeKey,
		);
		if (currentIndex >= 0 && currentIndex < workflowItems.length - 1) {
			setActiveKey(workflowItems[currentIndex + 1].key);
		}
	};

	const isLastSection =
		workflowItems[workflowItems.length - 1].key === activeKey;

	const renderError = (field: string) =>
		errors[field] ? (
			<p className="mt-1 text-xs text-red-600">{errors[field]}</p>
		) : null;

	const sectionFieldMap: Record<WorkflowKey, string[]> = {
		projectBasics: [
			'projectName',
			'siteAddress',
			'sponsorDeveloper',
			'investmentSummary',
			'thumbnailImageUrl',
			'commissioningDate',
		],
		assetModule: [
			'battery.powerCapacityMw',
			'battery.energyCapacityMwh',
			'battery.durationHours',
			'solar.dcCapacityMw',
			'solar.acCapacityMw',
			'hybrid.dispatchStrategy',
		],
		capitalStructure: [
			'capitalStructure.totalProjectCapex',
			'useOfFunds.equipmentCost',
			'useOfFunds.installationCost',
			'useOfFunds.gridConnectionCost',
			'useOfFunds.developmentCosts',
			'useOfFunds.contingency',
			'capitalStructure.minimumInvestment',
			'capitalStructure.fundingTranches',
		],
		energyGridConfiguration: ['energyGridConfiguration.tariffStructure'],
		revenueModel: [
			'revenueModel.revenueDrivers',
			'revenueModel.marketRevenuePct',
			'revenueModel.contractedRevenuePct',
			'revenueModel.revenueMix',
		],
		cashflowAllocation: [
			'cashflowAllocation.spvPct',
			'cashflowAllocation.hostPct',
			'cashflowAllocation.operatorAggregatorPct',
			'cashflowAllocation.split',
		],
		riskInputs: ['risks.counterpartyName'],
		investmentStructure: [
			'investorStructure.investorAllocationPct',
			'investorStructure.investmentTermYears',
			'investorStructure.targetReturnMultiple',
			'investorStructure.minimumTermYears',
		],
		documents: [
			'documents.investmentMemo.url',
			'documents.financialModel.url',
			'documents.hostAgreement.url',
		],
		tokenStructure: [
			'tokenStructure.tokenSymbol',
			'tokenStructure.pricePerToken',
		],
		rpaReviewSubmit: ['agreement.developerDeclarationAccepted'],
	};

	const getSectionErrors = (
		allErrors: Record<string, string>,
		section: WorkflowKey,
	): Record<string, string> => {
		const allowed = new Set(sectionFieldMap[section]);
		return Object.fromEntries(
			Object.entries(allErrors).filter(([key]) => allowed.has(key)),
		);
	};

	const renderContinueButton = () => {
		if (isReadOnly) return null;

		return (
			<div className="mt-8">
				{submitError ? (
					<div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
						{submitError}
					</div>
				) : null}
				{saveMessage ? (
					<div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
						{saveMessage}
					</div>
				) : null}
				<div className="flex flex-wrap items-center gap-3">
					{!isLastSection ? (
						<button
							type="button"
							onClick={goToNextSection}
							className="rounded-xl bg-[#DCEEFF] px-5 py-3 text-sm font-semibold text-[#0F6A99] transition hover:bg-[#C7E3FF]"
						>
							Continue
						</button>
					) : (
						<button
							type="button"
							onClick={handleSubmitProject}
							disabled={
								isSubmitting || !form.agreement.developerDeclarationAccepted
							}
							className="rounded-xl bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSubmitting ? 'Submitting...' : 'Submit for admin review'}
						</button>
					)}
					<button
						type="button"
						onClick={persistDraftToBackend}
						disabled={isSavingDraft || isSubmitting}
						className="rounded-2xl border border-[#D6DCE5] bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSavingDraft ? 'Saving...' : 'Save Draft'}
					</button>
					<button
						type="button"
						onClick={handleClearDraft}
						disabled={isSavingDraft || isSubmitting}
						className="rounded-2xl border border-[#D6DCE5] bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Clear Draft
					</button>
				</div>
			</div>
		);
	};

	const renderGroupedMultiSelect = (
		parent: 'energyGridConfiguration' | 'revenueModel' | 'risks',
		field: string,
		groups: readonly MultiSelectGroup[],
	) => {
		const selectedValues = ((form[parent] as any)[field] ?? []) as string[];

		return (
			<div className="rounded-2xl border border-[#DDE5F0] bg-[#F8FAFC] p-4">
				<div
					className={`grid grid-cols-1 gap-3 ${
						groups.length > 1 ? 'lg:grid-cols-2' : ''
					}`}
				>
					{groups.map((group) => (
						<div
							key={group.title}
							className="rounded-[14px] border border-[#E7ECF4] bg-white p-4"
						>
							<div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#163F74]">
								{group.title}
							</div>
							<p className="mt-1 text-[13px] leading-5 text-[#5F6C86]">
								{group.description}
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{group.options.map(([value, label]) => {
									const selected = selectedValues.includes(value);
									return (
										<button
											key={value}
											type="button"
											aria-pressed={selected}
											onClick={() => toggleStringList(parent, field, value)}
											className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold leading-none transition ${
												selected
													? 'border-[#123DA8] bg-[#EAF1FF] text-[#123DA8] shadow-[0_1px_3px_rgba(18,61,168,0.12)]'
													: 'border-[#D6DCE5] bg-white text-[#334155] hover:border-[#A8B4C7] hover:bg-[#F8FAFC]'
											}`}
										>
											{label}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		);
	};

	const renderReadOnlyValue = (
		value: string | number,
		prefix = '',
		suffix = '',
	) => (
		<div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#111827]">
			{value || value === 0 ? `${prefix}${value}${suffix}` : '—'}
		</div>
	);

	const renderProjectBasics = () => (
		<>
			<SectionHeader
				title="Project Basics"
				description="Start by identifying the project, its stage, location, and developer. These details route the rest of the setup flow and appear in investor-facing summaries."
			/>
			<SectionHelpCard>{sectionHelpText.projectBasics}</SectionHelpCard>
			<div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
				<div className="md:col-span-2">
					<Field
						label="Project Name"
						hint="Use a clear investor-facing name for the opportunity."
					>
						<input
							value={form.projectName}
							onChange={handleFieldChange('projectName')}
							className={inputClass('projectName')}
						/>
						{renderError('projectName')}
					</Field>
				</div>
				<Field
					label="Project Type"
					hint="Select the asset type. This helps tailor later revenue and issuance settings."
				>
					<select
						value={form.projectType}
						onChange={handleFieldChange('projectType')}
						className={inputClass('projectType')}
					>
						<option value="Battery BESS">Battery BESS</option>
						<option value="Solar">Solar</option>
						<option value="Hybrid">Hybrid</option>
					</select>
				</Field>
				<Field
					label="Project Stage"
					hint="Select the current stage of development or operation."
				>
					<select
						value={form.stage}
						onChange={handleFieldChange('stage')}
						className={inputClass('stage')}
					>
						<option value="Development">Development</option>
						<option value="Construction">Construction</option>
						<option value="Operating">Operating</option>
					</select>
				</Field>
				<Field
					label="Jurisdiction"
					hint="Country or legal jurisdiction where the project is located."
				>
					<input
						value={form.jurisdiction}
						onChange={handleFieldChange('jurisdiction')}
						className={inputClass('jurisdiction')}
					/>
				</Field>
				<div className="md:col-span-2">
					<Field
						label="Site Address / Location"
						hint="Physical site address or general project location."
					>
						<input
							value={form.siteAddress}
							onChange={handleFieldChange('siteAddress')}
							className={inputClass('siteAddress')}
						/>
						{renderError('siteAddress')}
					</Field>
				</div>
				<Field
					label="Developer / Sponsor Name"
					hint="Entity responsible for developing or sponsoring the project."
				>
					<input
						value={form.sponsorDeveloper}
						onChange={handleFieldChange('sponsorDeveloper')}
						className={inputClass('sponsorDeveloper')}
					/>
					{renderError('sponsorDeveloper')}
				</Field>
				<Field
					label="Commissioning Date"
					hint="Expected or actual date the asset becomes operational."
				>
					<input
						type="date"
						lang="en-AU"
						value={form.commissioningDate}
						onChange={handleFieldChange('commissioningDate')}
						className={inputClass('commissioningDate')}
					/>
					{renderError('commissioningDate')}
				</Field>
				<Field
					label="Thumbnail / Cover Image"
					hint="Upload an image that will appear on the investor opportunity page."
				>
					<div className="space-y-2">
						<input
							type="file"
							accept="image/*"
							onChange={handleThumbnailUpload}
							className={inputClass('thumbnailImageUrl')}
							disabled={isUploadingThumbnail}
						/>
						{form.thumbnailAsset?.originalFilename ? (
							<div className="text-sm text-[#5F6C86]">
								Uploaded file: {form.thumbnailAsset.originalFilename}
							</div>
						) : form.thumbnailImageUrl ? (
							<a
								href={form.thumbnailImageUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm font-medium text-[#1D4ED8] underline"
							>
								View current thumbnail
							</a>
						) : (
							<div className="text-sm text-[#5F6C86]">
								No thumbnail uploaded yet.
							</div>
						)}
						{isUploadingThumbnail && (
							<div className="text-sm text-[#5F6C86]">
								Uploading thumbnail...
							</div>
						)}
					</div>
					{renderError('thumbnailImageUrl')}
				</Field>
				<div className="md:col-span-2">
					<Field
						label="Short Project Summary"
						hint="Briefly explain what the project is, why capital is being raised, and what investors are funding."
					>
						<textarea
							value={form.investmentSummary}
							onChange={handleFieldChange('investmentSummary')}
							className={textareaClass}
						/>
						{renderError('investmentSummary')}
					</Field>
				</div>
			</div>

			{renderContinueButton()}
		</>
	);

	const renderAssetModule = () => (
		<>
			<SectionHeader
				title="Asset"
				description="Provide the physical and technical details of the asset so RegenX can assess scale, delivery status, and operating assumptions."
			/>
			<SectionHelpCard>{sectionHelpText.assetModule}</SectionHelpCard>
			<div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
				<Field
					label="Site Ownership"
					hint="Indicate whether the site is owned, leased, or controlled through another arrangement."
				>
					<select
						value={form.siteControl}
						onChange={handleFieldChange('siteControl')}
						className={inputClass('siteControl')}
					>
						<option value="Owned">Owned</option>
						<option value="Leased">Leased</option>
						<option value="Option to Lease">Option to Lease</option>
						<option value="Host Site Agreement">Host Site Agreement</option>
					</select>
				</Field>
				<Field
					label="Land Status"
					hint="Describe the current land access or site control position."
				>
					<input
						value={form.landRightsNotes}
						onChange={handleFieldChange('landRightsNotes')}
						className={inputClass('landRightsNotes')}
					/>
				</Field>
				<Field
					label="Grid Connection Status"
					hint="Select the current grid connection status."
				>
					<select
						value={form.gridConnectionStatus}
						onChange={handleFieldChange('gridConnectionStatus')}
						className={inputClass('gridConnectionStatus')}
					>
						<option value="Not started">Not started</option>
						<option value="Feasibility underway">Feasibility underway</option>
						<option value="Application submitted">Application submitted</option>
						<option value="Approved">Approved</option>
						<option value="Connected">Connected</option>
					</select>
				</Field>
				{(isBattery || isHybrid) && (
					<>
						<Field
							label="Power Capacity (kW)"
							hint="Maximum power output of the asset."
						>
							<input
								inputMode="numeric"
								pattern="[0-9]*"
								value={form.battery.powerCapacityMw}
								onChange={handleNestedChange('battery', 'powerCapacityMw')}
								className={inputClass('battery.powerCapacityMw')}
							/>
							{renderError('battery.powerCapacityMw')}
						</Field>
						<Field
							label="Energy Capacity (kWh)"
							hint="Total storage capacity of the battery."
						>
							<input
								inputMode="numeric"
								pattern="[0-9]*"
								value={form.battery.energyCapacityMwh}
								onChange={handleNestedChange('battery', 'energyCapacityMwh')}
								className={inputClass('battery.energyCapacityMwh')}
							/>
							{renderError('battery.energyCapacityMwh')}
						</Field>
						<Field
							label="Duration (years)"
							hint="Expected operating life or contracted asset duration."
						>
							<input
								inputMode="numeric"
								pattern="[0-9]*"
								value={form.battery.durationHours}
								onChange={handleNestedChange('battery', 'durationHours')}
								className={inputClass('battery.durationHours')}
							/>
							{renderError('battery.durationHours')}
						</Field>
						<Field
							label="Cycles per Day"
							hint="Expected average number of battery charge/discharge cycles per day."
						>
							<input
								value={form.battery.cyclesPerDay}
								onChange={handleNestedChange('battery', 'cyclesPerDay')}
								className={inputClass('battery.cyclesPerDay')}
							/>
						</Field>
						<Field
							label="Expected Annual Throughput"
							hint="Estimated annual energy cycled through the asset."
						>
							<input
								value={form.battery.expectedAnnualThroughputMwh}
								onChange={handleNestedChange(
									'battery',
									'expectedAnnualThroughputMwh',
								)}
								className={inputClass('battery.expectedAnnualThroughputMwh')}
							/>
						</Field>
						<Field
							label="Battery Manufacturer"
							hint="Manufacturer or supplier of the battery system."
						>
							<input
								value={form.battery.batteryManufacturer}
								onChange={handleNestedChange('battery', 'batteryManufacturer')}
								className={inputClass('battery.batteryManufacturer')}
							/>
						</Field>
						<Field
							label="Battery Chemistry / Model"
							hint="Battery chemistry or model type, if known."
						>
							<input
								value={form.battery.batteryModel}
								onChange={handleNestedChange('battery', 'batteryModel')}
								className={inputClass('battery.batteryModel')}
							/>
						</Field>
						<Field
							label="Fire / Emergency Controls"
							hint="Current fire safety and emergency response status."
						>
							<select
								value={form.battery.fireEmergencyControls}
								onChange={handleNestedChange(
									'battery',
									'fireEmergencyControls',
								)}
								className={inputClass('battery.fireEmergencyControls')}
							>
								<option value="Integrated suppression">
									Integrated suppression
								</option>
								<option value="Water tanks">Water tanks</option>
								<option value="Gas suppression">Gas suppression</option>
								<option value="Hybrid system">Hybrid system</option>
								<option value="To be confirmed">To be confirmed</option>
							</select>
						</Field>
						<Field
							label="Augmentation / Replacement Plan"
							hint="Describe any planned battery replacement, augmentation, or major maintenance."
						>
							<input
								value={form.battery.augmentationPlan}
								onChange={handleNestedChange('battery', 'augmentationPlan')}
								className={inputClass('battery.augmentationPlan')}
							/>
						</Field>
					</>
				)}
				{(isSolar || isHybrid) && (
					<>
						<Field label="DC Capacity">
							<input
								value={form.solar.dcCapacityMw}
								onChange={handleNestedChange('solar', 'dcCapacityMw')}
								className={inputClass('solar.dcCapacityMw')}
							/>
							{renderError('solar.dcCapacityMw')}
						</Field>
						<Field label="AC Capacity">
							<input
								value={form.solar.acCapacityMw}
								onChange={handleNestedChange('solar', 'acCapacityMw')}
								className={inputClass('solar.acCapacityMw')}
							/>
							{renderError('solar.acCapacityMw')}
						</Field>
						<Field label="Capacity Factor">
							<input
								value={form.solar.capacityFactorPct}
								onChange={handleNestedChange('solar', 'capacityFactorPct')}
								className={inputClass('solar.capacityFactorPct')}
							/>
						</Field>
						<Field label="Panel Manufacturer">
							<input
								value={form.solar.panelManufacturer}
								onChange={handleNestedChange('solar', 'panelManufacturer')}
								className={inputClass('solar.panelManufacturer')}
							/>
						</Field>
						<Field label="Panel Type">
							<input
								value={form.solar.panelType}
								onChange={handleNestedChange('solar', 'panelType')}
								className={inputClass('solar.panelType')}
							/>
						</Field>
						<Field label="Inverter Manufacturer">
							<input
								value={form.solar.inverterManufacturer}
								onChange={handleNestedChange('solar', 'inverterManufacturer')}
								className={inputClass('solar.inverterManufacturer')}
							/>
						</Field>
						<Field label="Mounting System">
							<input
								value={form.solar.mountingSystem}
								onChange={handleNestedChange('solar', 'mountingSystem')}
								className={inputClass('solar.mountingSystem')}
							/>
						</Field>
						<Field label="Irradiance / Yield Assumptions">
							<input
								value={form.solar.irradianceYieldAssumptions}
								onChange={handleNestedChange(
									'solar',
									'irradianceYieldAssumptions',
								)}
								className={inputClass('solar.irradianceYieldAssumptions')}
							/>
						</Field>
						<Field label="Curtailment Assumption">
							<input
								value={form.solar.curtailmentAssumptionPct}
								onChange={handleNestedChange(
									'solar',
									'curtailmentAssumptionPct',
								)}
								className={inputClass('solar.curtailmentAssumptionPct')}
							/>
						</Field>
					</>
				)}
				{isHybrid && (
					<div className="xl:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
						<h3 className="text-base font-semibold text-[#111827]">
							Shared Infrastructure Notes
						</h3>
						<div className="mt-4 flex flex-wrap gap-6">
							<label className="inline-flex items-center gap-3 text-sm text-[#111827]">
								<input
									type="checkbox"
									checked={form.hybrid.coLocated}
									onChange={handleCheckboxChange('hybrid', 'coLocated')}
								/>
								Co-located
							</label>
							<label className="inline-flex items-center gap-3 text-sm text-[#111827]">
								<input
									type="checkbox"
									checked={form.hybrid.sharedGridConnection}
									onChange={handleCheckboxChange(
										'hybrid',
										'sharedGridConnection',
									)}
								/>
								Shared grid connection
							</label>
						</div>
						<div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
							<Field label="Dispatch Logic">
								<textarea
									value={form.hybrid.dispatchStrategy}
									onChange={handleNestedChange('hybrid', 'dispatchStrategy')}
									className={textareaClass}
								/>
							</Field>
							<Field label="Shared Infrastructure Notes">
								<textarea
									value={form.hybrid.sharedInfrastructureNotes}
									onChange={handleNestedChange(
										'hybrid',
										'sharedInfrastructureNotes',
									)}
									className={textareaClass}
								/>
							</Field>
						</div>
					</div>
				)}
			</div>
			{renderContinueButton()}
		</>
	);

	const renderCapitalStructure = () => (
		<>
			<SectionHeader
				title="Capital"
				description="Define how much capital is required to deliver the project and how much will be raised from investors."
			/>
			<SectionHelpCard>{sectionHelpText.capitalStructure}</SectionHelpCard>
			<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
				<Field
					label="Total Project Capex ($)"
					hint="Total cost to build and deliver the project, including all equipment, installation, and development costs."
				>
					<input
						value={form.capitalStructure.totalProjectCapex}
						onChange={(event) => {
							setCapexManuallyOverridden(true);
							handleNestedChange(
								'capitalStructure',
								'totalProjectCapex',
							)(event);
						}}
						className={inputClass('capitalStructure.totalProjectCapex')}
					/>
					{allCapexBreakdownFieldsFilled ? (
						<p className="mt-2 text-xs font-semibold text-[#123DA8]">
							Auto-calculated total: ${formatCurrency(useOfFundsBaseValue)}
						</p>
					) : null}
					{renderError('capitalStructure.totalProjectCapex')}
				</Field>
				<Field
					label="RegenX Fees ($)"
					hint="Platform or structuring fees applied to the capital raise."
				>
					<div className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-[#111827]">
						${formatCurrency(regenxFeeValue)}
					</div>
				</Field>
				<Field
					label="Total Capital Raise ($)"
					hint="Total amount you are raising from investors. This is typically equal to or less than total project cost."
				>
					<div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-[#111827]">
						${formatCurrency(totalCapitalRaiseValue || 0)}
					</div>
					{totalProjectCapexValue > 0 &&
					totalCapitalRaiseValue > totalProjectCapexValue ? (
						<p className="mt-2 rounded-xl border border-[#F2D39B] bg-[#FFF9EC] px-3 py-2 text-xs leading-5 text-[#8A5A00]">
							Capital raise exceeds project cost. Please confirm if this
							includes buffers or additional funding.
						</p>
					) : null}
				</Field>
				<Field
					label="Minimum Investment per Investor ($)"
					hint="Smallest amount an individual investor can commit. For example, $100 or $1,000."
				>
					<input
						value={form.capitalStructure.minimumInvestment}
						onChange={handleMinimumInvestmentChange}
						className={inputClass('capitalStructure.minimumInvestment')}
					/>
					{renderError('capitalStructure.minimumInvestment')}
				</Field>
				<Field
					label="Funding Structure"
					hint="Select how capital will be deployed. Most small projects use a single upfront raise."
				>
					<select
						value={form.capitalStructure.fundingTranches}
						onChange={handleNestedChange('capitalStructure', 'fundingTranches')}
						className={inputClass('capitalStructure.fundingTranches')}
					>
						{selectOptions.fundingStructure.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
					{renderError('capitalStructure.fundingTranches')}
				</Field>
				{form.capitalStructure.fundingTranches === 'staged_funding' ||
				form.capitalStructure.fundingTranches === 'milestone_based' ? (
					<Field
						label="Describe drawdown stages"
						hint="Briefly describe when funds are released (e.g. equipment, installation, commissioning)."
					>
						<input
							value={form.capitalStructure.fundingDrawdownStages}
							onChange={handleNestedChange(
								'capitalStructure',
								'fundingDrawdownStages',
							)}
							className={inputClass('capitalStructure.fundingDrawdownStages')}
						/>
					</Field>
				) : null}
			</div>
			<div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
				<Field
					label="Equipment Cost ($)"
					hint="Cost of batteries, solar panels, or other core equipment."
				>
					<input
						value={form.useOfFunds.equipmentCost}
						onChange={handleNestedChange('useOfFunds', 'equipmentCost')}
						className={inputClass('useOfFunds.equipmentCost')}
					/>
					{renderError('useOfFunds.equipmentCost')}
				</Field>
				<Field
					label="Installation Cost ($)"
					hint="Cost to install and commission the asset."
				>
					<input
						value={form.useOfFunds.installationCost}
						onChange={handleNestedChange('useOfFunds', 'installationCost')}
						className={inputClass('useOfFunds.installationCost')}
					/>
				</Field>
				<Field
					label="Grid Connection Cost ($)"
					hint="Cost to connect the project to the grid."
				>
					<input
						value={form.useOfFunds.gridConnectionCost}
						onChange={handleNestedChange('useOfFunds', 'gridConnectionCost')}
						className={inputClass('useOfFunds.gridConnectionCost')}
					/>
				</Field>
				<Field
					label="Development Costs ($)"
					hint="Design, approvals, engineering, and project management costs."
				>
					<input
						value={form.useOfFunds.developmentCosts}
						onChange={handleNestedChange('useOfFunds', 'developmentCosts')}
						className={inputClass('useOfFunds.developmentCosts')}
					/>
				</Field>
				<Field
					label="Contingency ($)"
					hint="Buffer for unexpected costs during delivery."
				>
					<input
						value={form.useOfFunds.contingency}
						onChange={handleNestedChange('useOfFunds', 'contingency')}
						className={inputClass('useOfFunds.contingency')}
					/>
				</Field>
			</div>
			{renderContinueButton()}
		</>
	);

	const renderDocumentRow = (
		label: string,
		key: keyof DocumentsFields,
		hint?: string,
	) => (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_180px]">
			<Field label={label} hint={hint}>
				<div className="space-y-3">
					<input
						type="file"
						accept="application/pdf"
						onChange={handleDocumentUpload(key)}
						className={inputClass(`documents.${key}.url`)}
						disabled={uploadingDocumentKey === key}
					/>
					{form.documents[key].fileName ? (
						<div className="text-sm text-[#5F6C86]">
							Uploaded PDF: {form.documents[key].fileName}
						</div>
					) : form.documents[key].url ? (
						<a
							href={form.documents[key].url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-medium text-[#1D4ED8] underline"
						>
							View current document
						</a>
					) : (
						<div className="text-sm text-[#5F6C86]">
							No document uploaded yet.
						</div>
					)}
					{uploadingDocumentKey === key && (
						<div className="text-sm text-[#5F6C86]">Uploading document...</div>
					)}
				</div>
				{renderError(`documents.${key}.url`)}
			</Field>
			<Field label="Status">
				<select
					value={form.documents[key].status}
					onChange={handleDocumentChange(key, 'status')}
					className={inputClass(`documents.${key}.status`)}
				>
					<option value="Available">Available</option>
					<option value="Pending">Pending</option>
					<option value="Not Applicable">Not Applicable</option>
				</select>
			</Field>
		</div>
	);

	const renderDocuments = () => (
		<>
			<SectionHeader title="Documents" description="Prove the deal is real." />
			<SectionHelpCard>{sectionHelpText.documents}</SectionHelpCard>
			<div className="mt-8 space-y-5">
				{renderDocumentRow('ESA / RPA / PPA / Host Agreement', 'hostAgreement')}
				{renderDocumentRow('EPC Contract', 'epcContract')}
				{renderDocumentRow('Financial Model', 'financialModel')}
				{renderDocumentRow('Grid Connection Documents', 'gridConnectionDocs')}
				{renderDocumentRow(
					'Site Agreement / Lease / Land Rights',
					'siteAgreement',
				)}
				{renderDocumentRow('Technical Report', 'technicalReport')}
				{renderDocumentRow('Insurance Summary', 'insuranceSummary')}
				{renderDocumentRow('Legal Documents', 'legalDocs')}
				{renderDocumentRow('Investment Memo / Teaser', 'investmentMemo')}
			</div>
			{renderContinueButton()}
		</>
	);

	void [
		derivedTokenCount,
		revenueSourcesDisplay,
		handleCombinedAgreementAcceptance,
		handleRevenueSourceToggle,
		handleMerchantRevenueSourceToggle,
	];

	const renderEnergyGridConfiguration = () => (
		<>
			<SectionHeader
				title="Energy & Grid Configuration"
				description="Define how the asset connects to the energy system and what revenue streams are possible."
			/>
			<SectionHelpCard>
				{sectionHelpText.energyGridConfiguration}
			</SectionHelpCard>
			<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
				<Field label="Grid Position">
					<select
						value={form.energyGridConfiguration.gridPosition}
						onChange={handleNestedChange(
							'energyGridConfiguration',
							'gridPosition',
						)}
						className={inputClass('energyGridConfiguration.gridPosition')}
					>
						{selectOptions.gridPosition.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Electricity Supply Arrangement">
					<select
						value={form.energyGridConfiguration.electricitySupplyArrangement}
						onChange={handleNestedChange(
							'energyGridConfiguration',
							'electricitySupplyArrangement',
						)}
						className={inputClass(
							'energyGridConfiguration.electricitySupplyArrangement',
						)}
					>
						{selectOptions.electricitySupplyArrangement.map(
							([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							),
						)}
					</select>
				</Field>
				<Field label="On-site Generation">
					<select
						value={form.energyGridConfiguration.onsiteGenerationType}
						onChange={handleNestedChange(
							'energyGridConfiguration',
							'onsiteGenerationType',
						)}
						className={inputClass(
							'energyGridConfiguration.onsiteGenerationType',
						)}
					>
						{selectOptions.onsiteGenerationType.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Demand Profile">
					<select
						value={form.energyGridConfiguration.demandChargesStatus}
						onChange={handleNestedChange(
							'energyGridConfiguration',
							'demandChargesStatus',
						)}
						className={inputClass(
							'energyGridConfiguration.demandChargesStatus',
						)}
					>
						{selectOptions.demandChargesStatus.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Market Access">
					<select
						value={form.energyGridConfiguration.marketAccess}
						onChange={handleNestedChange(
							'energyGridConfiguration',
							'marketAccess',
						)}
						className={inputClass('energyGridConfiguration.marketAccess')}
					>
						{selectOptions.marketAccess.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<div className="md:col-span-2 xl:col-span-3">
					<Field label="Tariff Structure">
						{renderGroupedMultiSelect(
							'energyGridConfiguration',
							'tariffStructure',
							groupedMultiSelects.tariffStructure,
						)}
						{renderError('energyGridConfiguration.tariffStructure')}
					</Field>
				</div>
			</div>
			{renderContinueButton()}
		</>
	);

	const renderStructuredRevenue = () => (
		<>
			<SectionHeader
				title="Revenue"
				description="Define how the asset generates income. Do not include investor agreement structures here."
			/>
			<SectionHelpCard>{sectionHelpText.revenueModel}</SectionHelpCard>
			<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
				<Field label="Revenue Strategy">
					<select
						value={form.revenueModel.revenueStrategy}
						onChange={handleNestedChange('revenueModel', 'revenueStrategy')}
						className={inputClass('revenueModel.revenueStrategy')}
					>
						{selectOptions.revenueStrategy.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field label="% Market revenue">
					<input
						value={form.revenueModel.marketRevenuePct}
						onChange={handleNestedChange('revenueModel', 'marketRevenuePct')}
						className={inputClass('revenueModel.marketRevenuePct')}
					/>
				</Field>
				<Field label="% Contracted revenue">
					<input
						value={form.revenueModel.contractedRevenuePct}
						onChange={handleNestedChange(
							'revenueModel',
							'contractedRevenuePct',
						)}
						className={inputClass('revenueModel.contractedRevenuePct')}
					/>
					{renderError('revenueModel.revenueMix')}
				</Field>
				<Field
					label="Annual contracted revenue ($)"
					hint="Used by the return engine"
				>
					<input
						value={form.revenueModel.estimatedAnnualSavings}
						onChange={handleNestedChange(
							'revenueModel',
							'estimatedAnnualSavings',
						)}
						className={inputClass('revenueModel.estimatedAnnualSavings')}
					/>
				</Field>
				<Field
					label="Annual merchant revenue ($)"
					hint="Used by the return engine"
				>
					<input
						value={form.revenueModel.expectedAnnualMerchantRevenue}
						onChange={handleNestedChange(
							'revenueModel',
							'expectedAnnualMerchantRevenue',
						)}
						className={inputClass('revenueModel.expectedAnnualMerchantRevenue')}
					/>
				</Field>
				<Field label="Market Participation">
					<select
						value={form.revenueModel.marketParticipation}
						onChange={handleNestedChange('revenueModel', 'marketParticipation')}
						className={inputClass('revenueModel.marketParticipation')}
					>
						{selectOptions.marketParticipation.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Optimisation Responsibility">
					<select
						value={form.revenueModel.optimisationResponsibility}
						onChange={handleNestedChange(
							'revenueModel',
							'optimisationResponsibility',
						)}
						className={inputClass('revenueModel.optimisationResponsibility')}
					>
						{selectOptions.optimisationResponsibility.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Market Exposure">
					<select
						value={form.revenueModel.marketExposure}
						onChange={handleNestedChange('revenueModel', 'marketExposure')}
						className={inputClass('revenueModel.marketExposure')}
					>
						{selectOptions.marketExposure.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<div className="md:col-span-2 xl:col-span-3">
					<Field label="Primary Revenue Drivers">
						{renderGroupedMultiSelect(
							'revenueModel',
							'revenueDrivers',
							groupedMultiSelects.revenueDrivers,
						)}
						{renderError('revenueModel.revenueDrivers')}
					</Field>
				</div>
				<div className="md:col-span-2 xl:col-span-3">
					<Field label="Revenue Risk Management">
						{renderGroupedMultiSelect(
							'revenueModel',
							'revenueRiskManagement',
							groupedMultiSelects.revenueRiskManagement,
						)}
					</Field>
				</div>
				<div className="md:col-span-2 xl:col-span-3">
					<Field label="Market & Grid Drivers">
						{renderGroupedMultiSelect(
							'revenueModel',
							'marketGridDrivers',
							groupedMultiSelects.marketGridDrivers,
						)}
					</Field>
				</div>
			</div>
			{renderContinueButton()}
		</>
	);

	const renderCashflowAllocation = () => (
		<>
			<SectionHeader
				title="Cashflow Allocation"
				description="Show how project cashflows are shared between the project vehicle, site host, and service providers before investor returns are calculated."
			/>
			<SectionHelpCard>{sectionHelpText.cashflowAllocation}</SectionHelpCard>
			<div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-[#245985]">
				These inputs help determine how much project cashflow is available for
				investor distributions.
			</div>
			<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
				<Field
					label="SPV %"
					hint="Share of cashflow retained by the project vehicle before investor distributions."
				>
					<input
						value={form.cashflowAllocation.spvPct}
						onChange={handleNestedChange('cashflowAllocation', 'spvPct')}
						className={inputClass('cashflowAllocation.spvPct')}
					/>
				</Field>
				<Field
					label="Host %"
					hint="Share of cashflow paid to the site host, if applicable."
				>
					<input
						value={form.cashflowAllocation.hostPct}
						onChange={handleNestedChange('cashflowAllocation', 'hostPct')}
						className={inputClass('cashflowAllocation.hostPct')}
					/>
				</Field>
				<Field
					label="Operator / Aggregator %"
					hint="Share paid to the operator, optimiser, or aggregator for managing the asset."
				>
					<input
						value={form.cashflowAllocation.operatorAggregatorPct}
						onChange={handleNestedChange(
							'cashflowAllocation',
							'operatorAggregatorPct',
						)}
						className={inputClass('cashflowAllocation.operatorAggregatorPct')}
					/>
					{renderError('cashflowAllocation.split')}
				</Field>
				<Field
					label="Platform fee %"
					hint="RegenX or platform fee applied to the project."
				>
					<input
						value={form.cashflowAllocation.platformFeePct}
						onChange={handleNestedChange(
							'cashflowAllocation',
							'platformFeePct',
						)}
						className={inputClass('cashflowAllocation.platformFeePct')}
					/>
				</Field>
				<Field
					label="Operator fee %"
					hint="Additional fee paid to an operator or service provider."
				>
					<input
						value={form.cashflowAllocation.operatorFeePct}
						onChange={handleNestedChange(
							'cashflowAllocation',
							'operatorFeePct',
						)}
						className={inputClass('cashflowAllocation.operatorFeePct')}
					/>
				</Field>
				<Field
					label="Other fee %"
					hint="Any other recurring fee deducted from cashflow."
				>
					<input
						value={form.cashflowAllocation.otherFeePct}
						onChange={handleNestedChange('cashflowAllocation', 'otherFeePct')}
						className={inputClass('cashflowAllocation.otherFeePct')}
					/>
				</Field>
				<Field
					label="Annual Opex $"
					hint="Estimated yearly operating costs for the asset."
				>
					<input
						value={form.cashflowAllocation.annualOpex}
						onChange={handleNestedChange('cashflowAllocation', 'annualOpex')}
						className={inputClass('cashflowAllocation.annualOpex')}
					/>
				</Field>
				<Field
					label="Maintenance costs $"
					hint="Estimated yearly servicing, repairs, or replacement costs."
				>
					<input
						value={form.cashflowAllocation.maintenanceCosts}
						onChange={handleNestedChange(
							'cashflowAllocation',
							'maintenanceCosts',
						)}
						className={inputClass('cashflowAllocation.maintenanceCosts')}
					/>
				</Field>
			</div>
			{renderContinueButton()}
		</>
	);

	const renderStructuredRiskInputs = () => (
		<>
			<SectionHeader
				title="Risk Inputs"
				description="Provide key project details that help reviewers understand readiness, counterparties, and dependencies."
			/>
			<SectionHelpCard>{sectionHelpText.riskInputs}</SectionHelpCard>
			<div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
				<Field
					label="Primary Counterparty Name"
					hint="Name of the entity responsible for paying or supporting project revenue (for example: host site, energy retailer, or customer)."
				>
					<input
						value={form.risks.counterpartyName}
						onChange={handleNestedChange('risks', 'counterpartyName')}
						className={inputClass('risks.counterpartyName')}
					/>
					{renderError('risks.counterpartyName')}
				</Field>
				<Field
					label="Counterparty Type"
					hint="Select the type of organisation involved (for example: host customer, energy retailer, or market exposure)."
				>
					<select
						value={form.risks.counterpartyType}
						onChange={handleNestedChange('risks', 'counterpartyType')}
						className={inputClass('risks.counterpartyType')}
					>
						{selectOptions.counterpartyType.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field
					label="Role in Project"
					hint="Describe what the counterparty does (for example: pays for energy savings, provides fixed payments, or manages dispatch)."
				>
					<select
						value={form.risks.counterpartyRole}
						onChange={handleNestedChange('risks', 'counterpartyRole')}
						className={inputClass('risks.counterpartyRole')}
					>
						{selectOptions.counterpartyRole.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field
					label="Contract Status"
					hint="Current status of the commercial agreement (for example: signed, in negotiation, or not yet agreed)."
				>
					<select
						value={form.risks.contractStatus}
						onChange={handleNestedChange('risks', 'contractStatus')}
						className={inputClass('risks.contractStatus')}
					>
						{selectOptions.contractStatus.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field
					label="Site Secured"
					hint="Confirm whether the project site is secured or under agreement."
				>
					<select
						value={form.risks.siteSecured ? 'yes' : 'no'}
						onChange={(event) =>
							setForm((prev) => ({
								...prev,
								risks: {
									...prev.risks,
									siteSecured: event.target.value === 'yes',
								},
							}))
						}
						className={inputClass('risks.siteSecured')}
					>
						<option value="yes">Yes</option>
						<option value="no">No</option>
					</select>
				</Field>
				<Field
					label="Grid Connection"
					hint="Status of grid connection approvals or progress."
				>
					<select
						value={form.risks.riskGridConnectionStatus}
						onChange={handleNestedChange('risks', 'riskGridConnectionStatus')}
						className={inputClass('risks.riskGridConnectionStatus')}
					>
						{selectOptions.developmentStatus.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field label="Permits" hint="Status of required permits and approvals.">
					<select
						value={form.risks.permitsStatus}
						onChange={handleNestedChange('risks', 'permitsStatus')}
						className={inputClass('risks.permitsStatus')}
					>
						{selectOptions.developmentStatus.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field
					label="EPC Contractor"
					hint="Whether a contractor is engaged to deliver or install the project."
				>
					<select
						value={form.risks.epcContractorStatus}
						onChange={handleNestedChange('risks', 'epcContractorStatus')}
						className={inputClass('risks.epcContractorStatus')}
					>
						{selectOptions.epcContractorStatus.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<Field
					label="Data Confidence"
					hint="How reliable the inputs and assumptions are (for example: early estimates vs confirmed data)."
				>
					<select
						value={form.risks.dataConfidence}
						onChange={handleNestedChange('risks', 'dataConfidence')}
						className={inputClass('risks.dataConfidence')}
					>
						{selectOptions.dataConfidence.map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</Field>
				<div className="md:col-span-2 xl:col-span-3">
					<Field
						label="Operational Dependencies"
						hint="Select any external requirements the project depends on."
					>
						{renderGroupedMultiSelect(
							'risks',
							'operationalDependencies',
							groupedMultiSelects.operationalDependencies,
						)}
					</Field>
				</div>
				<div className="md:col-span-2 xl:col-span-3">
					<Field
						label="Key Risk Factors"
						hint="Select the main factors that could impact project performance."
					>
						{renderGroupedMultiSelect(
							'risks',
							'keyRiskFactors',
							groupedMultiSelects.keyRiskFactors,
						)}
					</Field>
				</div>
			</div>
			{renderContinueButton()}
		</>
	);

	const renderInvestmentStructure = () => {
		const repayment = form.investorStructure.repaymentStructure;
		return (
			<>
				<SectionHeader
					title="Investment Structure"
					description="Define how investors participate in project cashflows."
				/>
				<SectionHelpCard>{sectionHelpText.investmentStructure}</SectionHelpCard>
				<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
					<Field label="Structure Type">
						<select
							value={form.investorStructure.structureType}
							onChange={handleNestedChange(
								'investorStructure',
								'structureType',
							)}
							className={inputClass('investorStructure.structureType')}
						>
							{selectOptions.structureType.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</Field>
					<Field label="% allocated to investors">
						<input
							value={form.investorStructure.investorAllocationPct}
							onChange={handleNestedChange(
								'investorStructure',
								'investorAllocationPct',
							)}
							className={inputClass('investorStructure.investorAllocationPct')}
						/>
						{renderError('investorStructure.investorAllocationPct')}
					</Field>
					<Field label="Repayment Structure">
						<select
							value={repayment}
							onChange={handleNestedChange(
								'investorStructure',
								'repaymentStructure',
							)}
							className={inputClass('investorStructure.repaymentStructure')}
						>
							{selectOptions.repaymentStructure.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Distribution Frequency">
						<select
							value={form.investorStructure.distributionFrequency}
							onChange={handleNestedChange(
								'investorStructure',
								'distributionFrequency',
							)}
							className={inputClass('investorStructure.distributionFrequency')}
						>
							<option value="Monthly">Monthly</option>
							<option value="Quarterly">Quarterly</option>
						</select>
					</Field>
					<Field label="Return Type">
						<select
							value={form.investorStructure.returnType}
							onChange={handleNestedChange('investorStructure', 'returnType')}
							className={inputClass('investorStructure.returnType')}
						>
							{selectOptions.returnType.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Cashflow Basis">
						<select
							value={form.investorStructure.cashflowBasis}
							onChange={handleNestedChange(
								'investorStructure',
								'cashflowBasis',
							)}
							className={inputClass('investorStructure.cashflowBasis')}
						>
							{selectOptions.cashflowBasis.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Investor Priority">
						<select
							value={form.investorStructure.investorPriority}
							onChange={handleNestedChange(
								'investorStructure',
								'investorPriority',
							)}
							className={inputClass('investorStructure.investorPriority')}
						>
							{selectOptions.investorPriority.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Payment Timing">
						<select
							value={form.investorStructure.paymentTiming}
							onChange={handleNestedChange(
								'investorStructure',
								'paymentTiming',
							)}
							className={inputClass('investorStructure.paymentTiming')}
						>
							{selectOptions.paymentTiming.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</Field>
					{repayment === 'fixed_term' ? (
						<Field label="Investment term years">
							<input
								value={form.investorStructure.investmentTermYears}
								onChange={handleNestedChange(
									'investorStructure',
									'investmentTermYears',
								)}
								className={inputClass('investorStructure.investmentTermYears')}
							/>
							{renderError('investorStructure.investmentTermYears')}
						</Field>
					) : null}
					{repayment === 'target_multiple' || repayment === 'hybrid' ? (
						<Field label="Target return multiple">
							<input
								value={form.investorStructure.targetReturnMultiple}
								onChange={handleNestedChange(
									'investorStructure',
									'targetReturnMultiple',
								)}
								className={inputClass('investorStructure.targetReturnMultiple')}
							/>
							{renderError('investorStructure.targetReturnMultiple')}
						</Field>
					) : null}
					{repayment === 'hybrid' ? (
						<Field label="Minimum term">
							<input
								value={form.investorStructure.minimumTermYears}
								onChange={handleNestedChange(
									'investorStructure',
									'minimumTermYears',
								)}
								className={inputClass('investorStructure.minimumTermYears')}
							/>
							{renderError('investorStructure.minimumTermYears')}
						</Field>
					) : null}
				</div>
				<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
					<Field label="Projected yield">
						{renderReadOnlyValue(
							returnComputed.projectedYieldPct.toFixed(2),
							'',
							'%',
						)}
					</Field>
					<Field label="Implied IRR">
						{renderReadOnlyValue(
							returnComputed.impliedIrrPct.toFixed(2),
							'',
							'%',
						)}
					</Field>
					{repayment === 'fixed_term' ? (
						<Field label="Implied return multiple">
							{renderReadOnlyValue(
								returnComputed.impliedMultiple.toFixed(2),
								'',
								'x',
							)}
						</Field>
					) : null}
					{repayment !== 'fixed_term' ? (
						<Field label="Estimated payback period">
							{renderReadOnlyValue(
								returnComputed.estimatedPaybackYears.toFixed(2),
								'',
								' yrs',
							)}
						</Field>
					) : null}
					{repayment !== 'fixed_term' ? (
						<Field label="Total distributions required">
							{renderReadOnlyValue(
								formatCurrency(returnComputed.totalDistributionsRequired),
								'$',
							)}
						</Field>
					) : null}
					{repayment === 'hybrid' ? (
						<Field label="Exit condition">
							{renderReadOnlyValue(
								'Target multiple achieved after minimum term, subject to final legal documentation',
							)}
						</Field>
					) : null}
				</div>
				{renderContinueButton()}
			</>
		);
	};

	const renderCapitalRaisingIssuance = () => (
		<>
			<SectionHeader
				title="Capital Raising & Issuance"
				description="Set the capital raise terms and how investor units are issued."
			/>
			<SectionHelpCard>{sectionHelpText.tokenStructure}</SectionHelpCard>
			<div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
				<Field
					label="Total capital required"
					hint="Total project cost before RegenX platform fees."
				>
					{renderReadOnlyValue(formatCurrency(totalProjectCapexValue), '$')}
				</Field>
				<Field
					label="Total capital raise"
					hint="Total amount to be raised from investors."
				>
					{renderReadOnlyValue(formatCurrency(totalCapitalRaiseValue), '$')}
				</Field>
				<Field
					label="Price per Unit"
					hint="Unit issue price. Default is $1.00."
				>
					<input
						value={form.tokenStructure.pricePerToken}
						onChange={handleNestedChange('tokenStructure', 'pricePerToken')}
						className={inputClass('tokenStructure.pricePerToken')}
					/>
				</Field>
				<Field
					label="Token Symbol"
					hint="Automatically generated from project type. You can customise it if required. Auto-generated example: BAT01, SOL01, or BAS01."
				>
					<input
						maxLength={5}
						value={form.tokenStructure.tokenSymbol}
						onChange={(event) => {
							setTokenSymbolManuallyEdited(true);
							setForm((prev) => ({
								...prev,
								tokenStructure: {
									...prev.tokenStructure,
									tokenSymbol: event.target.value
										.toUpperCase()
										.replace(/[^A-Z0-9]/g, '')
										.slice(0, 5),
								},
							}));
						}}
						className={inputClass('tokenStructure.tokenSymbol')}
					/>
					{renderError('tokenStructure.tokenSymbol')}
				</Field>
				<Field
					label="Total units issued"
					hint="Calculated automatically from total capital raise divided by price per unit."
				>
					{renderReadOnlyValue(
						Math.round(issuanceComputed.totalUnitsIssued).toLocaleString(),
					)}
				</Field>
				<Field
					label="Units available to investors"
					hint="Calculated automatically from total units and investor allocation."
				>
					{renderReadOnlyValue(
						Math.round(
							issuanceComputed.unitsAvailableToInvestors,
						).toLocaleString(),
					)}
				</Field>
				<Field
					label="Minimum investment $"
					hint="Minimum amount an investor can commit."
				>
					<input
						value={form.capitalStructure.minimumInvestment}
						onChange={handleMinimumInvestmentChange}
						className={inputClass('capitalStructure.minimumInvestment')}
					/>
					{renderError('capitalStructure.minimumInvestment')}
				</Field>
				<Field
					label="Units per minimum investment"
					hint="Calculated automatically from minimum investment divided by price per unit."
				>
					{renderReadOnlyValue(
						Math.round(issuanceComputed.unitsPerMinimum).toLocaleString(),
					)}
				</Field>
				<Field
					label="Distribution Method"
					hint="Method used to pay investor distributions."
				>
					<select
						value={form.tokenStructure.distributionMethod}
						onChange={handleNestedChange(
							'tokenStructure',
							'distributionMethod',
						)}
						className={inputClass('tokenStructure.distributionMethod')}
					>
						<option value="On-chain payout">On-chain payout</option>
					</select>
				</Field>
				<Field
					label="Lock-up period months"
					hint="Period before units can be transferred, if applicable."
				>
					<input
						inputMode="numeric"
						value={form.tokenStructure.lockupPeriod}
						onChange={handleNestedChange('tokenStructure', 'lockupPeriod')}
						className={inputClass('tokenStructure.lockupPeriod')}
					/>
					{renderError('tokenStructure.lockupPeriod')}
				</Field>
				<div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-6">
					<label className="max-w-[420px] text-sm text-[#111827]">
						<span className="inline-flex items-center gap-3 font-semibold">
							<input
								type="checkbox"
								checked={form.tokenStructure.secondaryTradingEnabled}
								onChange={handleCheckboxChange(
									'tokenStructure',
									'secondaryTradingEnabled',
								)}
							/>
							Secondary trading enabled
						</span>
						<span className="mt-1 block text-xs leading-5 text-slate-500">
							Allow approved secondary transfers if platform rules permit.
						</span>
					</label>
					<label className="max-w-[420px] text-sm text-[#111827]">
						<span className="inline-flex items-center gap-3 font-semibold">
							<input
								type="checkbox"
								checked={form.tokenStructure.walletRequired}
								onChange={handleCheckboxChange(
									'tokenStructure',
									'walletRequired',
								)}
							/>
							Wallet required
						</span>
						<span className="mt-1 block text-xs leading-5 text-slate-500">
							Indicates whether a wallet is required for ownership records or
							on-chain distributions.
						</span>
					</label>
				</div>
				<div className="md:col-span-2 xl:col-span-3">
					<Field
						label="Transfer restrictions"
						hint="Describe any eligibility, approval, or transfer limits."
					>
						<textarea
							value={form.tokenStructure.transferRestrictions}
							onChange={handleNestedChange(
								'tokenStructure',
								'transferRestrictions',
							)}
							className={textareaClass}
						/>
					</Field>
				</div>
			</div>
			{renderContinueButton()}
		</>
	);

	const renderRpaReviewSubmit = () => (
		<>
			<SectionHeader
				title="Revenue Participation Agreement Review & Submit"
				description="Review the generated Revenue Participation Agreement Summary and submit the project for admin review."
			/>
			<SectionHelpCard>{sectionHelpText.rpaReviewSubmit}</SectionHelpCard>
			<div className="mt-8 space-y-6">
				<SectionCard>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h3 className="text-xl font-semibold text-[#111827]">
								Generated RPA preview
							</h3>
							<p className="mt-2 text-sm leading-6 text-[#5F6C86]">
								Read-only summary generated from backend project data.
							</p>
						</div>
						<button
							type="button"
							onClick={persistDraftToBackend}
							disabled={isSavingDraft || isLoadingRpaSummary}
							className="rounded-[12px] border border-[#D7DEEA] bg-white px-4 py-2 text-sm font-semibold text-[#123DA8] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{backendProjectId
								? 'Refresh generated summary'
								: 'Save and generate summary'}
						</button>
						<button
							type="button"
							onClick={() => setIsRpaModalOpen(true)}
							disabled={!rpaSummary || isLoadingRpaSummary}
							className="rounded-[12px] bg-[#123DA8] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
						>
							Open read-only preview
						</button>
					</div>
					<div className="mt-5">
						<RevenueParticipationAgreementContent
							summary={rpaSummary}
							isLoading={isLoadingRpaSummary}
							error={rpaSummaryError}
						/>
					</div>
				</SectionCard>
				<SectionCard>
					<h3 className="text-xl font-semibold text-[#111827]">
						Calculated return outputs
					</h3>
					<div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
						<Field label="Projected yield">
							{renderReadOnlyValue(
								returnComputed.projectedYieldPct.toFixed(2),
								'',
								'%',
							)}
						</Field>
						<Field label="Implied IRR">
							{renderReadOnlyValue(
								returnComputed.impliedIrrPct.toFixed(2),
								'',
								'%',
							)}
						</Field>
						<Field label="Implied multiple">
							{renderReadOnlyValue(
								returnComputed.impliedMultiple.toFixed(2),
								'',
								'x',
							)}
						</Field>
						<Field label="Annual net cashflow">
							{renderReadOnlyValue(
								formatCurrency(returnComputed.investorAnnualCashflow),
								'$',
							)}
						</Field>
						<Field label="Estimated periodic distribution">
							{renderReadOnlyValue(
								formatCurrency(returnComputed.periodic),
								'$',
							)}
						</Field>
						<Field label="Estimated payback period">
							{renderReadOnlyValue(
								returnComputed.estimatedPaybackYears.toFixed(2),
								'',
								' yrs',
							)}
						</Field>
					</div>
				</SectionCard>
				<label className="flex items-start gap-3 rounded-2xl border border-[#D6E4F0] bg-[#F8FBFF] p-4">
					<input
						type="checkbox"
						checked={form.agreement.developerDeclarationAccepted}
						onChange={handleCheckboxChange(
							'agreement',
							'developerDeclarationAccepted',
						)}
						className="mt-1 h-5 w-5"
					/>
					<span className="text-sm leading-6 text-[#374151]">
						I confirm all information provided is accurate, complete, and not
						misleading.
					</span>
				</label>
				{renderError('agreement.developerDeclarationAccepted')}
			</div>
			<RevenueParticipationAgreementModal
				isOpen={isRpaModalOpen}
				onClose={() => setIsRpaModalOpen(false)}
				summary={rpaSummary}
				isLoading={isLoadingRpaSummary}
				error={rpaSummaryError}
			/>
			{renderContinueButton()}
		</>
	);

	const renderActiveSection = () => {
		switch (activeKey) {
			case 'projectBasics':
				return renderProjectBasics();
			case 'assetModule':
				return renderAssetModule();
			case 'capitalStructure':
				return renderCapitalStructure();
			case 'energyGridConfiguration':
				return renderEnergyGridConfiguration();
			case 'revenueModel':
				return renderStructuredRevenue();
			case 'cashflowAllocation':
				return renderCashflowAllocation();
			case 'riskInputs':
				return renderStructuredRiskInputs();
			case 'documents':
				return renderDocuments();
			case 'investmentStructure':
				return renderInvestmentStructure();
			case 'tokenStructure':
				return renderCapitalRaisingIssuance();
			case 'rpaReviewSubmit':
				return renderRpaReviewSubmit();
			default:
				return renderProjectBasics();
		}
	};

	return (
		<div
			className={
				embedded ? 'w-full' : 'theme-page-shell w-full px-4 py-6 md:px-6'
			}
		>
			<div className="w-full">
				{!embedded ? (
					<AdminPageHeader
						eyebrow="Climate Developer Portal"
						title="Climate Project Readiness"
						description="Complete the project onboarding steps before submitting for approval."
					/>
				) : null}
				{!isHydrated ? (
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
						<p className="text-sm text-[#64748B]">Loading project data...</p>
					</div>
				) : (
					<div
						className={
							embedded
								? 'grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-8'
								: 'grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]'
						}
					>
						<aside className="space-y-4 self-start xl:sticky xl:top-6">
							<div className="rounded-[28px] border border-[#E2E8F0] bg-white p-5 shadow-sm lg:p-6">
								<div className="space-y-3">
									{workflowItems.map((item, index) => {
										const status = workflowStatus[item.key];
										const isActive = activeKey === item.key;
										return (
											<button
												key={item.key}
												type="button"
												onClick={() => setActiveKey(item.key)}
												className="flex w-full items-start gap-3 rounded-xl px-1 py-2 text-left transition hover:bg-[#F8FAFC]"
											>
												<div
													className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
														isActive || status === 'Completed'
															? 'bg-[#0F766E] text-white border-[#0F766E]'
															: 'bg-white text-[#6B7280] border-[#E5E7EB]'
													}`}
												>
													{index + 1}
												</div>
												<div>
													<div className="text-sm font-semibold text-[#0F172A]">
														{item.title}
													</div>
													<div className="text-xs text-[#94A3B8]">
														{item.description}
													</div>
												</div>
											</button>
										);
									})}
								</div>
							</div>
						</aside>
						<main className="min-w-0">
							{embedded ? (
								<div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
									{showLifecycleStatus ? (
										<div className="xl:col-span-4">
											<ProjectLifecycleStatusCard
												project={projectMeta}
												readonly={isReadOnly}
												showHelperText
												title="Approval Lifecycle"
											/>
										</div>
									) : null}
									<div
										className={
											showLifecycleStatus ? 'xl:col-span-8' : 'xl:col-span-12'
										}
									>
										<div
											className={
												isReadOnly ? 'pointer-events-none opacity-60' : ''
											}
										>
											<SectionCard>{renderActiveSection()}</SectionCard>
										</div>
									</div>
								</div>
							) : (
								<>
									{showLifecycleStatus ? (
										<div className="mb-4">
											<ProjectLifecycleStatusCard
												project={projectMeta}
												readonly={isReadOnly}
												showHelperText
												title="Approval Lifecycle"
											/>
										</div>
									) : null}
									<div
										className={
											isReadOnly ? 'pointer-events-none opacity-60' : ''
										}
									>
										<SectionCard>{renderActiveSection()}</SectionCard>
									</div>
								</>
							)}
						</main>
					</div>
				)}
			</div>
		</div>
	);
}
