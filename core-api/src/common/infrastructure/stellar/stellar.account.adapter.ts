import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Address,
  Asset,
  Horizon,
  Keypair,
  Operation,
  xdr,
} from '@stellar/stellar-sdk';

@Injectable()
export class StellarAccountAdapter {
  private readonly stellarServer: Horizon.Server;

  constructor(private readonly environmentConfig: ConfigService) {
    const serverUrl = this.environmentConfig.get('stellar.serverUrl');
    this.stellarServer = new Horizon.Server(serverUrl, {
      allowHttp: true,
    });
  }

  async getAccount(publicKey: string): Promise<Horizon.AccountResponse> {
    return await this.stellarServer.loadAccount(publicKey);
  }

  getKeypair(secretKey: string): Keypair {
    return Keypair.fromSecret(secretKey);
  }

  createChangeTrustOperation(publicKey: string, asset: Asset): string {
    return Operation.changeTrust({
      source: publicKey,
      asset,
    }).toXDR('base64');
  }

  getAddress(addressValue: xdr.ScAddress): Address {
    return Address.fromScAddress(addressValue);
  }
}
