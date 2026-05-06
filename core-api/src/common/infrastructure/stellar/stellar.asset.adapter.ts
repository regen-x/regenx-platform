import { Injectable } from '@nestjs/common';
import { Asset, Operation } from '@stellar/stellar-sdk';
import { ASSET_CODE } from './enum/asset-code.enum';

@Injectable()
export class StellarAssetAdapter {
  constructor() {}

  buildAsset(assetCode: string, assetIssuer?: string): Asset {
    return assetCode === ASSET_CODE.XLM
      ? Asset.native()
      : new Asset(assetCode, assetIssuer);
  }

  createStellarAssetContractOperation(asset: Asset): string {
    return Operation.createStellarAssetContract({
      asset,
    }).toXDR('base64');
  }
}
