import { axiosService } from '@/configs/axios';
import {
	IDistribution,
	IDistributionSummary,
} from '@/interfaces/api/IDistribution';

export const distributionService = {
	async getMyDistributions(): Promise<IDistribution[]> {
		const response = await axiosService.get('/distributions/me');
		return (response as any)?.data ?? response ?? [];
	},

	async getProjectDistributions(
		projectId: string | number,
	): Promise<IDistribution[]> {
		const response = await axiosService.get(
			`/distributions/project/${projectId}`,
		);
		return (response as any)?.data ?? response ?? [];
	},

	async getMySummary(): Promise<IDistributionSummary> {
		const response = await axiosService.get('/distributions/summary/me');
		return (response as any)?.data ?? response ?? {};
	},
};
