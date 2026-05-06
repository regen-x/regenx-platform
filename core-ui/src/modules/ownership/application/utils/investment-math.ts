export const TOKEN_DECIMALS = 6;

export const roundDown = (value: number, decimals = TOKEN_DECIMALS): number => {
	if (!Number.isFinite(value)) return 0;
	const factor = 10 ** decimals;
	return Math.floor((value + Number.EPSILON) * factor) / factor;
};

export const calculateTokenAmount = (
	audAmount: number,
	tokenPrice: number,
): number => {
	if (!Number.isFinite(audAmount) || audAmount <= 0) return 0;
	if (!Number.isFinite(tokenPrice) || tokenPrice <= 0) return 0;
	return roundDown(audAmount / tokenPrice, TOKEN_DECIMALS);
};
