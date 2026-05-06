import { axiosService } from '@/configs/axios';

export const investmentService = {
	async submitPurchase(payload: {
		projectId: number;
		seriesId: number;
		tokenSymbol: string;
		amount: number;
		custodyType: 'self_custody' | 'regenx_custody';
		walletAddress?: string | null;
		sellerWalletAddress?: string | null;
		signedXdr: string;
	}) {
		return axiosService.post('/ownership/buy/submit-transaction', payload);
	},

	async buildTransaction(payload: {
		projectId: number;
		seriesId: number;
		tokenSymbol: string;
		amount: number;
		custodyType: 'self_custody' | 'regenx_custody';
		walletAddress?: string | null;
		sellerWalletAddress?: string | null;
	}) {
		return axiosService.post('/ownership/buy/build-transaction', payload);
	},
};
