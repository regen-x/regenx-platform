import { Injectable } from '@nestjs/common';
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

@Injectable()
export class StellarService {
  private server: Horizon.Server;
  private networkPassphrase: string;

  constructor() {
    this.server = new Horizon.Server(
      process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    );
    this.networkPassphrase =
      process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
  }

  async transferAsset(params: {
    fromSecret: string;
    toPublic: string;
    assetCode: string;
    amount: string;
  }): Promise<string> {
    if (!params.fromSecret) {
      throw new Error('Missing fromSecret');
    }

    const sender = Keypair.fromSecret(params.fromSecret);
    const account = await this.server.loadAccount(sender.publicKey());
    const fee = await this.server.fetchBaseFee().catch(() => BASE_FEE);

    const asset = new Asset(params.assetCode, sender.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: String(fee),
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: params.toPublic,
          asset,
          amount: params.amount,
        }),
      )
      .setTimeout(180)
      .build();

    tx.sign(sender);

    const result = await this.server.submitTransaction(tx);
    return result.hash;
  }
}
