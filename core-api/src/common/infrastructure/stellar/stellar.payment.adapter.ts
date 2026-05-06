import { Injectable } from '@nestjs/common';
import { Asset, Operation } from '@stellar/stellar-sdk';

@Injectable()
export class StellarPaymentAdapter {
  buildPaymentOperation(
    destination: string,
    asset: Asset,
    amount: string,
  ): string {
    return Operation.payment({
      destination,
      asset,
      amount,
    }).toXDR('base64');
  }
}
