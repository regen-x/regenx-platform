import { Keypair } from '@stellar/stellar-sdk';
import { useState } from 'react';
import { connectWallet, signTransaction } from 'simple-stellar-signer-api';

import { SIMPLE_SIGNER_URL } from '@/constants/common/environment';
import { setPublicKey, useStellarStore } from '@/store/stellar.store';

export const useSimpleSigner = () => {
	const { publicKey } = useStellarStore();
	const [loading, setLoading] = useState(false);

	const handleConnectWallet = async () => {
		try {
			setLoading(true);
			const { publicKey } = await connectWallet(SIMPLE_SIGNER_URL);

			if (Keypair.fromPublicKey(publicKey)) {
				setPublicKey(publicKey);
			}
		} catch (error: unknown) {
			const err = error as Error;
			console.error('Error at handleConnectWallet', err);
			if (err.message.includes('User cancelled process')) {
				throw new Error('SIMPLE_SIGNER_CONNECT_CANCELLED');
			}
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const handleSignTransaction = async (xdr: string, description: string) => {
		try {
			setLoading(true);
			return await signTransaction(xdr, SIMPLE_SIGNER_URL, {
				description,
			});
		} catch (error: unknown) {
			const err = error as Error;
			console.error(err);
			if (err.message.includes('User cancelled process')) {
				throw new Error('SIMPLE_SIGNER_SIGN_CANCELLED');
			}
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return {
		publicKey,
		loading,
		handleConnectWallet,
		handleSignTransaction,
	};
};
