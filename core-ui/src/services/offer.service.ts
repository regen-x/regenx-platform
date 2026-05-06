import { ApiRequestConfig, apiService } from './api.service';

import {
	IListResponse,
	ISingleResponse,
} from '@/interfaces/api/IApiBaseResponse';
import { IOffer, IOfferXdr, IOfferXdrType } from '@/interfaces/api/IOffer';
import { IApiService } from '@/interfaces/services/IApiService';
import {
	ICreateOffer,
	IGetOfferList,
	IOfferService,
} from '@/interfaces/services/IOfferService';

class OfferService implements IOfferService {
	api: IApiService<ApiRequestConfig>;

	constructor(api: IApiService<ApiRequestConfig>) {
		this.api = api;
	}

	async getOffer(id: string): Promise<ISingleResponse<IOffer>> {
		return await this.api.get<ISingleResponse<IOffer>>(`/offer/${id}`);
	}

	async getOfferList({
		page,
		tokenSymbol,
		userAddress,
		price,
		isActive,
		excludeAddress,
	}: IGetOfferList = {}): Promise<IListResponse<IOffer>> {
		const params: Record<string, string | number | boolean> = {};

		if (page) {
			params['page[number]'] = page;
		}

		if (userAddress) {
			params['filter[userAddress]'] = userAddress;
		}

		if (tokenSymbol) {
			params['filter[tokenSymbol]'] = tokenSymbol;
		}

		if (price) {
			params['filter[price]'] = price;
		}

		if (isActive) {
			params['filter[isActive]'] = isActive;
		}

		if (excludeAddress) {
			params['filter[excludeAddress]'] = excludeAddress;
		}

		return await this.api.get<IListResponse<IOffer>>(`/offer`, { params });
	}

	async createOfferXdr(
		offer: ICreateOffer,
	): Promise<ISingleResponse<IOfferXdr>> {
		return await this.api.post<ISingleResponse<IOfferXdr>>(`/offer`, offer);
	}

	async createBuyOfferXdr(
		offerUuid: string,
		userAddress: string,
	): Promise<ISingleResponse<IOfferXdr>> {
		return await this.api.post<ISingleResponse<IOfferXdr>>(
			`/offer/${offerUuid}/buy`,
			{ buyerAddress: userAddress },
		);
	}

	async createUpdateOfferPriceXdr(
		offerUuid: string,
		price: number,
		userAddress: string,
	): Promise<ISingleResponse<IOfferXdr>> {
		return await this.api.post<ISingleResponse<IOfferXdr>>(
			`/offer/${offerUuid}/price`,
			{ price, userAddress },
		);
	}

	async createDeactivateOfferXdr(
		offerUuid: string,
		userAddress: string,
	): Promise<ISingleResponse<IOfferXdr>> {
		return await this.api.post<ISingleResponse<IOfferXdr>>(
			`/offer/${offerUuid}/cancel`,
			{ userAddress },
		);
	}

	async submitOfferSignedXdr(
		xdr: string,
		type: IOfferXdrType,
		userAddress: string,
	): Promise<ISingleResponse<IOffer>> {
		return await this.api.post<ISingleResponse<IOffer>>(`/offer/submit`, {
			xdr,
			type,
			userAddress,
		});
	}
}
export const offerService = new OfferService(apiService);
