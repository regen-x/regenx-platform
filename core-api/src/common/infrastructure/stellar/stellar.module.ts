import { Module } from '@nestjs/common';
import { StellarTransactionAdapter } from './stellar.transaction.adapter';
import { StellarPaymentAdapter } from './stellar.payment.adapter';
import { StellarAssetAdapter } from './stellar.asset.adapter';
import { StellarAccountAdapter } from './stellar.account.adapter';
import { SorobanContractAdapter } from './soroban.contract.adapter';

@Module({
  providers: [
    StellarTransactionAdapter,
    StellarPaymentAdapter,
    StellarAssetAdapter,
    StellarAccountAdapter,
    SorobanContractAdapter,
  ],
  exports: [
    StellarTransactionAdapter,
    StellarPaymentAdapter,
    StellarAssetAdapter,
    StellarAccountAdapter,
    SorobanContractAdapter,
  ],
})
export class StellarModule {}
