import axios, {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from 'axios';

const browserHost =
	typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalBrowser =
	browserHost === 'localhost' || browserHost === '127.0.0.1';
const LOCAL_DEV_API_BASE = 'http://localhost:5000/api/v1';
const configuredApiBase = import.meta.env.VITE_API_URL || '/api/v1';
const REMOTE_API_BASE =
	configuredApiBase === LOCAL_DEV_API_BASE
		? 'https://staging.api.regenx.io/api/v1'
		: configuredApiBase;
const shouldUseLocalDevApi =
	import.meta.env.DEV &&
	isLocalBrowser &&
	import.meta.env.VITE_USE_LOCAL_API === 'true';
const API_BASE = shouldUseLocalDevApi ? LOCAL_DEV_API_BASE : REMOTE_API_BASE;

function getCookieValue(name: string): string | null {
	if (typeof document === 'undefined') return null;

	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));

	return match ? decodeURIComponent(match[1]) : null;
}

function getStoredAccessToken(): string | null {
	const fromLocalStorage =
		typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

	if (fromLocalStorage) return fromLocalStorage;

	const fromCookie = getCookieValue('accessToken');
	if (fromCookie) return fromCookie;

	return null;
}

export const axiosInstance: AxiosInstance = axios.create({
	baseURL: API_BASE,
	withCredentials: true,
});

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error?.config as
			| (InternalAxiosRequestConfig & { __didLocalApiFallback?: boolean })
			| undefined;
		const requestBaseUrl = String(
			originalRequest?.baseURL || axiosInstance.defaults.baseURL || '',
		).replace(/\/+$/, '');
		const requestUrl = String(originalRequest?.url || '');
		const isLocalDevApiRequest =
			requestBaseUrl === LOCAL_DEV_API_BASE ||
			requestUrl.startsWith(`${LOCAL_DEV_API_BASE}/`) ||
			requestUrl.startsWith(LOCAL_DEV_API_BASE);
		const shouldRetryAgainstRemote =
			shouldUseLocalDevApi &&
			!error?.response &&
			originalRequest &&
			!originalRequest.__didLocalApiFallback &&
			isLocalDevApiRequest &&
			Boolean(REMOTE_API_BASE) &&
			REMOTE_API_BASE !== LOCAL_DEV_API_BASE;

		if (!shouldRetryAgainstRemote) {
			return Promise.reject(error);
		}

		const retryConfig = {
			...originalRequest,
			baseURL: REMOTE_API_BASE,
		} as InternalAxiosRequestConfig & { __didLocalApiFallback: boolean };
		retryConfig.__didLocalApiFallback = true;

		return axiosInstance.request(retryConfig);
	},
);

axiosInstance.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = getStoredAccessToken();

		if (token) {
			config.headers = config.headers || {};
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

export type ApiRequestConfig = AxiosRequestConfig;

function createAxiosService(instance: AxiosInstance) {
	return {
		async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
			const response: AxiosResponse<T> = await instance.get(url, config);
			return response.data;
		},

		async post<T, D = unknown>(
			url: string,
			data?: D,
			config?: AxiosRequestConfig,
		): Promise<T> {
			const response: AxiosResponse<T> = await instance.post(url, data, config);
			return response.data;
		},

		async patch<T, D = unknown>(
			url: string,
			data?: D,
			config?: AxiosRequestConfig,
		): Promise<T> {
			const response: AxiosResponse<T> = await instance.patch(
				url,
				data,
				config,
			);
			return response.data;
		},

		async put<T, D = unknown>(
			url: string,
			data?: D,
			config?: AxiosRequestConfig,
		): Promise<T> {
			const response: AxiosResponse<T> = await instance.put(url, data, config);
			return response.data;
		},

		async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
			const response: AxiosResponse<T> = await instance.delete(url, config);
			return response.data;
		},

		setAuthentication(token?: string) {
			if (token) {
				localStorage.setItem('accessToken', token);
				axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
			} else {
				localStorage.removeItem('accessToken');
				delete axiosInstance.defaults.headers.common.Authorization;
			}
		},
	};
}

export const axiosService = createAxiosService(axiosInstance);

const existingToken = getStoredAccessToken();
if (existingToken) {
	axiosInstance.defaults.headers.common.Authorization = `Bearer ${existingToken}`;
}

export default axiosInstance;
