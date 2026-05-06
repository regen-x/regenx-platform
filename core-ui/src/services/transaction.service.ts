import { ApiRequestConfig, apiService } from './api.service';

import { SortOrder } from '@/constants/enum/sort-order.enum';
import { IListResponse } from '@/interfaces/api/IApiBaseResponse';
import { ITransaction } from '@/interfaces/api/ITransaction';
import { IApiService } from '@/interfaces/services/IApiService';
import { ITransactionService } from '@/interfaces/services/ITransactionService';
import { IGetTransactions } from '@/interfaces/services/ITransactionService';

class TransactionService implements ITransactionService {
	api: IApiService<ApiRequestConfig>;

	constructor(api: IApiService<ApiRequestConfig>) {
		this.api = api;
	}

	private buildParams({
		page,
		projectUuid,
		type,
		status,
		dateFrom,
		dateTo,
		sortBy,
		sortOrder,
	}: IGetTransactions) {
		const params: Record<string, string | number | boolean> = {};

		if (page) {
			params['page[number]'] = page;
		}

		if (projectUuid) {
			params['filter[projectUuid]'] = projectUuid;
		}

		if (type) {
			params['filter[type]'] = type;
		}

		if (status) {
			params['filter[status]'] = status;
		}

		if (dateFrom) {
			params['filter[dateFrom]'] = dateFrom;
		}

		if (dateTo) {
			params['filter[dateTo]'] = dateTo;
		}

		if (sortBy) {
			params[`sort[${sortBy}]`] = sortOrder || SortOrder.DESC;
		}

		return params;
	}

	async getMyTransactions(
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>> {
		return await this.api.get<IListResponse<ITransaction>>(`/transactions/me`, {
			params: this.buildParams(config),
		});
	}

	async getProjectTransactions(
		projectId: number | string,
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>> {
		return await this.api.get<IListResponse<ITransaction>>(
			`/transactions/project/${projectId}`,
			{
				params: this.buildParams(config),
			},
		);
	}

	async getDeveloperTransactions(
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>> {
		return await this.api.get<IListResponse<ITransaction>>(
			`/transactions/developer/me`,
			{
				params: this.buildParams(config),
			},
		);
	}

	async getTransactions(
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>> {
		return await this.api.get<IListResponse<ITransaction>>(`/transactions`, {
			params: this.buildParams(config),
		});
	}

	async createCashRequest(payload: {
		type: 'DEPOSIT' | 'WITHDRAWAL';
		amount: number;
		currency?: string;
		description?: string;
	}) {
		return await this.api.post(`/transactions/cash-request`, payload);
	}
}

export const transactionService = new TransactionService(apiService);
