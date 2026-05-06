export type InvestorSubmissionStatus =
	| 'draft'
	| 'under_review'
	| 'changes_requested'
	| 'approved'
	| 'rejected';

export type InvestorVerificationStatus =
	| 'not_started'
	| 'pending'
	| 'verified'
	| 'rejected'
	| 'expired';

export type InvestorSubmission = {
	id: string;
	email: string;
	onboarding: {
		fullName: string;
		email: string;
		phoneNumber: string;
		residencyStatus: 'unknown' | 'australia' | 'overseas';
		investorCategory: 'unknown' | 'retail' | 'wholesale' | 'sophisticated';
		identityStatus: InvestorVerificationStatus;
		amlStatus: InvestorVerificationStatus;
		identityDocumentUploaded: boolean;
		identityDocumentFileName: string;
		wholesaleStatus: InvestorVerificationStatus;
		wholesaleCertificateUploaded: boolean;
		wholesaleCertificateFileName: string;
		walletConnected: boolean;
		walletAddress: string;
		bankAccountVerified: boolean;
		bankAccountName: string;
		bankName: string;
		bsb: string;
		accountNumber: string;
		taxLegalComplete: boolean;
	};
	status: InvestorSubmissionStatus;
	submittedAt: string;
	adminNotes?: string;
};

export const INVESTOR_SUBMISSIONS_KEY = 'regenx_investor_submissions';

export const getInvestorSubmissions = (): InvestorSubmission[] => {
	try {
		const raw = localStorage.getItem(INVESTOR_SUBMISSIONS_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (error) {
		console.error('Failed to read investor submissions', error);
		return [];
	}
};

export const saveInvestorSubmissions = (items: InvestorSubmission[]) => {
	localStorage.setItem(INVESTOR_SUBMISSIONS_KEY, JSON.stringify(items));
};

export const saveInvestorSubmission = (submission: InvestorSubmission) => {
	const existing = getInvestorSubmissions();
	saveInvestorSubmissions([submission, ...existing]);
};
