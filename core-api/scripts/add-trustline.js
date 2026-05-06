const {
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  Horizon,
  TransactionBuilder,
  Asset,
} = require('@stellar/stellar-sdk');

async function main() {
  console.log("STARTING TRUSTLINE SCRIPT");

  const horizonUrl =
    process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
  const networkPassphrase =
    process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

  const recipientSecret = process.env.STELLAR_RECIPIENT_SECRET;
  const issuerPublicKey = process.env.STELLAR_ISSUER_PUBLIC;
  const assetCode = process.env.STELLAR_ASSET_CODE || 'BAT01';

  console.log("ENV CHECK:");
  console.log({ horizonUrl, assetCode, issuerPublicKey });

  if (!recipientSecret) throw new Error('Missing STELLAR_RECIPIENT_SECRET');
  if (!issuerPublicKey) throw new Error('Missing STELLAR_ISSUER_PUBLIC');

  const server = new Horizon.Server(horizonUrl);
  const recipientKeypair = Keypair.fromSecret(recipientSecret);
  const recipientPublicKey = recipientKeypair.publicKey();

  console.log("Recipient:", recipientPublicKey);

  console.log("Loading account...");
  const account = await server.loadAccount(recipientPublicKey);

  console.log("Account loaded");

  const fee = await server.fetchBaseFee().catch(() => BASE_FEE);

  const tx = new TransactionBuilder(account, {
    fee: String(fee),
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset: new Asset(assetCode, issuerPublicKey),
      }),
    )
    .setTimeout(180)
    .build();

  console.log("Signing tx...");
  tx.sign(recipientKeypair);

  console.log("Submitting tx...");
  const result = await server.submitTransaction(tx);

  console.log("SUCCESS:", result.hash);
}

main().catch((error) => {
  console.error("ERROR:");
  console.error(error.message);
  console.error(error.response?.data || null);
  process.exit(1);
});
