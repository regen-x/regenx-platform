import {
	DseType,
	formatCurrency,
	formatPercent,
	formatPlain,
	formatTermYears,
	normalizeDseType,
	toNumber,
} from '@/utils/dse';

type AnyObject = Record<string, any>;

const JUNK_VALUES = new Set([
	'',
	'test',
	'n/a',
	'na',
	'none',
	'null',
	'undefined',
	'not provided',
	'tbd',
	'-',
]);

export function cleanText(value: unknown): string {
	const text = String(value || '').trim();
	if (!text) return '';
	if (JUNK_VALUES.has(text.toLowerCase())) return '';
	return text;
}

export function firstClean(...values: unknown[]) {
	for (const value of values) {
		const cleaned = cleanText(value);
		if (cleaned) return cleaned;
	}
	return '';
}

export function cleanNumber(value: unknown): number {
	const amount = toNumber(value);
	return amount > 0 ? amount : 0;
}

export function getProjectPayload(project: AnyObject) {
	return project?.payloadJson || {};
}

export function getDisplayDseType(project: AnyObject): DseType {
	const payload = getProjectPayload(project);

	return normalizeDseType(
		project?.dseType ||
			project?.dse_type ||
			project?.stage ||
			payload?.dseType ||
			payload?.dse_type ||
			payload?.stage,
	);
}

export function getDisplayName(project: AnyObject) {
	return firstClean(project?.name, 'Untitled Opportunity');
}

export function getDisplayLocation(project: AnyObject) {
	const payload = getProjectPayload(project);

	return firstClean(
		project?.location,
		payload?.location,
		payload?.siteAddress,
		'Australia',
	);
}

export function getDisplayImage(project: AnyObject) {
	const payload = getProjectPayload(project);

	return firstClean(
		project?.thumbnailUrl,
		project?.thumbnail_url,
		project?.thumbnailImageUrl,
		payload?.thumbnailUrl,
		payload?.thumbnail_url,
		payload?.thumbnailImageUrl,
		'/images/eliot.jpg',
	);
}

export function getDisplaySummary(project: AnyObject, dseType?: DseType) {
	const payload = getProjectPayload(project);
	const resolvedType = dseType || getDisplayDseType(project);

	const summary = firstClean(
		project?.investmentSummary,
		project?.description,
		payload?.investmentSummary,
	);

	if (summary) return summary;

	if (resolvedType === 'Operating') {
		return 'Revenue-generating clean energy asset with active cashflow profile.';
	}

	if (resolvedType === 'Construction') {
		return 'Committed project in build phase with staged capital deployment.';
	}

	return 'Early stage project progressing toward financial close.';
}

export function getDisplayMinimumInvestment(project: AnyObject) {
	const payload = getProjectPayload(project);
	return cleanNumber(
		project?.minimumInvestment ||
			project?.minimum_investment ||
			payload?.minimumInvestment ||
			payload?.capitalStructure?.minimumInvestment,
	);
}

export function getDisplayFundingGoal(project: AnyObject) {
	const payload = getProjectPayload(project);
	return cleanNumber(
		project?.fundingGoal ||
			project?.funding_goal ||
			payload?.fundingGoal ||
			payload?.capitalStructure?.fundingGoal,
	);
}

export function getDisplayTargetIrr(project: AnyObject) {
	const payload = getProjectPayload(project);
	return cleanNumber(
		project?.targetIrr ||
			project?.targetIRR ||
			payload?.targetIrr ||
			payload?.targetIRR ||
			payload?.investorStructure?.targetIrrExpectation,
	);
}

export function getDisplayTargetYield(project: AnyObject) {
	const payload = getProjectPayload(project);
	return cleanNumber(
		project?.targetAnnualYield ||
			project?.target_annual_yield ||
			payload?.targetAnnualYield ||
			payload?.investorStructure?.targetAnnualYieldExpectation,
	);
}

export function getDisplayInvestmentTerm(project: AnyObject) {
	const payload = getProjectPayload(project);
	return cleanNumber(
		project?.investmentTermYears ||
			project?.investment_term_years ||
			payload?.investmentTermYears ||
			payload?.investorStructure?.maximumTermYears,
	);
}

export function getDisplayBuildStage(project: AnyObject) {
	const payload = getProjectPayload(project);
	return firstClean(
		project?.buildStage,
		payload?.buildStage,
		payload?.constructionStage,
	);
}

export function getDisplayExpectedOps(project: AnyObject) {
	const payload = getProjectPayload(project);
	return firstClean(
		project?.expectedOperationalDate,
		payload?.expectedOperationalDate,
		payload?.codDate,
		payload?.commercialOperationDate,
	);
}

export function getDisplayRevenueItems(project: AnyObject) {
	const payload = getProjectPayload(project);
	const revenue = project?.revenueModel || payload?.revenueModel || {};

	return [
		firstClean(revenue?.revenueModelType) &&
			`Revenue model: ${firstClean(revenue?.revenueModelType)}`,
		firstClean(revenue?.agreementType) &&
			`Agreement type: ${firstClean(revenue?.agreementType)}`,
		firstClean(revenue?.primaryCounterparty) &&
			`Counterparty: ${firstClean(revenue?.primaryCounterparty)}`,
		firstClean(revenue?.contractLengthYears) &&
			`Contract term: ${firstClean(revenue?.contractLengthYears)} years`,
		firstClean(revenue?.paymentFrequency) &&
			`Distribution cadence: ${firstClean(revenue?.paymentFrequency)}`,
	].filter(Boolean) as string[];
}

export function getDisplayRiskItems(project: AnyObject) {
	const payload = getProjectPayload(project);
	const risks = project?.risks || payload?.risks || {};

	return [
		firstClean(risks?.marketRiskLevel) &&
			`Market risk: ${firstClean(risks?.marketRiskLevel)}`,
		firstClean(risks?.counterpartyRiskLevel) &&
			`Counterparty risk: ${firstClean(risks?.counterpartyRiskLevel)}`,
		firstClean(risks?.technologyRiskLevel) &&
			`Technology risk: ${firstClean(risks?.technologyRiskLevel)}`,
		firstClean(risks?.riskMitigants) &&
			`Mitigants: ${firstClean(risks?.riskMitigants)}`,
	].filter(Boolean) as string[];
}

export function getOpportunityMetricSet(project: AnyObject) {
	const dseType = getDisplayDseType(project);

	if (dseType === 'Operating') {
		return [
			{
				label: 'Target Yield',
				value: formatPercent(getDisplayTargetYield(project)),
			},
			{
				label: 'Target IRR',
				value: formatPercent(getDisplayTargetIrr(project)),
			},
			{
				label: 'Term',
				value: formatTermYears(getDisplayInvestmentTerm(project)),
			},
		];
	}

	if (dseType === 'Construction') {
		return [
			{
				label: 'Funding Goal',
				value: formatCurrency(getDisplayFundingGoal(project)),
			},
			{
				label: 'Build Stage',
				value: formatPlain(getDisplayBuildStage(project)),
			},
			{
				label: 'Expected Ops',
				value: formatPlain(getDisplayExpectedOps(project)),
			},
		];
	}

	return [
		{
			label: 'Funding Goal',
			value: formatCurrency(getDisplayFundingGoal(project)),
		},
		{
			label: 'Current Stage',
			value: 'Development',
		},
		{
			label: 'Min Investment',
			value: formatCurrency(getDisplayMinimumInvestment(project)),
		},
	];
}

export function getDisplayProjectType(project: AnyObject) {
	const payload = getProjectPayload(project);
	return firstClean(
		project?.projectType,
		payload?.projectType,
		'Climate Infrastructure Asset',
	);
}
