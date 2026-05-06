import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  rpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Account,
  nativeToScVal,
  Address,
  Keypair,
} from '@stellar/stellar-sdk';

@Injectable()
export class SorobanContractAdapter {
  private readonly sorobanServer: rpc.Server;
  private readonly networkPassphrase: string;
  private readonly contractAddress: string;

  constructor(private readonly environmentConfig: ConfigService) {
    const sorobanServerUrl = this.environmentConfig.get('soroban.serverUrl');
    const contractAddress = this.environmentConfig.get(
      'soroban.contractAddress',
    );

    this.networkPassphrase = this.environmentConfig.get(
      'stellar.networkPassphrase',
    );
    this.sorobanServer = new rpc.Server(sorobanServerUrl, {
      allowHttp: true,
    });
    this.contractAddress = contractAddress;
  }

  async getContract(): Promise<Contract> {
    return new Contract(this.contractAddress);
  }

  async issueToken(
    sourceAccount: Account,
    sourceKeyPair: Keypair,
    tokenAddress: string,
    price: number,
    supply: number,
    ownerAddress: string,
  ): Promise<string> {
    try {
      const contract = await this.getContract();
      const tokenScAddressScVal = nativeToScVal(
        Address.fromString(tokenAddress),
      );
      const ownerScAddressScVal = nativeToScVal(
        Address.fromString(ownerAddress),
      );
      const priceScVal = nativeToScVal(price, { type: 'i128' });
      const supplyScVal = nativeToScVal(supply, { type: 'i128' });

      const builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'issue_token',
            tokenScAddressScVal,
            priceScVal,
            supplyScVal,
            ownerScAddressScVal,
          ),
        )
        .setTimeout(180)
        .build();

      const preparedTransaction =
        await this.sorobanServer.prepareTransaction(builtTransaction);

      preparedTransaction.sign(sourceKeyPair);

      return preparedTransaction.toXDR();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async buildTransferTokenTransaction(
    sourceAccount: Account,
    investorAddress: string,
    tokenAddress: string,
    amount: number,
  ): Promise<string> {
    try {
      const contract = await this.getContract();

      const tokenScAddressScVal = nativeToScVal(
        Address.fromString(tokenAddress),
      );
      const investorScAddressScVal = nativeToScVal(
        Address.fromString(investorAddress),
      );
      const amountScVal = nativeToScVal(amount, { type: 'i128' });

      const builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'transfer',
            investorScAddressScVal,
            tokenScAddressScVal,
            amountScVal,
          ),
        )
        .setTimeout(180)
        .build();

      const preparedTransaction =
        await this.sorobanServer.prepareTransaction(builtTransaction);

      return preparedTransaction.toXDR();
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to transfer token',
      );
    }
  }

  async buildCreateTokenOfferTransaction(
    sourceAccount: Account,
    tokenAddress: string,
    amount: number,
    price: number,
    owner: string,
  ): Promise<string> {
    try {
      const contract = await this.getContract();

      const tokenScAddressScVal = nativeToScVal(
        Address.fromString(tokenAddress),
      );
      const amountScVal = nativeToScVal(amount, { type: 'i128' });
      const priceScVal = nativeToScVal(price, { type: 'i128' });
      const ownerScAddressScVal = nativeToScVal(Address.fromString(owner));

      const builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call(
            'create_offer',
            tokenScAddressScVal,
            amountScVal,
            priceScVal,
            ownerScAddressScVal,
          ),
        )
        .setTimeout(180)
        .build();

      const preparedTransaction =
        await this.sorobanServer.prepareTransaction(builtTransaction);

      return preparedTransaction.toXDR();
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to create token offer',
      );
    }
  }

  async buildBuyTokenOfferTransaction(
    sourceAccount: Account,
    offerId: number,
    buyerAddress: string,
  ): Promise<string> {
    try {
      const contract = await this.getContract();

      const offerIdScVal = nativeToScVal(offerId, { type: 'i128' });
      const buyerScAddressScVal = nativeToScVal(
        Address.fromString(buyerAddress),
      );

      const builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          contract.call('buy_offer', offerIdScVal, buyerScAddressScVal),
        )
        .setTimeout(180)
        .build();

      const preparedTransaction =
        await this.sorobanServer.prepareTransaction(builtTransaction);

      return preparedTransaction.toXDR();
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to buy token offer',
      );
    }
  }

  async buildCancelTokenOfferTransaction(
    sourceAccount: Account,
    offerId: number,
  ): Promise<string> {
    try {
      const contract = await this.getContract();

      const offerIdScVal = nativeToScVal(offerId, { type: 'i128' });

      const builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call('cancel_offer', offerIdScVal))
        .setTimeout(180)
        .build();

      const preparedTransaction =
        await this.sorobanServer.prepareTransaction(builtTransaction);
      return preparedTransaction.toXDR();
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to cancel token offer',
      );
    }
  }

  async buildUpdateTokenOfferPriceTransaction(
    sourceAccount: Account,
    offerId: number,
    price: number,
  ): Promise<string> {
    try {
      const contract = await this.getContract();

      const offerIdScVal = nativeToScVal(offerId, { type: 'i128' });
      const priceScVal = nativeToScVal(price, { type: 'i128' });

      const builtTransaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contract.call('update_offer', offerIdScVal, priceScVal))
        .setTimeout(180)
        .build();

      const preparedTransaction =
        await this.sorobanServer.prepareTransaction(builtTransaction);

      return preparedTransaction.toXDR();
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to update token offer price',
      );
    }
  }
}
