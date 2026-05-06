import { ApiRequestConfig, apiService } from './api.service';

import { UserType } from '@/constants/enum/user-type.enum';
import {
	IListResponse,
	ISingleResponse,
} from '@/interfaces/api/IApiBaseResponse';
import { IProject } from '@/interfaces/api/IProject';
import { IUser } from '@/interfaces/api/IUser';
import { IApiService } from '@/interfaces/services/IApiService';
import { IUserService } from '@/interfaces/services/IUserService';

interface IGetUserList {
	page?: number;
	fullname?: string;
	type?: UserType;
	walletManagerUuid?: string;
}

class UserService implements IUserService {
	api: IApiService<ApiRequestConfig>;

	constructor(api: IApiService<ApiRequestConfig>) {
		this.api = api;
	}

	async getCurrentUser(
		config?: ApiRequestConfig,
	): Promise<ISingleResponse<IUser>> {
		return await this.api.get<ISingleResponse<IUser>>('/user/me', config);
	}

	async updateCurrentUser(
		userUpdates: Partial<IUser>,
	): Promise<ISingleResponse<IUser>> {
		return await this.api.patch<ISingleResponse<IUser>>(
			`/user/me`,
			userUpdates,
		);
	}

	async getUserList({
		page,
		fullname,
		type,
		walletManagerUuid,
	}: IGetUserList = {}): Promise<IListResponse<IUser>> {
		const params: Record<string, string | number> = {};

		if (page) {
			params['page[number]'] = page;
		}

		if (fullname) {
			params['filter[fullname]'] = fullname;
		}

		if (type) {
			params['filter[type]'] = type;
		}

		if (walletManagerUuid) {
			params['filter[walletManagerUuid]'] = walletManagerUuid;
		}

		return await this.api.get<IListResponse<IUser>>('/user', { params });
	}

	async createAddManagerTransaction(
		managerUuid: string,
	): Promise<ISingleResponse<{ transactionXdr: string }>> {
		return await this.api.post<ISingleResponse<{ transactionXdr: string }>>(
			`/user/me/wallet-manager/transaction`,
			{
				managerUuid,
			},
		);
	}

	async submitAddManagerTransaction(
		managerUuid: string,
		transactionXdr: string,
	): Promise<ISingleResponse<IUser>> {
		return await this.api.post<ISingleResponse<IUser>>(
			`/user/me/wallet-manager`,
			{ managerUuid, transactionXdr },
		);
	}

	async getUserPortfolio(
		userAddress: string,
	): Promise<IListResponse<IProject>> {
		return await this.api.get<IListResponse<IProject>>(
			`/user/${userAddress}/portfolio`,
		);
	}
}

export const userService = new UserService(apiService);
