import { Injectable, NotImplementedException } from '@nestjs/common';

import { CustodyProvider } from '../interfaces/custody-provider.interface';

@Injectable()
export class FireblocksCustodyProvider implements CustodyProvider {
  /*
   * Expected Fireblocks production flow:
   * 1. Create one vault account per investor.
   * 2. Create or activate asset wallets inside that vault account.
   * 3. Submit transfers through the Fireblocks transaction API.
   * 4. Allow transactions to enter policy engine approval / MPC signing states.
   * 5. Consume Fireblocks transaction webhooks for lifecycle updates.
   * 6. Update custody_transactions and reconcile txHash and balances.
   *
   * RegenX never stores Fireblocks private keys and must not assume key access.
   */
  async createInvestorAccount(): Promise<any> {
    throw new NotImplementedException(
      'Fireblocks integration pending: create an investor vault account through the Fireblocks API.',
    );
  }

  async getInvestorAccount(): Promise<any> {
    throw new NotImplementedException(
      'Fireblocks integration pending: read investor vault account metadata from Fireblocks.',
    );
  }

  async createAssetWallet(): Promise<any> {
    throw new NotImplementedException(
      'Fireblocks integration pending: create or activate an asset wallet inside the investor vault account.',
    );
  }

  async transferAsset(): Promise<any> {
    throw new NotImplementedException(
      'Fireblocks integration pending: submit a policy-controlled transaction through the Fireblocks transaction API.',
    );
  }

  async getBalance(): Promise<any> {
    throw new NotImplementedException(
      'Fireblocks integration pending: retrieve vault account asset balances.',
    );
  }

  async suspendAccount(): Promise<{ status: string }> {
    throw new NotImplementedException(
      'Fireblocks integration pending: apply account controls through Fireblocks policy/admin workflow.',
    );
  }
}
