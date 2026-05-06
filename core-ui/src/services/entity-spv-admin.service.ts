import { axiosService } from '@/configs/axios';

export type EntityStatus =
	| 'draft'
	| 'ready'
	| 'active'
	| 'inactive'
	| 'archived';
export type CustodyModel = 'self_custody' | 'regenx_custody';

export type SpvRoleKey =
	| 'developer'
	| 'sponsor'
	| 'trustee'
	| 'responsible_entity'
	| 'operator'
	| 'issuer'
	| 'custody_provider'
	| 'proceeds_recipient';

export type LegalEntityRecord = {
	id: number;
	uuid?: string;
	entityName: string;
	tradingName: string | null;
	entityType: string | null;
	abn: string | null;
	acn: string | null;
	jurisdiction: string | null;
	status: EntityStatus;
	contactEmail: string | null;
	notes: string | null;
	operationalRole: string | null;
	custodyModel: CustodyModel | null;
	createdAt: string;
	updatedAt: string;
};

export type SpvLinkedPartyRecord = {
	key: string;
	label: string;
	role: SpvRoleKey;
	acceptedRoles: SpvRoleKey[];
	isRequired: boolean;
	entityId: number | null;
	entityName: string | null;
	entityStatus: EntityStatus | null;
	roleLinkId: number | null;
	status: 'suggested' | 'linked' | 'approved' | 'rejected' | 'missing';
	source: 'auto' | 'manual' | null;
	confidenceScore: number | null;
	notes: string | null;
	approvedAt: string | null;
};

export type SpvReadiness = {
	status: 'ready' | 'blocked';
	requiredRolesComplete: boolean;
	custodyComplete: boolean;
	issuanceReady: boolean;
	blockingIssues: string[];
	requiredRoleGroups?: Array<{
		key: string;
		label: string;
		acceptedRoles: SpvRoleKey[];
	}>;
};

export type SpvRecord = {
	id: number;
	name: string;
	legalEntityName: string | null;
	jurisdiction: string | null;
	structureType: string | null;
	status: EntityStatus;
	notes: string | null;
	sponsorEntityId: number | null;
	sponsorEntityName: string | null;
	custodyModel: CustodyModel | null;
	projectId: number | null;
	linkedProjectName: string | null;
	createdAt: string;
	updatedAt: string | null;
	readiness: SpvReadiness;
	linkedParties: SpvLinkedPartyRecord[];
	roleCoverage: {
		approved: number;
		suggested: number;
		missing: number;
	};
};

export type IssuancePipelineState =
	| 'not_prepared'
	| 'in_progress'
	| 'blocked'
	| 'ready';

export type IssuancePipelineSummary = {
	total: number;
	notPrepared: number;
	inProgress: number;
	blocked: number;
	ready: number;
};

export type IssuancePipelineRow = {
	projectId: number;
	projectName: string | null;
	projectStatus: string | null;
	projectStage: string | null;
	jurisdiction: string | null;
	spvId: number | null;
	spvName: string | null;
	spvStatus: string | null;
	structureType: string | null;
	linkedPartyProgress: {
		linkedRequiredRoles: number;
		totalRequiredRoles: number;
	};
	custodyComplete: boolean;
	issuanceReady: boolean;
	blockerCount: number;
	blockers: string[];
	sponsorEntityName: string | null;
	readinessState: IssuancePipelineState;
};

export type IssuancePipelineDetail = IssuancePipelineRow & {
	project: {
		id: number;
		name: string | null;
		status: string | null;
		stage: string | null;
		jurisdiction: string | null;
		custodyMode: CustodyModel | null;
		issuanceStatus: string;
		sponsorEntityId: number | null;
	};
	spv: {
		id: number;
		name: string;
		status: string;
		jurisdiction: string | null;
		structureType: string | null;
		sponsorEntityId: number | null;
		custodyModel: CustodyModel | null;
		projectId: number | null;
	} | null;
	linkedParties: SpvLinkedPartyRecord[];
	readiness: {
		linkedRequiredRoles: number;
		totalRequiredRoles: number;
		requiredRolesComplete: boolean;
		custodyComplete: boolean;
		issuanceReady: boolean;
		blockers: string[];
		readinessState: IssuancePipelineState;
	};
};

const resolveProjectId = (id: string | number): string => {
	const normalized = String(id ?? '').trim();
	if (!normalized) {
		throw new Error(`Invalid project id: ${id}`);
	}
	return normalized;
};

export const entitySpvAdminService = {
	listEntities(): Promise<LegalEntityRecord[]> {
		return axiosService.get('/legal-entity/admin');
	},

	getEntityDetail(id: number | string): Promise<LegalEntityRecord> {
		return axiosService.get(`/legal-entity/admin/${id}`);
	},

	createEntity(
		payload: Partial<LegalEntityRecord> & { reason?: string },
	): Promise<LegalEntityRecord> {
		return axiosService.post('/legal-entity/admin', payload);
	},

	updateEntity(
		id: number | string,
		payload: Partial<LegalEntityRecord> & { reason?: string },
	): Promise<LegalEntityRecord> {
		return axiosService.patch(`/legal-entity/admin/${id}`, payload);
	},

	listSpvs(): Promise<SpvRecord[]> {
		return axiosService.get('/spv/admin');
	},

	listIssuancePipeline(): Promise<IssuancePipelineRow[]> {
		return axiosService.get('/spv/admin/issuance-pipeline');
	},

	getIssuancePipelineSummary(): Promise<IssuancePipelineSummary> {
		return axiosService.get('/spv/admin/issuance-pipeline/summary');
	},

	getIssuancePipelineDetailByProject(
		projectId: string | number,
	): Promise<IssuancePipelineDetail> {
		return axiosService.get(
			`/spv/admin/issuance-pipeline/project/${resolveProjectId(projectId)}`,
		);
	},

	getIssuancePipelineDetailBySpv(
		spvId: string | number,
	): Promise<IssuancePipelineDetail> {
		return axiosService.get(`/spv/admin/issuance-pipeline/spv/${spvId}`);
	},

	prepareProjectForIssuance(
		projectId: string | number,
		reason?: string,
	): Promise<SpvRecord> {
		return axiosService.post(
			`/spv/admin/issuance-pipeline/project/${resolveProjectId(
				projectId,
			)}/prepare`,
			{ reason },
		);
	},

	getSpvDetail(id: number | string): Promise<SpvRecord> {
		return axiosService.get(`/spv/admin/${id}`);
	},

	createSpv(
		payload: Partial<SpvRecord> & { reason?: string },
	): Promise<SpvRecord> {
		return axiosService.post('/spv/admin', payload);
	},

	updateSpv(
		id: number | string,
		payload: Partial<SpvRecord> & { reason?: string },
	): Promise<SpvRecord> {
		return axiosService.patch(`/spv/admin/${id}`, payload);
	},

	getProjectEntitySpvSummary(projectId: string | number): Promise<{
		projectId: number;
		sponsorEntity: {
			id: number;
			entityName: string;
			tradingName: string | null;
			status: EntityStatus;
			jurisdiction: string | null;
		} | null;
		linkedSpv: SpvRecord | null;
		walletAlignment: {
			custodyMode: CustodyModel | null;
			proceedsWalletAddress: string | null;
			issuerWalletAddress: string | null;
			distributionWalletAddress: string | null;
			matchesStructure: boolean;
			issues: string[];
		};
		readiness?: SpvReadiness;
	}> {
		return axiosService.get(
			`/project/${resolveProjectId(projectId)}/entity-spv-summary`,
		);
	},

	upsertSpvRole(
		spvId: string | number,
		payload: {
			entityId?: number | null;
			role: SpvRoleKey;
			status?: 'suggested' | 'linked' | 'approved' | 'rejected';
			source?: 'auto' | 'manual';
			isRequired?: boolean;
			isPrimary?: boolean;
			confidenceScore?: number | null;
			notes?: string;
			reason?: string;
		},
	): Promise<SpvRecord> {
		return axiosService.post(`/spv/admin/${spvId}/linked-parties`, payload);
	},

	rejectSpvRole(
		spvId: string | number,
		roleLinkId: string | number,
		reason?: string,
	): Promise<SpvRecord> {
		return axiosService.post(
			`/spv/admin/${spvId}/linked-parties/${roleLinkId}/reject`,
			{ reason },
		);
	},
};
