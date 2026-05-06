import { axiosService } from '@/configs/axios';

export type CustodyParticipantType =
	| 'project'
	| 'developer'
	| 'investor'
	| 'legal_entity'
	| 'spv';

export type CustodyMode = 'self_custody' | 'regenx_custody' | null;
export type CustodySetupStatus =
	| 'not_started'
	| 'incomplete'
	| 'pending_review'
	| 'complete'
	| 'reviewed'
	| 'blocked';
export type CustodyReadinessStatus = 'ready' | 'warning' | 'blocked';
export type CustodyChangeRequestStatus =
	| 'none'
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'more_info_required'
	| 'cancelled';

export type CustodyQueueEntry = {
	entryType: 'project' | 'participant';
	projectId: number;
	participantId: number;
	participantType: CustodyParticipantType;
	projectName: string;
	participantName: string;
	entityName: string | null;
	custodyMode: CustodyMode;
	walletAddress: string | null;
	walletStatus: string;
	custodySetupStatus: CustodySetupStatus;
	custodyChangeRequestStatus: CustodyChangeRequestStatus;
	issuanceReadinessImpact: string;
	lastUpdated: string;
	readiness: {
		custodyMode: CustodyMode;
		setupStatus: CustodySetupStatus;
		readinessStatus: CustodyReadinessStatus;
		blockingReasons: string[];
		warnings: string[];
		requestedChangeStatus: CustodyChangeRequestStatus;
	};
	requestId: number | null;
};

export type CustodyDetail = {
	projectId: number;
	linkedProject: {
		id: number;
		name: string;
		issuanceStatus: string;
	};
	participantType: CustodyParticipantType;
	participantId: number;
	participantName: string;
	currentCustodyMode: CustodyMode;
	requestedCustodyMode: CustodyMode;
	relatedWalletAddresses: Record<string, string | null>;
	linkedLegalEntity: { id: number | null; name: string } | null;
	linkedSpv: { id: number; name: string } | null;
	walletVerificationState: string;
	custodySetupCompleteness: CustodySetupStatus;
	issuanceReadinessImpact: string;
	blockingReasons: string[];
	warnings: string[];
	requestedChangeStatus: CustodyChangeRequestStatus;
	reasonForCustodyChangeRequest: string | null;
	whoRequestedChange: string | null;
	timestamps: {
		requestedAt: string | null;
		decidedAt: string | null;
		reviewedAt: string | null;
		walletLastUpdatedAt: string | null;
	};
	relatedNotes: {
		adminNotes: string | null;
		custodyBlockReason: string | null;
		walletLastUpdatedBy: string | null;
	};
	linkedIssuanceStatus: {
		issuanceStatus: string;
		issuanceTxHash: string | null;
		issuanceBlockedByCustody: boolean;
	};
	requests: Array<{
		id: number;
		status: CustodyChangeRequestStatus;
		currentCustodyMode: CustodyMode;
		requestedCustodyMode: CustodyMode;
		reason: string;
		adminNotes: string | null;
		requestedAt: string;
		decidedAt: string | null;
	}>;
};

export type ProjectCustodyConfig = {
	projectId: number;
	custodyMode: 'self_custody' | 'regenx_custody';
	custodySetupStatus: CustodySetupStatus;
	custodyReviewedAt: string | null;
	custodyReviewedBy: number | null;
	custodyBlockReason: string | null;
	issuanceBlockedByCustody: boolean;
	requestedChangeStatus: CustodyChangeRequestStatus;
	custodyReadiness: {
		custodyMode: 'self_custody' | 'regenx_custody';
		setupStatus: CustodySetupStatus;
		readinessStatus: CustodyReadinessStatus;
		blockingReasons: string[];
		warnings: string[];
		requestedChangeStatus: CustodyChangeRequestStatus;
	};
};

export const adminCustodyService = {
	getQueue(): Promise<CustodyQueueEntry[]> {
		return axiosService.get('/admin/custody');
	},

	getDetail(params: {
		projectId: number | string;
		participantType: CustodyParticipantType;
		participantId: number | string;
	}): Promise<CustodyDetail> {
		const search = new URLSearchParams({
			projectId: String(params.projectId),
			participantType: params.participantType,
			participantId: String(params.participantId),
		});
		return axiosService.get(`/admin/custody/detail?${search.toString()}`);
	},

	reviewRequest(
		requestId: number | string,
		payload: {
			status: 'approved' | 'rejected' | 'more_info_required';
			adminNotes: string;
			reason?: string;
		},
	): Promise<{ id: number; status: CustodyChangeRequestStatus }> {
		return axiosService.post(
			`/admin/custody/requests/${requestId}/review`,
			payload,
		);
	},

	markProjectReviewed(
		projectId: number | string,
		adminNotes?: string,
	): Promise<ProjectCustodyConfig> {
		return axiosService.post(`/admin/custody/projects/${projectId}/review`, {
			adminNotes,
		});
	},

	blockIssuance(
		projectId: number | string,
		payload: { reason?: string; adminNotes?: string },
	): Promise<ProjectCustodyConfig> {
		return axiosService.post(
			`/admin/custody/projects/${projectId}/block-issuance`,
			payload,
		);
	},

	clearIssuanceBlock(
		projectId: number | string,
		adminNotes?: string,
	): Promise<ProjectCustodyConfig> {
		return axiosService.post(
			`/admin/custody/projects/${projectId}/clear-issuance-block`,
			{ adminNotes },
		);
	},
};
