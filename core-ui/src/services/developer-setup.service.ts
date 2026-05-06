import { axiosService } from '@/configs/axios';

class DeveloperSetupService {
	async getMyProfile() {
		return axiosService.get('/developer-profile/me');
	}

	async createProfile(payload: Record<string, unknown>) {
		return axiosService.post('/developer-profile', payload);
	}

	async updateProfile(id: string | number, payload: Record<string, unknown>) {
		return axiosService.patch(`/developer-profile/${id}`, payload);
	}

	async submitProfile(id: string | number) {
		return axiosService.post(`/developer-profile/${id}/submit`, {});
	}
}

export const developerSetupService = new DeveloperSetupService();
