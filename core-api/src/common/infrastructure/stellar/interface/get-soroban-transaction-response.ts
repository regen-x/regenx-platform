import { xdr } from '@stellar/stellar-sdk';

export interface IGetSorobanTransactionResponse {
  returnValue: {
    address: () => xdr.ScAddress;
  };
}
