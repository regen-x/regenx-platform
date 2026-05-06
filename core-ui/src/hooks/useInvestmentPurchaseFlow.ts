import { useState } from 'react';

import { investmentService } from '@/services/investment.service';

type SubmitArgs = {
	projectId: number;
	seriesId: number;
	tokenSymbol: string;
	amount: number;
	custodyType: 'self_custody' | 'regenx_custody';
	walletAddress?: string | null;
	sellerWalletAddress?: string | null;
	signedXdr: string;
};

export function useInvestmentPurchaseFlow(
	onSuccess?: () => Promise<void> | void,
) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const submitPurchase = async (payload: SubmitArgs) => {
		try {
			setIsSubmitting(true);
			const res = await investmentService.submitPurchase(payload);
			if (onSuccess) {
				await onSuccess();
			}
			return res;
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		isSubmitting,
		submitPurchase,
	};
}
