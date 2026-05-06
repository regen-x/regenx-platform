import { Injectable } from '@nestjs/common';

@Injectable()
export class CustodyReconciliationService {
  /*
   * FundBase registry is legal source of truth. Custody/on-chain balances are
   * reconciled execution records.
   */
  async reconcileInvestorBalance(investorId: string | number, projectId?: string | number) {
    return {
      investorId,
      projectId: projectId ?? null,
      status: 'placeholder',
      comparedSources: [
        'FundBase legal registry',
        'RegenX holdings database',
        'custody provider balances',
        'Stellar on-chain balances',
      ],
    };
  }

  async reconcileCustodyTransaction(transactionId: string | number) {
    return {
      transactionId,
      status: 'placeholder',
      note: 'Provider transaction, custody transaction row, and on-chain settlement will be compared here.',
    };
  }

  async compareRegistryVsCustody(input: Record<string, any>) {
    return {
      input,
      legalSourceOfTruth: 'FundBase / FB Corp registry',
      status: 'placeholder',
    };
  }
}
