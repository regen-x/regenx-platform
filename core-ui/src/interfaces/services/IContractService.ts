import { ISingleResponse } from '../api/IApiBaseResponse';

export interface ICreateTransfer {
	investorAddress: string;
	amount: number;
	tokenAddress: string;
	tokenAmount?: number;
	cashAmount?: number;
	feeAmount?: number;
	totalAmount?: number;
}

export interface ISubmitTransfer {
	signedXdr: string;
	projectUuid: string;
	amount: number;
	buyerAddress: string;
}

export interface ITransferXdr {
	transactionXdr: string;
}

export interface IContractService {
	createTransferXdr(
		transfer: ICreateTransfer,
	): Promise<ISingleResponse<ITransferXdr>>;

	submitTransferSignedXdr(transfer: ISubmitTransfer): Promise<void>;

	createXlmPaymentXdr(
		transfer: ICreateTransfer,
	): Promise<ISingleResponse<ITransferXdr>>;

	submitXlmPaymentSignedXdr(transfer: ISubmitTransfer): Promise<void>;
}
