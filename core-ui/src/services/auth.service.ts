import { ApiRequestConfig, apiService } from './api.service';

import { UserType } from '@/constants/enum/user-type.enum';
import { ISingleResponse } from '@/interfaces/api/IApiBaseResponse';
import { IRefreshSessionResponse } from '@/interfaces/auth/IRefreshSessionResponse';
import { ISignInResponse } from '@/interfaces/auth/ISignInResponse';
import { ISignUpResponse } from '@/interfaces/auth/ISignUpResponse';
import { ISuccessfulAuthenticationResponse } from '@/interfaces/auth/ISuccessfulAuthenticationResponse';
import { IApiService } from '@/interfaces/services/IApiService';
import { IAuthService } from '@/interfaces/services/IAuthService';

class AuthService implements IAuthService {
	api: IApiService<ApiRequestConfig>;
	constructor(api: IApiService<ApiRequestConfig>) {
		this.api = api;
	}
	async signIn(email: string, password: string, config?: ApiRequestConfig) {
		return await this.api.post<ISingleResponse<ISignInResponse>>(
			'/auth/sign-in',
			{ email, password },
			config,
		);
	}
	async signUp(
		email: string,
		password: string,
		type: UserType,
		fullname: string,
		phoneNumber: string,
		birthdate: string,
		config?: ApiRequestConfig,
	) {
		return await this.api.post<ISingleResponse<ISignUpResponse>>(
			'/auth/sign-up',
			{ email, password, type, fullname, phoneNumber, birthdate },
			config,
		);
	}
	async confirmPassword(
		email: string,
		newPassword: string,
		code: string,
		config?: ApiRequestConfig,
	) {
		return await this.api.post<
			ISingleResponse<ISuccessfulAuthenticationResponse>
		>('/auth/confirm-password', { email, newPassword, code }, config);
	}
	async resendConfirmationCode(email: string, config?: ApiRequestConfig) {
		return await this.api.post<
			ISingleResponse<ISuccessfulAuthenticationResponse>
		>('/auth/resend-confirmation-code', { email }, config);
	}
	async forgotPassword(email: string, config?: ApiRequestConfig) {
		return await this.api.post<
			ISingleResponse<ISuccessfulAuthenticationResponse>
		>('/auth/forgot-password', { email }, config);
	}
	async refreshToken(
		email: string,
		refreshToken: string,
		config?: ApiRequestConfig,
	) {
		return await this.api.post<ISingleResponse<IRefreshSessionResponse>>(
			'/auth/refresh',
			{ email, refreshToken },
			config,
		);
	}
}

export const authService = new AuthService(apiService);
