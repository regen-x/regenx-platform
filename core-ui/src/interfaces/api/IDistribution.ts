export type DistributionType =
	| 'DISTRIBUTION'
	| 'INTEREST'
	| 'RETURN_OF_CAPITAL'
	| 'FEE_ADJUSTMENT';

export type DistributionStatus = 'PENDING' | 'SCHEDULED' | 'PAID' | 'FAILED';

export interface IDistribution {
	id: number;
	uuid?: string;
	projectId: number;
	userId: number;
	ownershipId?: number | null;
	type: DistributionType;
	grossAmount: number;
	feeAmount?: number | null;
	netAmount: number;
	currency: string;
	periodStart?: string | null;
	periodEnd?: string | null;
	distributionDate?: string | null;
	status: DistributionStatus;
	reference?: string | null;
	notes?: string | null;
	createdAt: string;
	projectName?: string | null;
	tokenSymbol?: string | null;
}

export interface IDistributionProjectSummary {
	projectId: number;
	projectName?: string | null;
	tokenSymbol?: string | null;
	totalIncomeReceived: number;
	pendingIncome: number;
	trailing12MonthIncome: number;
	latestDistributionDate?: string | null;
	nextExpectedDistributionDate?: string | null;
	estimatedYield?: number | null;
	investedCapital?: number;
}

export interface IDistributionSummary {
	totalIncomeReceived: number;
	pendingIncome: number;
	trailing12MonthIncome: number;
	currentYieldEstimate?: number | null;
	averageYieldAcrossHoldings?: number | null;
	nextExpectedDistributionDate?: string | null;
	lastDistribution?: IDistribution | null;
	byProject: IDistributionProjectSummary[];
	portfolioEstimatedValue?: number | null;
	investedCapital?: number;
	yieldMethod?: string;
}
