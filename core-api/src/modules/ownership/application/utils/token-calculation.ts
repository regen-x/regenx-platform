export const calculateAudFromTokens = (tokenAmount: number, tokenPrice: number) => {
  if (!Number.isFinite(tokenAmount) || !Number.isFinite(tokenPrice)) return 0;
  return Number(tokenAmount) * Number(tokenPrice);
};
