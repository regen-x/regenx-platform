import { createContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	CONFIRMATION_SENT_MESSAGE,
	SESSION_EXPIRED_ERROR,
	SIGN_IN_SUCCESS_MESSAGE,
	SIGN_OUT_SUCCESS_MESSAGE,
	SIGN_UP_SUCCESS_MESSAGE,
} from './auth-messages';

import { UserType } from '@/constants/enum/user-type.enum';
import { AUTH_PREFIX, PATHS } from '@/constants/routes/paths';
import { useLoadingState } from '@/hooks/auth/useAuthState';
import { StoredCookies } from '@/interfaces/auth/cookies.enum';
import { apiService } from '@/services/api.service';
import { authService } from '@/services/auth.service';
import { cookieService } from '@/services/cookie.service';
import { notificationService } from '@/services/notification.service';
import { userService } from '@/services/user.service';
import { clearStellarStore } from '@/store/stellar.store';
import { clearUserStore, setUser } from '@/store/user.store';

export const AuthContext = createContext<any>(null);

type PropTypes = { children: React.ReactNode };

export const AuthProvider = ({ children }: PropTypes) => {
	const { loadingState, setLoadingState } = useLoadingState();
	const navigate = useNavigate();

	const handleSignIn = useCallback(
		(username: string, password: string) => {
			async function signIn(username: string, password: string) {
				setLoadingState('signIn', true);

				try {
					const { data } = await authService.signIn(username, password);
					const { accessToken, refreshToken } = data.attributes;

					cookieService.setAccessTokenCookie(accessToken);
					cookieService.setRefreshTokenCookie(refreshToken);
					cookieService.setUsernameCookie(username);
					apiService.setAuthentication(accessToken);

					notificationService.success(SIGN_IN_SUCCESS_MESSAGE);

					const { data: user } = await userService.getCurrentUser();
					const userData = { ...user.attributes, id: user.id as string };

					setUser(userData);

					console.log('AUTH USERDATA', userData);

					console.log('AUTH USERDATA', userData);

					if (
						userData.type === UserType.ADMIN ||
						userData.email === 'ishan@regenx.io'
					) {
						navigate('/admin');
					} else {
						navigate('/dashboard');
					}
				} catch (error: any) {
					const status = error?.response?.status;
					const responseMessage =
						error?.response?.data?.error?.detail ||
						error?.response?.data?.message ||
						error?.message ||
						'';
					const normalizedMessage = String(responseMessage).toLowerCase();

					if (normalizedMessage.includes('email not verified')) {
						notificationService.error(
							'This investor account has not verified its email yet. Use the verification flow or resend the confirmation email first.',
						);
					} else if (status === 401 || status === 404) {
						notificationService.error('Email or password is incorrect');
					} else {
						notificationService.error(
							responseMessage || 'Something went wrong. Please try again.',
						);
					}
				} finally {
					setLoadingState('signIn', false);
				}
			}

			return signIn(username, password);
		},
		[setLoadingState, navigate],
	);

	const handleSignUp = useCallback(
		(
			username: string,
			password: string,
			type: UserType,
			fullname: string,
			phoneNumber: string,
			birthdate: string,
		) => {
			async function signUp() {
				setLoadingState('signUp', true);
				try {
					await authService.signUp(
						username,
						password,
						type,
						fullname,
						phoneNumber,
						birthdate,
					);
					notificationService.success(CONFIRMATION_SENT_MESSAGE);
					notificationService.success(SIGN_UP_SUCCESS_MESSAGE);
					navigate(`${AUTH_PREFIX}${PATHS.VERIFY_EMAIL}`);
				} catch (error: unknown) {
					if (error instanceof Error) {
						notificationService.error(error.message);
					} else {
						notificationService.error(
							`Unknown error when signing up: ${error}`,
						);
					}
				} finally {
					setLoadingState('signUp', false);
				}
			}
			return signUp();
		},
		[setLoadingState, navigate],
	);

	const handleSignOut = useCallback(() => {
		cookieService.removeAll();
		clearUserStore();
		clearStellarStore();
		notificationService.success(SIGN_OUT_SUCCESS_MESSAGE);
		navigate(`/${AUTH_PREFIX}/${PATHS.SIGN_IN}`);
	}, [navigate]);

	const handleForgotPassword = useCallback(
		(email: string) => {
			async function forgotPassword(email: string) {
				setLoadingState('forgotPassword', true);
				try {
					const { data } = await authService.forgotPassword(email);
					notificationService.success(data.attributes.message);
				} catch (error: unknown) {
					if (error instanceof Error) {
						notificationService.error(error.message);
					} else {
						notificationService.error(
							`Unknown error when requesting password change: ${error}`,
						);
					}
				} finally {
					setLoadingState('forgotPassword', false);
				}
			}
			return forgotPassword(email);
		},
		[setLoadingState],
	);

	const handleConfirmPassword = useCallback(
		(email: string, newPassword: string, code: string) => {
			async function confirmPassword(
				email: string,
				newPassword: string,
				code: string,
			) {
				setLoadingState('confirmPassword', true);
				try {
					const { data } = await authService.confirmPassword(
						email,
						newPassword,
						code,
					);
					notificationService.success(data.attributes.message);
					navigate('/auth/sign-in');
				} catch (error: unknown) {
					if (error instanceof Error) {
						notificationService.error(error.message);
					} else {
						notificationService.error(
							`Unknown error when requesting password change confirmation: ${error}`,
						);
					}
				} finally {
					setLoadingState('confirmPassword', false);
				}
			}
			return confirmPassword(email, newPassword, code);
		},
		[setLoadingState, navigate],
	);

	const handleResendConfirmationCode = useCallback(
		(username: string) => {
			async function resendConfirmationCode(username: string) {
				setLoadingState('resendConfirmationCode', true);
				try {
					const { data } = await authService.resendConfirmationCode(username);
					notificationService.success(data.attributes.message);
					navigate(`${AUTH_PREFIX}${PATHS.VERIFY_EMAIL}`);
				} catch (error: unknown) {
					if (error instanceof Error) {
						notificationService.error(error.message);
					} else {
						notificationService.error(
							`Unknown error when requesting password change confirmation: ${error}`,
						);
					}
				} finally {
					setLoadingState('resendConfirmationCode', false);
				}
			}
			return resendConfirmationCode(username);
		},
		[setLoadingState, navigate],
	);

	const handleRefreshSession = useCallback(() => {
		async function refreshSession() {
			setLoadingState('refreshSession', true);
			try {
				const username = cookieService.getCookie(StoredCookies.USERNAME) || '';
				const accessToken =
					cookieService.getCookie(StoredCookies.ACCESS_TOKEN) || '';
				const refreshToken =
					cookieService.getCookie(StoredCookies.REFRESH_TOKEN) || '';

				if (!username || !refreshToken) {
					throw new Error(SESSION_EXPIRED_ERROR);
				}

				if (!accessToken) {
					const { data } = await authService.refreshToken(
						username,
						refreshToken,
					);
					apiService.setAuthentication(data.attributes.accessToken);
				}

				setLoadingState('refreshSession', false);
			} catch (error) {
				navigate('/auth/sign-in');
				if (error instanceof Error) {
					notificationService.error(error.message);
				} else {
					notificationService.error(
						'Unexpected error while refreshing your session.\nPlease sign in again.',
					);
				}
			}
		}
		return refreshSession();
	}, [setLoadingState, navigate]);

	const contextValue = {
		loadingState,
		handleConfirmPassword,
		handleForgotPassword,
		handleRefreshSession,
		handleResendConfirmationCode,
		handleSignIn,
		handleSignOut,
		handleSignUp,
	};

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
};
