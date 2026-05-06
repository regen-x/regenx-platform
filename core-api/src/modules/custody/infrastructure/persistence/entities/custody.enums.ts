export enum CustodyProviderType {
  TESTNET = 'testnet',
  FIREBLOCKS = 'fireblocks',
  ZODIA = 'zodia',
}

export enum CustodyAccountStatus {
  PENDING = 'pending',
  CREATED = 'created',
  ACTIVE = 'active',
  PENDING_PROVIDER_CONNECTION = 'pending_provider_connection',
  FAILED = 'failed',
  SUSPENDED = 'suspended',
}

export enum CustodyTransactionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  POLICY_PENDING = 'policy_pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum CustodyTransactionType {
  INVESTOR_ACCOUNT_CREATE = 'investor_account_create',
  ASSET_WALLET_CREATE = 'asset_wallet_create',
  TOKEN_DISTRIBUTION = 'token_distribution',
  AUDD_SUBSCRIPTION = 'audd_subscription',
  AUDD_DISTRIBUTION = 'audd_distribution',
  RECONCILIATION = 'reconciliation',
  MANUAL_ADMIN_RETRY = 'manual_admin_retry',
}

export enum SystemCustodyPurpose {
  ISSUER = 'issuer',
  TREASURY = 'treasury',
  DISTRIBUTION = 'distribution',
  AUDD_SETTLEMENT = 'audd_settlement',
  FEE_COLLECTION = 'fee_collection',
}
