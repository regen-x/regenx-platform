export type ProjectFileAsset = {
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

export interface IProject {
	id?: string;
	uuid?: string;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;

	name?: string;
	description?: string;
	location?: string;
	fundingGoal?: number;
	fundedSoFar?: number;
	amountSettled?: number;
	investorCount?: number;
	unitsSold?: number;
	unitsRemaining?: number;
	startDate?: string;
	endDate?: string;
	climateImpact?: string;
	tokenSupply?: number;
	tokenPrice?: number;
	tokenAddress?: string;
	spvId?: number;
	sponsorEntityId?: number;
	seriesId?: number;
	custodyMode?: 'self_custody' | 'regenx_custody';
	developerWalletAddress?: string;
	issuerWalletPublic?: string;
	distributorWalletPublic?: string;
	proceedsWalletAddress?: string;
	issuer?: string | null;
	assetCode?: string;
	assetIssuer?: string;
	issuedSupply?: string;
	issuanceStatus?: 'not_started' | 'pending' | 'completed' | 'failed';
	issuanceTxHash?: string;
	issuanceFailureReason?: string;
	issuanceFailurePayload?: Record<string, unknown>;
	issuanceInitiatedBy?: number;
	walletConfigLockedAt?: string | null;
	walletConfigLockedReason?: string | null;
	walletLastUpdatedAt?: string | null;
	walletLastUpdatedBy?: number;
	tokenSymbol?: string;
	thumbnailUrl?: string;
	thumbnailFile?: ProjectFileAsset;
	projectFiles?: ProjectFileAsset[];
	ownerAddress?: string;
	generatesCarbonCredits: boolean;

	projectType?: string;
	dseType?: string;
	stage?: string;
	jurisdiction?: string;
	minimumInvestment?: string;
	totalProjectCapex?: string;
	targetIrr?: string;
	targetAnnualYield?: string;
	investmentTermYears?: string;
	investmentSummary?: string;

	payloadJson?: Record<string, unknown>;
	draftPayload?: Record<string, unknown>;
	workflowStatusJson?: Record<string, unknown>;
	completedCount?: number;
	totalSections?: number;
	adminNotes?: string;
	agreementAccepted?: boolean;
	agreementAcceptedAt?: string | null;
	agreementVersion?: string;
	status?:
		| 'draft'
		| 'under_review'
		| 'changes_requested'
		| 'approved'
		| 'issued'
		| 'live'
		| 'locked';
	submittedAt?: string | null;
	approvedAt?: string | null;
	issuedAt?: string | null;
	liveAt?: string | null;
	rejectedAt?: string | null;
	lockedAt?: string | null;
	lockReason?: string | null;
	lastReviewedAt?: string | null;

	purchasedAmount?: number;
	percentFunded?: number;
	remainingSupply?: number;
}
