import { Injectable, NotImplementedException } from '@nestjs/common';

import { CustodyProvider } from '../interfaces/custody-provider.interface';

@Injectable()
export class ZodiaCustodyProvider implements CustodyProvider {
  /*
   * Zodia API integration must be implemented once commercial/API
   * documentation is finalised.
   *
   * Expected Zodia flow:
   * 1. Create or reference an institutional custody account per investor.
   * 2. Create asset/account support for Stellar assets where supported.
   * 3. Route transfers via the Zodia API.
   * 4. Capture provider transaction references.
   * 5. Update transaction state via webhook or polling.
   * 6. Reconcile custody balances against FundBase registry and on-chain state.
   */
  async createInvestorAccount(): Promise<any> {
    throw new NotImplementedException(
      'Zodia integration pending: create or reference an investor custody account through the Zodia API.',
    );
  }

  async getInvestorAccount(): Promise<any> {
    throw new NotImplementedException(
      'Zodia integration pending: retrieve institutional custody account details.',
    );
  }

  async createAssetWallet(): Promise<any> {
    throw new NotImplementedException(
      'Zodia integration pending: configure asset support for the investor custody account.',
    );
  }

  async transferAsset(): Promise<any> {
    throw new NotImplementedException(
      'Zodia integration pending: route the transfer through the Zodia API.',
    );
  }

  async getBalance(): Promise<any> {
    throw new NotImplementedException(
      'Zodia integration pending: retrieve custody account balances.',
    );
  }

  async suspendAccount(): Promise<{ status: string }> {
    throw new NotImplementedException(
      'Zodia integration pending: apply account suspension through the institutional custody workflow.',
    );
  }
}
