import {
	IInvestorOnboardingState,
	InvestorCategory,
	VerificationStatus,
} from '@/store/user.store';

export type EligibilityReason =
	| 'eligible'
	| 'profile_incomplete'
	| 'non_australian'
	| 'retail_investor'
	| 'identity_not_verified'
	| 'aml_not_verified'
	| 'wholesale_not_verified'
	| 'wallet_not_connected'
	| 'bank_not_verified'
	| 'tax_legal_incomplete';

export type OnboardingStepKey =
	| 'profile'
	| 'classification'
	| 'identity'
	| 'wallet'
	| 'bank'
	| 'tax_legal'
	| 'complete';

export const isVerifiedStatus = (status: VerificationStatus) =>
	status === 'verified';

export const isEligibleInvestorCategory = (category: InvestorCategory) =>
	category === 'wholesale' || category === 'sophisticated';

export const getEligibilityReason = (
	state: IInvestorOnboardingState,
): EligibilityReason => {
	if (!state.profileComplete) return 'profile_incomplete';
	if (state.residencyStatus !== 'australia') return 'non_australian';

	if (!isEligibleInvestorCategory(state.investorCategory)) {
		return state.investorCategory === 'retail'
			? 'retail_investor'
			: 'wholesale_not_verified';
	}

	if (!isVerifiedStatus(state.identityStatus)) return 'identity_not_verified';
	if (!isVerifiedStatus(state.amlStatus)) return 'aml_not_verified';
	if (!isVerifiedStatus(state.wholesaleStatus)) return 'wholesale_not_verified';
	if (!state.walletConnected) return 'wallet_not_connected';
	if (!state.bankAccountVerified) return 'bank_not_verified';
	if (!state.taxLegalComplete) return 'tax_legal_incomplete';

	return 'eligible';
};

export const canInvest = (state: IInvestorOnboardingState) =>
	getEligibilityReason(state) === 'eligible';

export const getProgressSteps = (state: IInvestorOnboardingState) => {
	const steps = [
		state.profileComplete,
		state.residencyStatus === 'australia',
		isEligibleInvestorCategory(state.investorCategory) &&
			isVerifiedStatus(state.wholesaleStatus),
		isVerifiedStatus(state.identityStatus),
		isVerifiedStatus(state.amlStatus),
		state.walletConnected,
		state.bankAccountVerified,
		state.taxLegalComplete,
	];

	const completed = steps.filter(Boolean).length;
	const total = steps.length;
	const percentage = Math.round((completed / total) * 100);

	return { completed, total, percentage };
};

export const getNextOnboardingStep = (
	state: IInvestorOnboardingState,
): OnboardingStepKey => {
	if (!state.profileComplete) return 'profile';

	if (state.residencyStatus !== 'australia') return 'classification';

	if (
		!isEligibleInvestorCategory(state.investorCategory) ||
		!isVerifiedStatus(state.wholesaleStatus)
	) {
		return 'classification';
	}

	if (
		!isVerifiedStatus(state.identityStatus) ||
		!isVerifiedStatus(state.amlStatus)
	) {
		return 'identity';
	}

	if (!state.walletConnected) return 'wallet';
	if (!state.bankAccountVerified) return 'bank';
	if (!state.taxLegalComplete) return 'tax_legal';

	return 'complete';
};

export const eligibilityMessages: Record<EligibilityReason, string> = {
	eligible: 'You are verified and ready to invest.',
	profile_incomplete: 'Complete your profile to continue.',
	non_australian: 'RegenX is currently available to Australian investors only.',
	retail_investor:
		'RegenX is currently available only to verified wholesale or sophisticated investors.',
	identity_not_verified: 'Complete identity verification to continue.',
	aml_not_verified: 'AML verification is still required.',
	wholesale_not_verified:
		'Upload and verify your wholesale or sophisticated investor certificate.',
	wallet_not_connected: 'Connect your wallet to continue.',
	bank_not_verified: 'Add and verify your bank account details.',
	tax_legal_incomplete: 'Complete tax and legal declarations to continue.',
};
