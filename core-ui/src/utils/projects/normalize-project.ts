import { IProject } from '@/interfaces/api/IProject';

type AnyRecord = Record<string, any>;

const asRecord = (value: unknown): AnyRecord => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return value as AnyRecord;
};

const firstDefined = <T>(...values: T[]): T | undefined => {
	for (const value of values) {
		if (value !== undefined && value !== null && value !== '') return value;
	}
	return undefined;
};

const toNumber = (value: unknown): number => {
	const parsed = Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatus = (status?: string): IProject['status'] => {
	const raw = String(status ?? 'draft')
		.trim()
		.toLowerCase();
	if (raw === 'token_issued') return 'issued';

	const allowed: IProject['status'][] = [
		'draft',
		'under_review',
		'changes_requested',
		'approved',
		'issued',
		'live',
		'locked',
	];

	return allowed.includes(raw as IProject['status'])
		? (raw as IProject['status'])
		: 'draft';
};

const extractRawProject = (value: unknown): AnyRecord => {
	const root = asRecord(value);
	if (Object.keys(root).length === 0) return {};

	if (root.data && !Array.isArray(root.data)) {
		const data = asRecord(root.data);
		const attributes = asRecord(data.attributes);
		if (Object.keys(attributes).length > 0) {
			return {
				id: data.id ?? attributes.id,
				...attributes,
			};
		}

		return data;
	}

	return root;
};

export const normalizeProject = (value: unknown): IProject => {
	const raw = extractRawProject(value);
	const payloadJson = asRecord(
		firstDefined(
			raw.payloadJson,
			raw.payload_json,
			raw.payload,
			raw.draftPayload,
		),
	);
	const draftPayload = asRecord(
		firstDefined(raw.draftPayload, raw.draft_payload, payloadJson),
	);
	const workflowStatusJson = asRecord(
		firstDefined(
			raw.workflowStatusJson,
			raw.workflow_status_json,
			raw.workflowStatus,
		),
	);

	const fundingGoal = toNumber(
		firstDefined(
			raw.fundingGoal,
			raw.totalProjectCapex,
			payloadJson.fundingGoal,
			payloadJson.capitalStructure?.fundingGoal,
			payloadJson.capitalStructure?.totalProjectCapex,
		),
	);
	const fundedSoFar = toNumber(
		firstDefined(
			raw.amountSettled,
			raw.fundedSoFar,
			raw.amountRaised,
			raw.raisedAmount,
			raw.raisedSoFar,
			payloadJson.fundedSoFar,
			payloadJson.amountRaised,
			payloadJson.raisedAmount,
			payloadJson.raisedSoFar,
		),
	);
	const investorCount = toNumber(
		firstDefined(raw.investorCount, payloadJson.investorCount),
	);
	const tokenSupply = toNumber(
		firstDefined(
			raw.tokenSupply,
			payloadJson.tokenSupply,
			payloadJson.tokenStructure?.totalTokenSupply,
		),
	);
	const purchasedAmount = toNumber(
		firstDefined(raw.unitsSold, raw.purchasedAmount),
	);
	const unitsRemaining = toNumber(
		firstDefined(
			raw.unitsRemaining,
			raw.remainingSupply,
			Math.max(tokenSupply - purchasedAmount, 0),
		),
	);
	const projectFiles = Array.isArray(raw.projectFiles)
		? raw.projectFiles.map((file) => ({
				id: String(firstDefined(file?.id, '')),
				category: String(firstDefined(file?.category, '')),
				purpose: String(firstDefined(file?.purpose, '')),
				documentKey: (firstDefined(file?.documentKey, null) ?? null) as
					| string
					| null,
				storageKey: String(firstDefined(file?.storageKey, '')),
				originalFilename: String(firstDefined(file?.originalFilename, '')),
				mimeType: String(firstDefined(file?.mimeType, '')),
				fileSize:
					toNumber(firstDefined(file?.fileSize, 0)) ||
					(firstDefined(file?.fileSize, null) as number | null),
				uploadedBy:
					toNumber(firstDefined(file?.uploadedBy, 0)) ||
					(firstDefined(file?.uploadedBy, null) as number | null),
				uploadedAt: String(firstDefined(file?.uploadedAt, '')),
				url: firstDefined(file?.url) as string | undefined,
		  }))
		: [];
	const thumbnailFile =
		(asRecord(firstDefined(raw.thumbnailFile, null)) as any) || null;
	const normalizedThumbnailFile = thumbnailFile
		? {
				id: String(firstDefined(thumbnailFile.id, '')),
				category: String(firstDefined(thumbnailFile.category, '')),
				purpose: String(firstDefined(thumbnailFile.purpose, '')),
				documentKey: (firstDefined(thumbnailFile.documentKey, null) ?? null) as
					| string
					| null,
				storageKey: String(firstDefined(thumbnailFile.storageKey, '')),
				originalFilename: String(
					firstDefined(thumbnailFile.originalFilename, ''),
				),
				mimeType: String(firstDefined(thumbnailFile.mimeType, '')),
				fileSize:
					toNumber(firstDefined(thumbnailFile.fileSize, 0)) ||
					(firstDefined(thumbnailFile.fileSize, null) as number | null),
				uploadedBy:
					toNumber(firstDefined(thumbnailFile.uploadedBy, 0)) ||
					(firstDefined(thumbnailFile.uploadedBy, null) as number | null),
				uploadedAt: String(firstDefined(thumbnailFile.uploadedAt, '')),
				url: firstDefined(thumbnailFile.url) as string | undefined,
		  }
		: undefined;

	return {
		id: String(firstDefined(raw.id, raw.uuid, '') ?? ''),
		uuid: raw.uuid ? String(raw.uuid) : undefined,
		createdAt: String(firstDefined(raw.createdAt, '') ?? ''),
		updatedAt: String(firstDefined(raw.updatedAt, '') ?? ''),
		deletedAt: firstDefined(raw.deletedAt, null) as string | null | undefined,
		name: String(
			firstDefined(raw.name, payloadJson.projectName, 'Untitled Project'),
		),
		description: String(
			firstDefined(
				raw.description,
				raw.investmentSummary,
				payloadJson.description,
				payloadJson.investmentSummary,
				'',
			),
		),
		location: String(
			firstDefined(
				raw.location,
				payloadJson.location,
				payloadJson.siteAddress,
				payloadJson.fullAddress,
				'',
			),
		),
		fundingGoal,
		fundedSoFar,
		amountSettled: fundedSoFar,
		investorCount,
		unitsSold: purchasedAmount,
		unitsRemaining,
		startDate: firstDefined(raw.startDate) as string | undefined,
		endDate: firstDefined(raw.endDate) as string | undefined,
		climateImpact: firstDefined(raw.climateImpact) as string | undefined,
		tokenSupply,
		tokenPrice: toNumber(firstDefined(raw.tokenPrice, payloadJson.tokenPrice)),
		tokenAddress: firstDefined(raw.tokenAddress) as string | undefined,
		spvId: toNumber(firstDefined(raw.spvId, payloadJson.spvId)) || undefined,
		sponsorEntityId:
			toNumber(
				firstDefined(raw.sponsorEntityId, payloadJson.sponsorEntityId),
			) || undefined,
		seriesId:
			toNumber(
				firstDefined(raw.seriesId, payloadJson.seriesId, raw.series_id),
			) || undefined,
		custodyMode: firstDefined(
			raw.custodyMode,
			payloadJson.custodyMode,
		) as IProject['custodyMode'],
		developerWalletAddress: firstDefined(
			raw.developerWalletAddress,
			payloadJson.developerWalletAddress,
		) as string | undefined,
		issuerWalletPublic: firstDefined(
			raw.issuerWalletPublic,
			payloadJson.issuerWalletPublic,
		) as string | undefined,
		distributorWalletPublic: firstDefined(
			raw.distributorWalletPublic,
			payloadJson.distributorWalletPublic,
		) as string | undefined,
		proceedsWalletAddress: firstDefined(
			raw.proceedsWalletAddress,
			payloadJson.proceedsWalletAddress,
		) as string | undefined,
		assetCode: firstDefined(
			raw.assetCode,
			payloadJson.assetCode,
			raw.tokenSymbol,
			payloadJson.tokenSymbol,
		) as string | undefined,
		assetIssuer: firstDefined(
			raw.assetIssuer,
			payloadJson.assetIssuer,
			raw.issuerWalletPublic,
			payloadJson.issuerWalletPublic,
		) as string | undefined,
		issuedSupply: firstDefined(raw.issuedSupply, payloadJson.issuedSupply) as
			| string
			| undefined,
		issuanceStatus: firstDefined(
			raw.issuanceStatus,
			payloadJson.issuanceStatus,
			'not_started',
		) as IProject['issuanceStatus'],
		issuanceTxHash: firstDefined(
			raw.issuanceTxHash,
			payloadJson.issuanceTxHash,
		) as string | undefined,
		issuanceFailureReason: firstDefined(
			raw.issuanceFailureReason,
			payloadJson.issuanceFailureReason,
		) as string | undefined,
		issuanceFailurePayload: asRecord(
			firstDefined(
				raw.issuanceFailurePayload,
				payloadJson.issuanceFailurePayload,
			),
		),
		issuanceInitiatedBy:
			toNumber(
				firstDefined(raw.issuanceInitiatedBy, payloadJson.issuanceInitiatedBy),
			) || undefined,
		walletConfigLockedAt: (firstDefined(raw.walletConfigLockedAt, null) ??
			null) as string | null,
		walletConfigLockedReason: (firstDefined(
			raw.walletConfigLockedReason,
			null,
		) ?? null) as string | null,
		walletLastUpdatedAt: (firstDefined(raw.walletLastUpdatedAt, null) ??
			null) as string | null,
		walletLastUpdatedBy:
			toNumber(firstDefined(raw.walletLastUpdatedBy, 0)) || undefined,
		tokenSymbol: String(
			firstDefined(
				raw.tokenSymbol,
				payloadJson.tokenSymbol,
				payloadJson.tokenStructure?.tokenSymbol,
				'',
			),
		),
		thumbnailUrl: String(
			firstDefined(
				normalizedThumbnailFile?.url,
				raw.thumbnailUrl,
				raw.thumbnailImageUrl,
				payloadJson.thumbnailUrl,
				payloadJson.thumbnailImageUrl,
				'',
			),
		),
		thumbnailFile: normalizedThumbnailFile,
		projectFiles,
		ownerAddress: firstDefined(raw.ownerAddress) as string | undefined,
		generatesCarbonCredits: Boolean(raw.generatesCarbonCredits),
		projectType: firstDefined(raw.projectType, payloadJson.projectType) as
			| string
			| undefined,
		dseType: String(
			firstDefined(
				raw.dseType,
				payloadJson.dseType,
				payloadJson.tokenStructure?.dseType,
				raw.projectType,
				payloadJson.projectType,
				'',
			),
		),
		stage: firstDefined(raw.stage, payloadJson.stage) as string | undefined,
		jurisdiction: firstDefined(raw.jurisdiction, payloadJson.jurisdiction) as
			| string
			| undefined,
		minimumInvestment: String(
			firstDefined(
				raw.minimumInvestment,
				payloadJson.minimumInvestment,
				payloadJson.capitalStructure?.minimumInvestment,
				'',
			),
		),
		totalProjectCapex: String(
			firstDefined(
				raw.totalProjectCapex,
				payloadJson.totalProjectCapex,
				payloadJson.capitalStructure?.totalProjectCapex,
				'',
			),
		),
		targetIrr: String(
			firstDefined(
				raw.targetIrr,
				payloadJson.targetIrr,
				payloadJson.investorStructure?.targetIrrExpectation,
				'',
			),
		),
		targetAnnualYield: String(
			firstDefined(
				raw.targetAnnualYield,
				payloadJson.targetAnnualYield,
				payloadJson.investorStructure?.targetAnnualYieldExpectation,
				'',
			),
		),
		investmentTermYears: String(
			firstDefined(
				raw.investmentTermYears,
				payloadJson.investmentTermYears,
				payloadJson.investorStructure?.maximumTermYears,
				'',
			),
		),
		investmentSummary: String(
			firstDefined(raw.investmentSummary, payloadJson.investmentSummary, ''),
		),
		payloadJson,
		draftPayload,
		workflowStatusJson,
		completedCount: toNumber(raw.completedCount),
		totalSections: toNumber(raw.totalSections),
		adminNotes: firstDefined(raw.adminNotes) as string | undefined,
		agreementAccepted: Boolean(raw.agreementAccepted),
		agreementAcceptedAt: (firstDefined(raw.agreementAcceptedAt, null) ??
			null) as string | null,
		agreementVersion: firstDefined(raw.agreementVersion) as string | undefined,
		status: normalizeStatus(raw.status),
		submittedAt: (firstDefined(raw.submittedAt, null) ?? null) as string | null,
		approvedAt: (firstDefined(raw.approvedAt, null) ?? null) as string | null,
		issuedAt: (firstDefined(raw.issuedAt, null) ?? null) as string | null,
		liveAt: (firstDefined(raw.liveAt, null) ?? null) as string | null,
		rejectedAt: (firstDefined(raw.rejectedAt, null) ?? null) as string | null,
		lockedAt: (firstDefined(raw.lockedAt, null) ?? null) as string | null,
		lockReason: (firstDefined(raw.lockReason, null) ?? null) as string | null,
		lastReviewedAt: (firstDefined(raw.lastReviewedAt, null) ?? null) as
			| string
			| null,
		purchasedAmount,
		percentFunded: toNumber(
			firstDefined(
				raw.percentFunded,
				fundingGoal > 0 ? Math.min((fundedSoFar / fundingGoal) * 100, 100) : 0,
			),
		),
		remainingSupply: unitsRemaining,
	};
};

export const normalizeProjectList = (value: unknown): IProject[] => {
	if (Array.isArray(value)) return value.map(normalizeProject);

	const root = asRecord(value);
	const list = Array.isArray(root.data) ? root.data : [];
	return list.map(normalizeProject);
};
