import {
	Asset,
	Horizon,
	Operation,
	TransactionBuilder,
} from '@stellar/stellar-sdk';

import {
	STELLAR_HORIZON_URL,
	STELLAR_NETWORK_PASSPHRASE,
} from '@/constants/common/environment';

class StellarService {
	private server: Horizon.Server;

	constructor() {
		this.server = new Horizon.Server(STELLAR_HORIZON_URL);
	}

	async createAddTrustlineTransactionXdr(
		accountAddress: string,
		tokenIssuer: string,
		tokenCode: string,
	) {
		try {
			const account = await this.server.loadAccount(accountAddress);

			const transaction = new TransactionBuilder(account, {
				fee: (await this.server.fetchBaseFee()).toString(),
				networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
			})
				.addOperation(
					Operation.changeTrust({
						asset: new Asset(tokenCode, tokenIssuer),
					}),
				)
				.setTimeout(180);

			return transaction.build().toXDR();
		} catch (err) {
			console.error(err);
			throw new Error(
				'There was an error creating the add trustline transaction',
			);
		}
	}

	async submitTransactionXdr(xdr: string) {
		try {
			const transaction = TransactionBuilder.fromXDR(xdr, 'base64');
			await this.server.submitTransaction(transaction);
		} catch (err) {
			console.error(err);
			throw new Error('There was an error submitting the transaction');
		}
	}

	async getTokenBalanceForAccount(
		accountAddress: string,
		tokenIssuer: string,
		tokenCode: string,
	): Promise<number> {
		try {
			const account = await this.server.loadAccount(accountAddress);

			if (tokenCode === 'XLM') {
				return Number(
					account.balances.find((balance) => balance.asset_type === 'native')
						?.balance || '0',
				);
			}

			return Number(
				account.balances.find(
					(balance) =>
						(balance.asset_type === 'credit_alphanum4' ||
							balance.asset_type === 'credit_alphanum12') &&
						balance.asset_code === tokenCode &&
						balance.asset_issuer === tokenIssuer,
				)?.balance || '0',
			);
		} catch (err) {
			console.error(err);
			throw new Error('There was an error getting the wallet balance');
		}
	}

	async checkTrustline(
		accountAddress: string,
		tokenIssuer: string,
		tokenCode: string,
	) {
		try {
			const account = await this.server.loadAccount(accountAddress);

			if (tokenCode === 'XLM') {
				return account.balances.some(
					(balance) => balance.asset_type === 'native',
				);
			}

			return account.balances.some(
				(balance) =>
					(balance.asset_type === 'credit_alphanum4' ||
						balance.asset_type === 'credit_alphanum12') &&
					balance.asset_code === tokenCode &&
					balance.asset_issuer === tokenIssuer,
			);
		} catch (err) {
			console.error(err);
			throw new Error('There was an error checking the trustline');
		}
	}
}

export const stellarService = new StellarService();
