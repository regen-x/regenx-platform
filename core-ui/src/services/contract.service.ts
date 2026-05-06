import { ApiRequestConfig, apiService } from './api.service';

import { SOROBAN_TOKEN_EXPONENT } from '@/constants/common/stellar';
import { ISingleResponse } from '@/interfaces/api/IApiBaseResponse';
import { IApiService } from '@/interfaces/services/IApiService';
import {
	IContractService,
	ICreateTransfer,
	ISubmitTransfer,
	ITransferXdr,
} from '@/interfaces/services/IContractService';

class ContractService implements IContractService {
	api: IApiService<ApiRequestConfig>;

	constructor(api: IApiService<ApiRequestConfig>) {
		this.api = api;
	}

	async createTransferXdr(
		transfer: ICreateTransfer,
	): Promise<ISingleResponse<ITransferXdr>> {
		const { amount } = transfer;

		return await this.api.post<ISingleResponse<ITransferXdr>>(
			`/contract/transfer/transaction`,
			{ ...transfer, amount: amount * SOROBAN_TOKEN_EXPONENT },
		);
	}

	async createXlmPaymentXdr(
		transfer: ICreateTransfer,
	): Promise<ISingleResponse<ITransferXdr>> {
		const { amount, investorAddress } = transfer;

		return await this.api.post<ISingleResponse<ITransferXdr>>(
			`/contract/xlm-payment/transaction`,
			{ investorAddress, amount },
		);
	}

	async submitXlmPaymentSignedXdr(transfer: ISubmitTransfer): Promise<void> {
		return await this.api.post<void>(`/contract/xlm-payment`, transfer);
	}

	async submitTransferSignedXdr(transfer: ISubmitTransfer): Promise<void> {
		return await this.api.post<void>(`/contract/transfer`, transfer);
	}
}

export const contractService = new ContractService(apiService);
