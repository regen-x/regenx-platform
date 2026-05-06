import { axiosService } from '@/configs/axios';

export type CustodyMode = 'self_custody' | 'regenx_custody';
export type CustodyChangeStatus =
	| 'none'
	| 'pending_review'
	| 'approved'
	| 'rejected';

export type DeveloperCompanyDetails = {
	legalEntityName: string | null;
	tradingName: string | null;
	abn: string | null;
	acn: string | null;
	contactName: string | null;
	contactEmail: string | null;
	phone: string | null;
	website: string | null;
	registeredAddress: string | null;
	businessDescription: string | null;
	verificationStatus: string;
	submittedAt: string | null;
	approvedAt: string | null;
	rejectedAt: string | null;
	adminNotes: string | null;
};

export type DeveloperWalletSettings = {
	custodyMode: CustodyMode;
	primaryWalletAddress: string | null;
	walletStatus: string;
	walletConnectionState: string;
	walletLabel: string | null;
	lastUpdatedAt: string | null;
	walletConnectedAt: string | null;
	custodyChangeStatus: CustodyChangeStatus;
	custodyChangeRequestedAt: string | null;
	requestedCustodyMode: CustodyMode | null;
	requiresComplianceReview: boolean;
	hasExistingLiveProjects: boolean;
	liveProjectCount: number;
	explanatoryCopy: {
		selfCustody: string;
		regenxCustody: string;
		warning: string;
	};
};

export type DeveloperEntityProjectLink = {
	projectId: number;
	projectName: string;
	projectStatus: string;
	entityRole: string;
	linkedEntityName: string;
	linkedSpvName: string | number;
	linkedSpvStatus: string;
};

export type DeveloperEntityLinkageSummary = {
	primaryLegalEntity: string;
	operatingEntity: string;
	linkedSpvName: string;
	linkedSpvStatus: string;
	offeringRole: string;
	relatedProjects: DeveloperEntityProjectLink[];
};

export type DeveloperSettingsSummary = {
	companyDetails: DeveloperCompanyDetails;
	wallet: DeveloperWalletSettings;
	entityLinkage: DeveloperEntityLinkageSummary;
};

export type UpdateDeveloperCompanyDetailsPayload = {
	legalEntityName: string;
	tradingName: string;
	abn: string;
	acn: string;
	contactName: string;
	contactEmail: string;
	phone: string;
	website: string;
	registeredAddress: string;
	businessDescription: string;
};

export type UpdateDeveloperWalletPayload = {
	walletAddress: string;
	walletLabel?: string;
};

export const developerSettingsService = {
	getSummary() {
		return axiosService.get<DeveloperSettingsSummary>(
			'/developer-profile/settings',
		);
	},

	updateCompanyDetails(payload: UpdateDeveloperCompanyDetailsPayload) {
		return axiosService.patch<DeveloperCompanyDetails>(
			'/developer-profile/settings/company',
			payload,
		);
	},

	getWalletSettings() {
		return axiosService.get<DeveloperWalletSettings>(
			'/developer-profile/settings/wallet',
		);
	},

	updateWallet(payload: UpdateDeveloperWalletPayload) {
		return axiosService.patch<DeveloperWalletSettings>(
			'/developer-profile/settings/wallet',
			payload,
		);
	},

	requestCustodyModeChange(requestedMode: CustodyMode) {
		return axiosService.post<{
			currentMode: CustodyMode;
			requestedMode: CustodyMode;
			status: CustodyChangeStatus;
			requestedAt: string | null;
			requiresReview: boolean;
		}>('/developer-profile/settings/custody-change-request', {
			requestedMode,
		});
	},

	getEntityLinkage() {
		return axiosService.get<DeveloperEntityLinkageSummary>(
			'/developer-profile/settings/entity-linkage',
		);
	},
};
