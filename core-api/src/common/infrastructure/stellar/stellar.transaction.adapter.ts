import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Horizon,
  Keypair,
  Memo,
  MemoHash,
  MemoNone,
  TransactionBuilder,
  xdr,
  rpc,
  Transaction,
  MemoType,
  FeeBumpTransaction,
  Operation,
} from '@stellar/stellar-sdk';
import { TRANSACTION_STATUS } from './enum/transaction-status.enum';
import { IGetSorobanTransactionResponse } from './interface/get-soroban-transaction-response';
import { UnknownErrorException } from '../exception/unknown-error.exception';
import { UnknownStatusException } from './exception/unknown-status-error.exception';
import { UnknownErrorSubmittingTransaction } from './exception/unknown-error-submitting-transaction';
import { TransactionTimeoutException } from './exception/transaction-timeout-error.exception';

@Injectable()
export class StellarTransactionAdapter {
  private readonly stellarServer: Horizon.Server;
  private readonly sorobanServer: rpc.Server;
  private readonly networkPassphrase: string;

  constructor(private readonly environmentConfig: ConfigService) {
    const serverUrl = this.environmentConfig.get('stellar.serverUrl');
    const sorobanServerUrl = this.environmentConfig.get('soroban.serverUrl');
    this.networkPassphrase = this.environmentConfig.get(
      'stellar.networkPassphrase',
    );
    this.stellarServer = new Horizon.Server(serverUrl, {
      allowHttp: true,
    });
    this.sorobanServer = new rpc.Server(sorobanServerUrl, { allowHttp: true });
  }

  buildTransactionFromXdr(
    xdr: string,
  ): Transaction<Memo<MemoType>, Operation[]> | FeeBumpTransaction {
    return TransactionBuilder.fromXDR(xdr, this.networkPassphrase);
  }

  async buildTransaction(
    account: Horizon.AccountResponse,
    operations: string[],
    memo?: string,
  ): Promise<string> {
    const currentFee = (await this.stellarServer.feeStats()).fee_charged.p90;
    const transaction = new TransactionBuilder(account, {
      fee: String(+currentFee * operations.length),
      networkPassphrase: this.networkPassphrase,
    }).setTimeout(180);

    for (const operationXdr of operations) {
      const operation = xdr.Operation.fromXDR(operationXdr, 'base64');
      transaction.addOperation(operation);

      if (memo) {
        transaction.addMemo(new Memo(MemoHash, memo));
      } else {
        transaction.addMemo(new Memo(MemoNone));
      }
    }
    return transaction.build().toXDR();
  }

  signTransaction(keypair: Keypair, xdr: string): string {
    const transaction = this.buildTransactionFromXdr(xdr);

    transaction.sign(keypair);
    return transaction.toXDR();
  }

  async submitTransaction(
    xdr: string,
  ): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
    const transaction = TransactionBuilder.fromXDR(xdr, this.networkPassphrase);

    return await this.stellarServer.submitTransaction(transaction);
  }

  async prepareTransaction(xdr: string, keypair: Keypair): Promise<string> {
    try {
      const transaction = this.buildTransactionFromXdr(xdr);

      const uploadTransaction =
        await this.sorobanServer.prepareTransaction(transaction);

      uploadTransaction.sign(keypair);

      return uploadTransaction.toXDR();
    } catch {
      throw new UnknownErrorException({
        message: 'Failed to prepare transaction',
      });
    }
  }

  async submitSorobanTransaction(
    xdr: string,
  ): Promise<rpc.Api.GetTransactionResponse> {
    const transaction = this.buildTransactionFromXdr(xdr);
    const POLLING_SLEEP_TIME_MS = 500;
    const POLLING_ATTEMPTS = 15;

    const pollingOptions: rpc.Server.PollingOptions = {
      sleepStrategy: () => POLLING_SLEEP_TIME_MS,
      attempts: POLLING_ATTEMPTS,
    };

    try {
      const initialResponse =
        await this.sorobanServer.sendTransaction(transaction);

      if (initialResponse.status !== TRANSACTION_STATUS.PENDING) {
        throw initialResponse;
      }

      const finalResponse = await this.sorobanServer.pollTransaction(
        initialResponse.hash,
        pollingOptions,
      );

      return this.handleTransactionStatus(finalResponse);
    } catch (error) {
      if (
        error instanceof UnknownErrorSubmittingTransaction ||
        error instanceof UnknownStatusException
      ) {
        throw error;
      }
      throw new UnknownErrorException({
        message: 'Failed to submit transaction to Soroban',
      });
    }
  }

  private handleTransactionStatus(
    response: rpc.Api.GetTransactionResponse,
  ): rpc.Api.GetTransactionResponse {
    const status = this.mapTransactionStatus(response.status);

    if (status !== TRANSACTION_STATUS.SUCCESS) {
      throw new UnknownErrorSubmittingTransaction({
        message: 'Failed to submit transaction to Soroban',
      });
    } else {
      return response;
    }
  }

  private mapTransactionStatus(
    status: rpc.Api.GetTransactionStatus,
  ): TRANSACTION_STATUS {
    switch (status) {
      case rpc.Api.GetTransactionStatus.SUCCESS:
        return TRANSACTION_STATUS.SUCCESS;
      case rpc.Api.GetTransactionStatus.NOT_FOUND:
        return TRANSACTION_STATUS.NOT_FOUND;
      case rpc.Api.GetTransactionStatus.FAILED:
        return TRANSACTION_STATUS.FAILED;
      default:
        throw new UnknownStatusException({
          message: 'Transaction status not recognized',
        });
    }
  }

  async getSorobanTransaction(
    hash: string,
  ): Promise<IGetSorobanTransactionResponse> {
    try {
      const TIMEOUT = 1000;
      const MAX_RETRIES = 10;
      let count = 0;
      let transaction: rpc.Api.GetTransactionResponse;

      do {
        if (count > MAX_RETRIES) {
          throw new TransactionTimeoutException({
            message:
              'Transaction timeout error when getting transaction details',
          });
        }

        transaction = await this.sorobanServer.getTransaction(hash);

        count++;
        await new Promise((resolve) => setTimeout(resolve, TIMEOUT));
      } while (
        this.mapTransactionStatus(transaction.status) ===
        TRANSACTION_STATUS.NOT_FOUND
      );

      return transaction as unknown as IGetSorobanTransactionResponse;
    } catch (error) {
      if (error instanceof TransactionTimeoutException) {
        throw error;
      }
      throw new UnknownErrorException({
        message: 'Failed to get transaction details',
      });
    }
  }

  async createCosignerTransaction(
    accountPublicKey: string,
    cosignerPublicKey: string,
  ): Promise<string> {
    const account = await this.stellarServer.loadAccount(accountPublicKey);

    const createCosignerOperation = Operation.setOptions({
      signer: { ed25519PublicKey: cosignerPublicKey, weight: 1 },
    }).toXDR('base64');

    return await this.buildTransaction(account, [createCosignerOperation]);
  }
}
