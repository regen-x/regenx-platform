import {
	Asset,
	Horizon,
	Networks,
	Operation,
	TransactionBuilder,
} from '@stellar/stellar-sdk';

const HORIZON_URL =
	(import.meta as any)?.env?.VITE_HORIZON_URL ||
	'https://horizon-testnet.stellar.org';

const NETWORK_PASSPHRASE =
	(import.meta as any)?.env?.VITE_STELLAR_NETWORK_PASSPHRASE ||
	Networks.TESTNET;

const server = new Horizon.Server(HORIZON_URL);

export async function hasTrustline(
	accountId: string,
	assetCode: string,
	issuer: string,
): Promise<boolean> {
	const account = await server.loadAccount(accountId);

	return account.balances.some(
		(balance: any) =>
			balance.asset_type !== 'native' &&
			balance.asset_code === assetCode &&
			balance.asset_issuer === issuer,
	);
}

export async function buildAddTrustlineXdr(
	accountId: string,
	assetCode: string,
	issuer: string,
): Promise<string> {
	const account = await server.loadAccount(accountId);
	const asset = new Asset(assetCode, issuer);

	const tx = new TransactionBuilder(account, {
		fee: '100',
		networkPassphrase: NETWORK_PASSPHRASE,
	})
		.addOperation(
			Operation.changeTrust({
				asset,
			}),
		)
		.setTimeout(180)
		.build();

	return tx.toXDR();
}

export async function submitSignedXdr(signedXdr: string) {
	const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
	return server.submitTransaction(tx);
}
