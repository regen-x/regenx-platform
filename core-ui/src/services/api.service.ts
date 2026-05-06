import { AxiosRequestConfig } from 'axios';

import { axiosService } from '@/configs/axios';
import { IHTTPRequestService } from '@/interfaces/IHTTPRequestService';
import { IApiService } from '@/interfaces/services/IApiService';

class ApiService<C = unknown> implements IApiService<C> {
	httpService: IHTTPRequestService<C>;
	constructor(httpService: IHTTPRequestService<C>) {
		this.httpService = httpService;
	}
	get<T>(url: string, config?: C): Promise<T> {
		return this.httpService.get<T>(url, config);
	}
	post<T = unknown, K = unknown>(url: string, body: K, config?: C): Promise<T> {
		return this.httpService.post<T>(url, body, config);
	}
	patch<T = unknown, K = unknown>(
		url: string,
		body: K,
		config?: C,
	): Promise<T> {
		return this.httpService.patch<T>(url, body, config);
	}
	put<T = unknown, K = unknown>(url: string, body: K, config?: C): Promise<T> {
		return this.httpService.put<T>(url, body, config);
	}
	delete<T = unknown>(url: string, config?: C): Promise<T> {
		return this.httpService.delete<T>(url, config);
	}
	setAuthentication(token: string) {
		return this.httpService.setAuthentication(token);
	}
}

export type ApiRequestConfig = AxiosRequestConfig;
export const apiService = new ApiService<ApiRequestConfig>(axiosService);
