import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Horizon, Keypair } from '@stellar/stellar-sdk';
import axios from 'axios';

import { CustodyProvider } from '../interfaces/custody-provider.interface';

@Injectable()
export class TestnetStellarCustodyProvider implements CustodyProvider {
  constructor(private readonly configService: ConfigService) {}

  private assertNonProduction() {
    if (process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException(
        'Testnet Stellar custody provider is disabled in production',
      );
    }
  }

  private serverUrl() {
    return (
      this.configService.get<string>('stellar.serverUrl') ||
      'https://horizon-testnet.stellar.org'
    );
  }

  async createInvestorAccount(input: { investorId: string; userId?: string; fundId?: string }) {
    this.assertNonProduction();

    /*
     * TESTNET ONLY. This provider exists for MVP and local testing.
     * Production custody must use an institutional custody provider such as
     * Fireblocks or Zodia.
     *
     * The generated secret key is intentionally not returned, logged, or stored
     * in investor_custody_accounts. Production private keys must never be stored
     * by RegenX.
     */
    const keypair = Keypair.random();
    const publicAddress = keypair.publicKey();

    try {
      await axios.get(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicAddress)}`);
    } catch {
      // Friendbot funding can be unavailable; account creation remains a local
      // testnet placeholder and reconciliation will expose funding gaps.
    }

    return {
      custodyProvider: 'testnet',
      custodyAccountId: `testnet:${publicAddress}`,
      publicAddress,
      status: 'active',
      metadata: {
        investorId: input.investorId,
        userId: input.userId,
        fundId: input.fundId,
      },
    };
  }

  async getInvestorAccount(input: { investorId: string; fundId?: string }) {
    this.assertNonProduction();
    return {
      custodyProvider: 'testnet',
      investorId: input.investorId,
      fundId: input.fundId ?? null,
      status: 'external_lookup_not_persisted',
    };
  }

  async createAssetWallet(input: {
    custodyAccountId: string;
    assetCode: string;
    issuer?: string;
    network?: string;
  }) {
    this.assertNonProduction();
    const publicAddress = input.custodyAccountId.replace(/^testnet:/, '');

    return {
      custodyAssetId: `${input.custodyAccountId}:${input.assetCode}:${input.issuer ?? 'native'}`,
      publicAddress,
      status:
        input.assetCode.toUpperCase() === 'XLM'
          ? 'active'
          : 'pending_testnet_trustline',
    };
  }

  async transferAsset(input: {
    fromAccountId: string;
    toAccountId: string;
    assetCode: string;
    issuer?: string;
    amount: string;
    reference?: string;
    metadata?: Record<string, any>;
  }) {
    this.assertNonProduction();

    return {
      providerTransactionId: `testnet-transfer:${Date.now()}`,
      status: 'submitted',
      metadata: input.metadata,
    };
  }

  async getBalance(input: { custodyAccountId: string; assetCode?: string; issuer?: string }) {
    this.assertNonProduction();
    const publicAddress = input.custodyAccountId.replace(/^testnet:/, '');
    const server = new Horizon.Server(this.serverUrl());
    const account = await server.loadAccount(publicAddress);

    return account.balances.filter((balance: any) => {
      if (!input.assetCode) return true;
      return String(balance.asset_code ?? 'XLM') === input.assetCode;
    });
  }

  async suspendAccount() {
    this.assertNonProduction();
    return { status: 'suspended' };
  }
}
