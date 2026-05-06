import { IBase } from './IBase';
import { IProject } from './IProject';

export interface IOffer extends IBase {
	price: number;
	amount: number;
	user: string;
	sellerDisplayName?: string;
	quantity?: number;
	remainingQuantity?: number;
	pricePerToken?: number;
	totalValue?: number;
	status?:
		| 'DRAFT'
		| 'LIVE'
		| 'PARTIALLY_FILLED'
		| 'FILLED'
		| 'CANCELLED'
		| 'EXPIRED'
		| 'FAILED';
	tokenSymbol?: string;
	projectName?: string;
	project: Pick<
		IProject,
		| 'id'
		| 'name'
		| 'tokenAddress'
		| 'tokenSymbol'
		| 'tokenSupply'
		| 'assetCode'
		| 'assetIssuer'
		| 'status'
	>;
	isActive: boolean;
}

export interface IOfferXdr {
	transactionXdr: string;
}

export interface IOfferFilterOptions {
	tokenSymbol?: string;
	userAddress?: string;
	isActive?: boolean;
	excludeAddress?: string;
}

export type IOfferXdrType =
	| 'create_offer'
	| 'buy_offer'
	| 'update_offer'
	| 'cancel_offer';
