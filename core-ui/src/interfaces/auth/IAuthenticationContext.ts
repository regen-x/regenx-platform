import { ILoadingState } from './ILoadingState';

import { UserType } from '@/constants/enum/user-type.enum';

export interface IAuthenticationContext {
	handleSignIn: (username: string, password: string) => Promise<void>;
	handleSignUp: (
		email: string,
		password: string,
		type: UserType,
		fullname: string,
		phoneNumber: string,
		birthdate: string,
	) => Promise<void>;
	handleSignOut: () => void;
	handleResendConfirmationCode: (username: string) => Promise<void>;
	handleForgotPassword: (username: string) => Promise<void>;
	handleConfirmPassword: (
		username: string,
		newPassword: string,
		code: string,
	) => Promise<void>;
	handleRefreshSession: () => Promise<void>;
	loadingState: ILoadingState;
}
