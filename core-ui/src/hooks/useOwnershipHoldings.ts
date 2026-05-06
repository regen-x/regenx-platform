import { useCallback, useEffect, useState } from 'react';

import { ownershipService } from '@/services/ownership.service';

export type OwnershipRow = {
	projectId: number;
	seriesId: number;
	projectName: string;
	tokenSymbol: string;
	assetCode?: string;
	assetIssuer?: string | null;
	issuer?: string | null;
	status?: string;
	projectStatus?: string;
	custodyType: 'self_custody' | 'regenx_custody';
	ownershipSource?: 'ON_CHAIN' | 'INTERNAL_LEDGER';
	settlementStatus?:
		| 'PENDING'
		| 'SUBMITTED'
		| 'SETTLED'
		| 'FAILED'
		| 'CANCELLED';
	totalTokens: number | string;
	totalValue?: number | string;
	tokenPrice?: number | string;
};

export function useOwnershipHoldings() {
	const [rows, setRows] = useState<OwnershipRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const refreshHoldings = useCallback(async () => {
		try {
			setIsLoading(true);
			const res = await ownershipService.getMyHoldings();
			const data = (res as any)?.data ?? res ?? [];
			const sanitizedRows = Array.isArray(data)
				? data
						.map((row) => {
							const totalTokens = Number((row as any)?.totalTokens ?? 0);
							const totalValueRaw =
								(row as any)?.totalValue == null
									? null
									: Number((row as any)?.totalValue);
							const tokenPriceRaw =
								(row as any)?.tokenPrice == null
									? null
									: Number((row as any)?.tokenPrice);

							return {
								...row,
								totalTokens:
									Number.isFinite(totalTokens) && totalTokens >= 0
										? totalTokens
										: 0,
								totalValue:
									totalValueRaw != null &&
									Number.isFinite(totalValueRaw) &&
									totalValueRaw >= 0
										? totalValueRaw
										: null,
								tokenPrice:
									tokenPriceRaw != null &&
									Number.isFinite(tokenPriceRaw) &&
									tokenPriceRaw >= 0
										? tokenPriceRaw
										: null,
							};
						})
						.filter((row) => Number(row.totalTokens) > 0)
				: [];

			setRows(sanitizedRows);
			return sanitizedRows;
		} catch (error) {
			console.error('Failed to load investor holdings', error);
			setRows([]);
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		refreshHoldings();
	}, [refreshHoldings]);

	return {
		rows,
		setRows,
		isLoading,
		refreshHoldings,
	};
}
