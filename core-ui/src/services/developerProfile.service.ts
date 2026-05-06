import { axiosService } from '@/configs/axios';

type AnyResponse = any;

export const developerProfileService = {
	async getMine(): Promise<AnyResponse> {
		return axiosService.get<AnyResponse>('/developer-profile/me');
	},

	async save(data: any): Promise<AnyResponse> {
		return axiosService.post<AnyResponse, any>('/developer-profile', data);
	},

	async submit(): Promise<AnyResponse> {
		return axiosService.post<AnyResponse, any>('/developer-profile/submit', {});
	},
};
