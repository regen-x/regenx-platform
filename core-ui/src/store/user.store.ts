import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { IUser } from '@/interfaces/api/IUser';

export type VerificationStatus =
	| 'not_started'
	| 'pending'
	| 'verified'
	| 'rejected'
	| 'expired';

export type InvestorCategory =
	| 'unknown'
	| 'retail'
	| 'wholesale'
	| 'sophisticated';

export type ResidencyStatus = 'unknown' | 'australia' | 'overseas';

export interface IInvestorOnboardingState {
	profileComplete: boolean;
	residencyStatus: ResidencyStatus;
	investorCategory: InvestorCategory;

	identityStatus: VerificationStatus;
	amlStatus: VerificationStatus;
	identityDocumentUploaded: boolean;
	identityDocumentFileName?: string | null;

	wholesaleStatus: VerificationStatus;

	walletConnected: boolean;

	bankAccountVerified: boolean;
	bankAccountName?: string | null;
	bankName?: string | null;
	bsb?: string | null;
	accountNumber?: string | null;

	taxLegalComplete: boolean;
	termsAccepted: boolean;
	riskDisclosureAccepted: boolean;
	taxDeclarationAccepted: boolean;

	certificateExpiryDate?: string | null;
}

type UseStoreState = {
	user: IUser | null;
	onboarding: IInvestorOnboardingState;
};

type UserStoreActions = {
	setUser: (user: IUser) => void;
	updateUser: (payload: Partial<IUser>) => void;
	clearUserStore: () => void;
	setOnboarding: (payload: Partial<IInvestorOnboardingState>) => void;
	resetOnboarding: () => void;
};

const initialOnboardingState: IInvestorOnboardingState = {
	profileComplete: false,
	residencyStatus: 'unknown',
	investorCategory: 'unknown',

	identityStatus: 'not_started',
	amlStatus: 'not_started',
	identityDocumentUploaded: false,
	identityDocumentFileName: null,

	wholesaleStatus: 'not_started',

	walletConnected: false,

	bankAccountVerified: false,
	bankAccountName: null,
	bankName: null,
	bsb: null,
	accountNumber: null,

	taxLegalComplete: false,
	termsAccepted: false,
	riskDisclosureAccepted: false,
	taxDeclarationAccepted: false,

	certificateExpiryDate: null,
};

const initialState: UseStoreState = {
	user: null,
	onboarding: initialOnboardingState,
};

export const useUserStore = create<UseStoreState>()(
	persist(() => initialState, {
		name: 'user',
		version: 4,
		partialize: (state) => ({
			user: state.user,
			onboarding: state.onboarding,
		}),
		migrate: (persistedState: any, version) => {
			if (version < 4) {
				return initialState;
			}

			return {
				...initialState,
				...persistedState,
				onboarding: {
					...initialOnboardingState,
					...(persistedState?.onboarding || {}),
				},
			};
		},
	}),
);

export const setUser: UserStoreActions['setUser'] = (user: IUser) => {
	useUserStore.setState(() => ({ user }));
};

export const updateUser: UserStoreActions['updateUser'] = (
	payload: Partial<IUser>,
) => {
	useUserStore.setState((state) => ({
		user: state.user
			? {
					...state.user,
					...payload,
			  }
			: (payload as IUser),
	}));
};

export const setOnboarding: UserStoreActions['setOnboarding'] = (
	payload: Partial<IInvestorOnboardingState>,
) => {
	useUserStore.setState((state) => ({
		onboarding: {
			...state.onboarding,
			...payload,
		},
	}));
};

export const resetOnboarding: UserStoreActions['resetOnboarding'] = () => {
	useUserStore.setState(() => ({
		onboarding: initialOnboardingState,
	}));
};

export const clearUserStore: UserStoreActions['clearUserStore'] = () => {
	useUserStore.setState(() => ({
		user: null,
		onboarding: initialOnboardingState,
	}));
};
