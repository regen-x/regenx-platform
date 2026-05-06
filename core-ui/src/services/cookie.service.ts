import { jwtDecode } from 'jwt-decode';
import Cookies from 'universal-cookie';

import {
	ITokenPayload,
	ITokenPayloadCognito,
} from '@/interfaces/auth/ITokenPayload';
import { StoredCookies } from '@/interfaces/auth/cookies.enum';
import { ICookieService } from '@/interfaces/services/ICookieService';

class CookieService<T extends ITokenPayload> implements ICookieService<T> {
	private THIRTY_DAYS_IN_MILISECONDS = 1000 * 60 * 60 * 24 * 30;

	cookies: Cookies;
	constructor() {
		this.cookies = new Cookies({ path: '/' }, { path: '/' });
	}
	setUsernameCookie(
		username: string,
		expiresIn = this.THIRTY_DAYS_IN_MILISECONDS,
	) {
		const expires = new Date(Date.now() + expiresIn);
		this.cookies.set(StoredCookies.USERNAME, username, { expires, path: '/' });
	}

	setRefreshTokenCookie(
		refreshToken: string,
		expiresIn = this.THIRTY_DAYS_IN_MILISECONDS,
	) {
		const expires = new Date(Date.now() + expiresIn);
		this.cookies.set(StoredCookies.REFRESH_TOKEN, refreshToken, {
			expires,
			path: '/',
		});
	}
	setAccessTokenCookie(accessToken: string) {
		this.cookies.set(StoredCookies.ACCESS_TOKEN, accessToken, { path: '/' });
	}
	getCookie(name: StoredCookies) {
		return this.cookies.get(name);
	}
	remove(name: StoredCookies) {
		return this.cookies.remove(name);
	}
	removeAll() {
		for (const cookie of Object.values(StoredCookies)) {
			this.remove(cookie);
		}
	}
	decodeToken(token: string) {
		try {
			return jwtDecode<T>(token);
		} catch (error) {
			return null;
		}
	}
}

export const cookieService = new CookieService<ITokenPayloadCognito>();
