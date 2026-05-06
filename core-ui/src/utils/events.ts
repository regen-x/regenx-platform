export const emitHoldingsUpdated = () => {
	window.dispatchEvent(new Event('regenx_holdings_updated'));
};

export const onHoldingsUpdated = (callback: () => void) => {
	window.addEventListener('regenx_holdings_updated', callback);
};

export const offHoldingsUpdated = (callback: () => void) => {
	window.removeEventListener('regenx_holdings_updated', callback);
};
