export const launchSumsub = async () => {
	try {
		console.log('Launching Sumsub...');

		// TODO: replace with real backend call later
		// const res = await api.get('/verification/sumsub-link');
		// const url = res.data.url;

		const url = 'https://example.sumsub.com'; // TEMP

		if (!url) {
			alert('Verification link not available');
			return;
		}

		window.open(url, '_blank', 'noopener,noreferrer');
	} catch (err) {
		console.error('Failed to launch Sumsub', err);
		alert('Failed to start verification');
	}
};
