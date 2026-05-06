import { ISingleResponse } from '../api/IApiBaseResponse';
import { IRefreshSessionResponse } from '../auth/IRefreshSessionResponse';
import { ISignInResponse } from '../auth/ISignInResponse';
import { ISignUpResponse } from '../auth/ISignUpResponse';
import { ISuccessfulAuthenticationResponse } from '../auth/ISuccessfulAuthenticationResponse';

import { UserType } from '@/constants/enum/user-type.enum';
import { ApiRequestConfig } from '@/services/api.service';

export interface IAuthService {
	signUp: (
		email: string,
		password: string,
		type: UserType,
		fullname: string,
		phoneNumber: string,
		birthdate: string,
		config?: ApiRequestConfig,
	) => Promise<ISingleResponse<ISignUpResponse>>;
	signIn: (
		username: string,
		password: string,
		config?: ApiRequestConfig,
	) => Promise<ISingleResponse<ISignInResponse>>;
	confirmPassword: (
		username: string,
		newPassword: string,
		code: string,
		config?: ApiRequestConfig,
	) => Promise<ISingleResponse<ISuccessfulAuthenticationResponse>>;
	resendConfirmationCode: (
		username: string,
		config?: ApiRequestConfig,
	) => Promise<ISingleResponse<ISuccessfulAuthenticationResponse>>;
	forgotPassword: (
		username: string,
		config?: ApiRequestConfig,
	) => Promise<ISingleResponse<ISuccessfulAuthenticationResponse>>;
	refreshToken: (
		username: string,
		refreshToken: string,
		config?: ApiRequestConfig,
	) => Promise<ISingleResponse<IRefreshSessionResponse>>;
}
