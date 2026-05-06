export function getStellarExpertNetwork(): 'testnet' | 'public' {
	const rawNetwork = String(
		(import.meta as any)?.env?.VITE_STELLAR_NETWORK || 'testnet',
	)
		.trim()
		.toLowerCase();

	if (
		rawNetwork === 'mainnet' ||
		rawNetwork === 'public' ||
		rawNetwork === 'pubnet'
	) {
		return 'public';
	}

	return 'testnet';
}

export function getAssetUrl(
	assetCode?: string | null,
	assetIssuer?: string | null,
) {
	const code = String(assetCode || '').trim();
	const issuer = String(assetIssuer || '').trim();

	if (!code || !issuer) {
		return null;
	}

	const network = getStellarExpertNetwork();
	return `https://stellar.expert/explorer/${network}/asset/${encodeURIComponent(
		code,
	)}-${encodeURIComponent(issuer)}`;
}

export function getTransactionUrl(txHash?: string | null) {
	const hash = String(txHash || '').trim();

	if (!hash) {
		return null;
	}

	const network = getStellarExpertNetwork();
	return `https://stellar.expert/explorer/${network}/tx/${encodeURIComponent(
		hash,
	)}`;
}
