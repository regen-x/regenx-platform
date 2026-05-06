export interface CustodyProvider {
  createInvestorAccount(input: {
    investorId: string;
    userId?: string;
    fundId?: string;
  }): Promise<{
    custodyProvider: string;
    custodyAccountId: string;
    publicAddress?: string;
    status: string;
  }>;

  getInvestorAccount(input: { investorId: string; fundId?: string }): Promise<any>;

  createAssetWallet(input: {
    custodyAccountId: string;
    assetCode: string;
    issuer?: string;
    network?: string;
  }): Promise<{
    custodyAssetId?: string;
    publicAddress?: string;
    txHash?: string;
    status: string;
  }>;

  transferAsset(input: {
    fromAccountId: string;
    toAccountId: string;
    assetCode: string;
    issuer?: string;
    amount: string;
    reference?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    providerTransactionId?: string;
    txHash?: string;
    status: string;
  }>;

  getBalance(input: {
    custodyAccountId: string;
    assetCode?: string;
    issuer?: string;
  }): Promise<any>;

  suspendAccount(input: {
    custodyAccountId: string;
    reason: string;
  }): Promise<{ status: string }>;
}
