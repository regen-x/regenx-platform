import axios from '@/configs/axios';

export const investorVerificationService = {
	getMine: async () => {
		const res = await axios.get('/investor-verification/me');
		return res.data;
	},

	getAdminQueue: async () => {
		const res = await axios.get('/investor-verification/admin');
		return res.data;
	},

	getAdminDetail: async (userId: string) => {
		const res = await axios.get(`/investor-verification/admin/${userId}`);
		return res.data;
	},

	getCustodySummary: async (userId: string) => {
		const res = await axios.get(`/custody/investors/${userId}`);
		return res.data;
	},

	createOrRetryCustody: async (
		userId: string,
		payload: {
			provider: 'testnet' | 'fireblocks' | 'zodia';
			mode: 'wallet' | 'custody_account';
		},
	) => {
		const res = await axios.post(
			`/custody/investors/${userId}/create-or-retry`,
			payload,
		);
		return res.data;
	},

	saveAml: async (payload: Record<string, any>) => {
		const res = await axios.post('/investor-verification/aml', payload);
		return res.data;
	},

	getWholesaleUploadUrl: async (fileName: string, contentType: string) => {
		const res = await axios.post(
			'/investor-verification/wholesale/upload-url',
			{
				fileName,
				contentType,
			},
		);
		return res.data;
	},

	completeWholesaleUpload: async (payload: {
		key: string;
		originalName: string;
		expiryDate: string;
	}) => {
		const res = await axios.post(
			'/investor-verification/wholesale/complete',
			payload,
		);
		return res.data;
	},

	startSumsub: async () => {
		const res = await axios.post('/investor-verification/sumsub/start');
		return res.data;
	},

	reviewInvestor: async (
		userId: string,
		payload: {
			adminReviewStatus: 'approved' | 'rejected' | 'more_info_required';
			reviewNotes?: string;
		},
	) => {
		const res = await axios.post(
			`/investor-verification/admin/${userId}/review`,
			{
				adminReviewStatus: payload.adminReviewStatus,
				reviewNotes: payload.reviewNotes,
			},
		);
		return res.data;
	},

	enableAdminTestOverride: async (
		userId: string,
		payload?: {
			note?: string;
		},
	) => {
		const res = await axios.post(
			`/investor-verification/admin/${userId}/test-override`,
			{
				note: payload?.note,
			},
		);
		return res.data;
	},

	disableAdminTestOverride: async (
		userId: string,
		payload?: {
			note?: string;
		},
	) => {
		const res = await axios.post(
			`/investor-verification/admin/${userId}/test-override/disable`,
			{
				note: payload?.note,
			},
		);
		return res.data;
	},

	setVerificationOverrideMode: async (
		userId: string,
		payload: {
			verificationOverrideMode: 'none' | 'testnet';
			note?: string;
		},
	) => {
		const res = await axios.post(
			`/investor-verification/admin/${userId}/override-mode`,
			{
				verificationOverrideMode: payload.verificationOverrideMode,
				note: payload.note,
			},
		);
		return res.data;
	},

	canInvest: async (userId: string) => {
		const res = await axios.get(`/investor-verification/${userId}/can-invest`);
		return res.data;
	},
};
