import { IListResponse, ISingleResponse } from '../api/IApiBaseResponse';
import { IOffer, IOfferXdr, IOfferXdrType } from '../api/IOffer';

export interface ICreateOffer {
	price: number;
	amount: number;
	projectUuid: string;
	userAddress: string;
}

export interface IEditOfferPrice {
	price: number;
}

export interface IGetOfferList {
	page?: number;
	tokenSymbol?: string;
	userAddress?: string;
	price?: number;
	isActive?: boolean;
	excludeAddress?: string;
}

export interface IOfferService {
	getOfferList(config?: IGetOfferList): Promise<IListResponse<IOffer>>;
	getOffer(id: string): Promise<ISingleResponse<IOffer>>;
	createOfferXdr(offer: ICreateOffer): Promise<ISingleResponse<IOfferXdr>>;
	createBuyOfferXdr(
		offerUuid: string,
		userAddress: string,
	): Promise<ISingleResponse<IOfferXdr>>;
	createUpdateOfferPriceXdr(
		offerUuid: string,
		price: number,
		userAddress: string,
	): Promise<ISingleResponse<IOfferXdr>>;
	createDeactivateOfferXdr(
		offerUuid: string,
		userAddress: string,
	): Promise<ISingleResponse<IOfferXdr>>;
	submitOfferSignedXdr(
		xdr: string,
		type: IOfferXdrType,
		userAddress: string,
	): Promise<ISingleResponse<IOffer>>;
}
