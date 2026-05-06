import { IListResponse } from '../api/IApiBaseResponse';
import { ITransaction } from '../api/ITransaction';

import { SortOrder } from '@/constants/enum/sort-order.enum';
import {
	TransactionStatus,
	TransactionType,
} from '@/constants/enum/transaction-type.enum';

export interface IGetTransactions {
	page?: number;
	projectUuid?: string;
	type?: TransactionType;
	status?: TransactionStatus;
	dateFrom?: string;
	dateTo?: string;
	sortBy?: string;
	sortOrder?: SortOrder;
}

export interface ITransactionService {
	getMyTransactions(
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>>;

	getProjectTransactions(
		projectId: number | string,
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>>;

	getDeveloperTransactions(
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>>;

	getTransactions(
		config: IGetTransactions,
	): Promise<IListResponse<ITransaction>>;

	createCashRequest(payload: {
		type: 'DEPOSIT' | 'WITHDRAWAL';
		amount: number;
		currency?: string;
		description?: string;
	}): Promise<any>;
}
