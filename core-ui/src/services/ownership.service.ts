import { axiosService } from '@/configs/axios';

export const ownershipService = {
	async getMyHoldings(): Promise<any> {
		return axiosService.get('/ownership/me');
	},

	async buyPosition(data: {
		projectId: number;
		seriesId: number;
		tokenSymbol: string;
		amount: number;
		cashAmount?: number;
		feeAmount?: number;
		custodyType?: 'self_custody' | 'regenx_custody';
		walletAddress?: string | null;
		custodyAccountRef?: string | null;
		sellerWalletAddress?: string | null;
	}): Promise<any> {
		return axiosService.post('/ownership/buy', data);
	},

	async buildBuyTransaction(data: {
		projectId: number;
		seriesId: number;
		tokenSymbol: string;
		amount: number;
		cashAmount?: number;
		feeAmount?: number;
		orderId?: number;
		custodyType: 'self_custody' | 'regenx_custody';
		walletAddress?: string | null;
		sellerWalletAddress?: string | null;
	}): Promise<any> {
		return axiosService.post('/ownership/buy/build-transaction', data);
	},

	async submitBuyTransaction(data: {
		projectId: number;
		seriesId: number;
		tokenSymbol: string;
		amount: number;
		cashAmount?: number;
		feeAmount?: number;
		orderId?: number;
		custodyType: 'self_custody' | 'regenx_custody';
		walletAddress?: string | null;
		sellerWalletAddress?: string | null;
		signedXdr: string;
	}): Promise<any> {
		return axiosService.post('/ownership/buy/submit-transaction', data);
	},
};
