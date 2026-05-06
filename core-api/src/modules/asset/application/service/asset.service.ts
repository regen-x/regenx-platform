import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Asset, Horizon, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);
  private readonly issuerPublicKey: string;
  private readonly issuerSecretKey: string;
  private readonly distributorPublicKey: string;
  private readonly distributorSecretKey: string;
  private readonly serverUrl: string;
  private readonly networkPassphrase: string;

  constructor(private readonly config: ConfigService) {
    this.issuerPublicKey = this.config.get<string>('stellar.issuerPublicKey') || '';
    this.issuerSecretKey = this.config.get<string>('stellar.issuerSecretKey') || '';
    this.distributorPublicKey =
      this.config.get<string>('stellar.distributorPublicKey') || '';
    this.distributorSecretKey =
      this.config.get<string>('stellar.distributorSecretKey') || '';
    this.serverUrl =
      this.config.get<string>('stellar.serverUrl') ||
      this.config.get<string>('stellar.horizonUrl') ||
      '';
    this.networkPassphrase = this.config.get<string>('stellar.networkPassphrase') || '';
  }

  getIssuerWalletPublic(): string {
    if (!this.issuerPublicKey) throw new Error('stellar.issuerPublicKey is missing');
    return this.issuerPublicKey;
  }

  getConfiguredDistributorWalletPublic(): string {
    if (!this.distributorPublicKey) {
      throw new Error('stellar.distributorPublicKey is missing');
    }

    return this.distributorPublicKey;
  }

  getMissingCoreConfigKeys(): string[] {
    const missing: string[] = [];

    if (!this.issuerPublicKey) missing.push('STELLAR_ISSUER_PUBLIC_KEY');
    if (!this.issuerSecretKey) missing.push('STELLAR_ISSUER_SECRET_KEY');
    if (!this.distributorPublicKey) missing.push('STELLAR_DISTRIBUTOR_PUBLIC_KEY');
    if (!this.distributorSecretKey) missing.push('STELLAR_DISTRIBUTOR_SECRET_KEY');
    if (!this.serverUrl) missing.push('STELLAR_SERVER_URL');
    if (!this.networkPassphrase) missing.push('STELLAR_NETWORK_PASSPHRASE');

    return missing;
  }

  getNetworkConfig() {
    return {
      serverUrl: this.serverUrl,
      networkPassphrase: this.networkPassphrase,
    };
  }

  private getServer() {
    if (!this.serverUrl) throw new Error('stellar.serverUrl is missing');
    return new Horizon.Server(this.serverUrl);
  }

  private assertCoreWalletConfig() {
    if (!this.issuerPublicKey) throw new Error('stellar.issuerPublicKey is missing');
    if (!this.issuerSecretKey) throw new Error('stellar.issuerSecretKey is missing');
    if (!this.distributorPublicKey) throw new Error('stellar.distributorPublicKey is missing');
    if (!this.distributorSecretKey) throw new Error('stellar.distributorSecretKey is missing');
    if (!this.serverUrl) throw new Error('stellar.serverUrl is missing');
    if (!this.networkPassphrase) throw new Error('stellar.networkPassphrase is missing');
  }

  private validateNetworkConfiguration() {
    const serverUrl = this.serverUrl.toLowerCase();
    const networkPassphrase = this.networkPassphrase.toLowerCase();
    const testnetKeywords = ['testnet', 'friendbot'];
    const publicKeywords = ['mainnet', 'public'];
    const isTestnetUrl = testnetKeywords.some((keyword) => serverUrl.includes(keyword));
    const isPublicUrl = publicKeywords.some((keyword) => serverUrl.includes(keyword));
    const isTestnetPassphrase = networkPassphrase.includes('test sdf network');
    const isPublicPassphrase = networkPassphrase.includes('public global stellar network');

    if (isTestnetUrl && isPublicPassphrase) {
      throw new Error(
        'Stellar network configuration mismatch: STELLAR_SERVER_URL points to testnet but STELLAR_NETWORK_PASSPHRASE is set to public network.',
      );
    }

    if (isPublicUrl && isTestnetPassphrase) {
      throw new Error(
        'Stellar network configuration mismatch: STELLAR_SERVER_URL points to public network but STELLAR_NETWORK_PASSPHRASE is set to testnet.',
      );
    }
  }

  private resolveDistributorSigningKeys(distributorAddress?: string | null) {
    const resolvedAddress = distributorAddress || this.getConfiguredDistributorWalletPublic();

    if (resolvedAddress !== this.distributorPublicKey) {
      throw new Error(
        'Project-specific distributor wallet provisioning is not configured yet. ' +
          'Set distributorWalletPublic to the configured platform distributor wallet for now.',
      );
    }

    if (!this.distributorSecretKey) {
      throw new Error('stellar.distributorSecretKey is missing');
    }

    return {
      publicKey: this.distributorPublicKey,
      secretKey: this.distributorSecretKey,
    };
  }

  private async loadAccountOrThrow(publicKey: string, label: string) {
    try {
      return await this.getServer().loadAccount(publicKey);
    } catch (error: any) {
      this.logger.warn(
        `Unable to load ${label} Stellar account ${publicKey}: ${error?.message ?? 'Unknown Horizon error'}`,
      );
      throw new Error(`${label} Stellar account ${publicKey} could not be loaded from Horizon`);
    }
  }

  async getDistributionIssuancePreflight(
    code: string,
    distributorAddress?: string | null,
  ): Promise<{
    issuerPublicKey: string;
    distributorPublicKey: string;
    distributorHasTrustline: boolean;
    distributorBalance: string;
  }> {
    this.assertCoreWalletConfig();
    this.validateNetworkConfiguration();

    if (!code) throw new Error('asset code is required');

    const distributor = this.resolveDistributorSigningKeys(distributorAddress);
    await this.loadAccountOrThrow(this.issuerPublicKey, 'Issuer');
    const distributorAccount = await this.loadAccountOrThrow(
      distributor.publicKey,
      'Distributor',
    );

    const balance = distributorAccount.balances.find(
      (entry: any) =>
        (entry.asset_type === 'credit_alphanum4' || entry.asset_type === 'credit_alphanum12') &&
        entry.asset_code === code &&
        entry.asset_issuer === this.issuerPublicKey,
    );

    return {
      issuerPublicKey: this.issuerPublicKey,
      distributorPublicKey: distributor.publicKey,
      distributorHasTrustline: Boolean(balance),
      distributorBalance: String(balance?.balance ?? '0'),
    };
  }

  async ensureTrustline(
    code: string,
    distributorAddress?: string | null,
  ): Promise<void> {
    this.assertCoreWalletConfig();
    this.validateNetworkConfiguration();

    if (!code) throw new Error('asset code is required');

    const server = this.getServer();
    const distributor = this.resolveDistributorSigningKeys(distributorAddress);
    const distributorAccount = await server.loadAccount(distributor.publicKey);
    const hasTrustline = distributorAccount.balances.some(
      (b: any) =>
        (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12') &&
        b.asset_code === code &&
        b.asset_issuer === this.issuerPublicKey,
    );

    if (hasTrustline) return;

    const asset = new Asset(code, this.issuerPublicKey);
    const distributorKeypair = Keypair.fromSecret(distributor.secretKey);

    const tx = new TransactionBuilder(distributorAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(distributorKeypair);
    await server.submitTransaction(tx);
  }

  async issueToDistribution(
    code: string,
    amount: string,
    distributorAddress?: string | null,
  ): Promise<{ txHash: string; issuerPublicKey: string; distributorPublicKey: string }> {
    this.assertCoreWalletConfig();
    this.validateNetworkConfiguration();

    if (!code) throw new Error('asset code is required');
    if (!amount) throw new Error('amount is required');
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('amount must be greater than 0');
    }

    const server = this.getServer();
    const distributor = this.resolveDistributorSigningKeys(distributorAddress);

    await this.ensureTrustline(code, distributor.publicKey);

    const issuerKeypair = Keypair.fromSecret(this.issuerSecretKey);
    const issuerAccount = await server.loadAccount(this.issuerPublicKey);
    const asset = new Asset(code, this.issuerPublicKey);

    const tx = new TransactionBuilder(issuerAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: distributor.publicKey,
          asset,
          amount,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(issuerKeypair);

    const result = await server.submitTransaction(tx);

    return {
      txHash: result.hash,
      issuerPublicKey: this.issuerPublicKey,
      distributorPublicKey: distributor.publicKey,
    };
  }

  async issueToDeveloper(
    code: string,
    amount: string,
    developerAddress: string,
  ): Promise<{ txHash: string }> {
    this.assertCoreWalletConfig();
    if (!developerAddress) throw new Error('developerAddress is required');
    if (!code) throw new Error('asset code is required');
    if (!amount) throw new Error('amount is required');

    const server = this.getServer();
    const issuerKeypair = Keypair.fromSecret(this.issuerSecretKey);
    const asset = new Asset(code, this.issuerPublicKey);

    const devAccount = await server.loadAccount(developerAddress);
    const hasTrustline = devAccount.balances.some(
      (b: any) =>
        (b.asset_type === 'credit_alphanum4' || b.asset_type === 'credit_alphanum12') &&
        b.asset_code === code &&
        b.asset_issuer === this.issuerPublicKey,
    );

    if (!hasTrustline) {
      throw new Error(
        `Developer wallet ${developerAddress} has no trustline for ${code}:${this.issuerPublicKey}`,
      );
    }

    const issuerAccount = await server.loadAccount(this.issuerPublicKey);

    const tx = new TransactionBuilder(issuerAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: developerAddress,
          asset,
          amount,
        }),
      )
      .setTimeout(30)
      .build();

    tx.sign(issuerKeypair);

    const result = await server.submitTransaction(tx);
    return { txHash: result.hash };
  }
}
