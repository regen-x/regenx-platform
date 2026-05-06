import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FireblocksCustodyProvider } from '../providers/fireblocks-custody.provider';
import { TestnetStellarCustodyProvider } from '../providers/testnet-stellar-custody.provider';
import { ZodiaCustodyProvider } from '../providers/zodia-custody.provider';
import { CustodyProvider } from '../interfaces/custody-provider.interface';

@Injectable()
export class CustodyProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly testnetProvider: TestnetStellarCustodyProvider,
    private readonly fireblocksProvider: FireblocksCustodyProvider,
    private readonly zodiaProvider: ZodiaCustodyProvider,
  ) {}

  getProvider(provider?: string | null): CustodyProvider {
    const selected = this.resolveProvider(provider);

    if (selected === 'testnet') return this.testnetProvider;
    if (selected === 'fireblocks') return this.fireblocksProvider;
    if (selected === 'zodia') return this.zodiaProvider;

    throw new ServiceUnavailableException(
      'Production custody provider not configured. Configure Fireblocks or Zodia before enabling production custody.',
    );
  }

  resolveProvider(provider?: string | null) {
    if (provider) return provider.toLowerCase();

    const configured =
      this.configService.get<string>('custody.provider') ||
      process.env.CUSTODY_PROVIDER ||
      process.env.PRODUCTION_CUSTODY_PROVIDER;

    if (configured) return configured.toLowerCase();

    if (['production', 'prod'].includes(String(process.env.NODE_ENV ?? '').toLowerCase())) {
      return null;
    }

    return 'testnet';
  }
}
