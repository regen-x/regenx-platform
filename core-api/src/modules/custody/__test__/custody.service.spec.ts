import { NotImplementedException } from '@nestjs/common';

import { FireblocksCustodyProvider } from '../application/providers/fireblocks-custody.provider';
import { ZodiaCustodyProvider } from '../application/providers/zodia-custody.provider';
import { CustodyAccountService } from '../application/service/custody-account.service';
import { CustodyTransactionStatus } from '../infrastructure/persistence/entities/custody.enums';

describe('institutional custody architecture', () => {
  it('keeps Fireblocks and Zodia integrations fail-closed until real APIs are configured', async () => {
    await expect(new FireblocksCustodyProvider().createInvestorAccount()).rejects.toBeInstanceOf(
      NotImplementedException,
    );
    await expect(new ZodiaCustodyProvider().transferAsset()).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it('updates custody transaction status from a Fireblocks webhook without private key fields', async () => {
    const tx = {
      id: 77,
      providerTransactionId: 'fb-tx-1',
      status: CustodyTransactionStatus.SUBMITTED,
      txHash: null,
      errorMessage: null,
      metadataJson: {},
    };
    const custodyTxRepo = {
      findOne: jest.fn().mockResolvedValue(tx),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const service = new CustodyAccountService(
      {} as any,
      custodyTxRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.handleFireblocksWebhook({
      id: 'fb-tx-1',
      status: 'COMPLETED',
      txHash: 'stellar-hash-1',
    });

    expect(result).toEqual({
      updated: true,
      transactionId: 77,
      status: CustodyTransactionStatus.CONFIRMED,
    });
    expect(custodyTxRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: CustodyTransactionStatus.CONFIRMED,
        txHash: 'stellar-hash-1',
      }),
    );
    expect(JSON.stringify(custodyTxRepo.save.mock.calls)).not.toMatch(
      /secret|privateKey|seed/i,
    );
  });
});
