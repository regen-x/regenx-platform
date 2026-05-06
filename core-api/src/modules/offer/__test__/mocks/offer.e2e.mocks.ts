import { OfferTransactionType } from '../../application/enum/offer-transaction-type.enum';
import { xdr } from '@stellar/stellar-sdk';

const MULTIPLIER = 10 ** 7;

export const createOfferDto = {
  projectUuid: '28a129c4-7526-449e-98d0-4410333b446b',
  amount: 100,
  price: 10,
  userAddress: 'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ',
};

export const submitCreateOfferDto = {
  xdr: 'signed-transaction-xdr',
  type: OfferTransactionType.CREATE_OFFER,
  userAddress: 'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ',
};

export const submitUpdateOfferPriceDto = {
  xdr: 'signed-transaction-xdr',
  type: OfferTransactionType.UPDATE_OFFER,
  userAddress: 'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ',
};

export const submitCancelOfferDto = {
  xdr: 'signed-transaction-xdr',
  type: OfferTransactionType.CANCEL_OFFER,
  userAddress: 'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ',
};

export const submitBuyOfferDto = {
  xdr: 'signed-transaction-xdr',
  type: OfferTransactionType.BUY_OFFER,
  userAddress: 'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ',
};

export const updateOfferPriceDto = {
  price: 20,
  userAddress: 'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ',
};

export const createMockOfferScVal = (
  offerId: number,
  amount: number,
  price: number,
  isActive = true,
  owner = 'GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAJAUEQFU6LPCSEFVXON',
  tokenAddress = 'CBYXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAJAUEQFU6LPCSEFVXON',
) => {
  const offerDataMap = [
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('amount'),
      val: xdr.ScVal.scvU64(xdr.Uint64.fromString(amount.toString())),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('is_active'),
      val: xdr.ScVal.scvBool(isActive),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('owner'),
      val: xdr.ScVal.scvString(owner),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('token_address'),
      val: xdr.ScVal.scvString(tokenAddress),
    }),
    new xdr.ScMapEntry({
      key: xdr.ScVal.scvSymbol('total_price'),
      val: xdr.ScVal.scvU64(xdr.Uint64.fromString(price.toString())),
    }),
  ];

  return xdr.ScVal.scvVec([
    xdr.ScVal.scvU64(xdr.Uint64.fromString(offerId.toString())),
    xdr.ScVal.scvMap(offerDataMap),
  ]);
};

export const mockCreateOfferReturnValue = createMockOfferScVal(
  1001,
  100 * MULTIPLIER,
  50 * MULTIPLIER,
);
export const mockUpdateOfferReturnValue = createMockOfferScVal(
  1001,
  100 * MULTIPLIER,
  75 * MULTIPLIER,
);
export const mockCancelOfferReturnValue = createMockOfferScVal(
  1002,
  200 * MULTIPLIER,
  50 * MULTIPLIER,
  false,
);
export const mockBuyOfferReturnValue = createMockOfferScVal(
  1004,
  0,
  50 * MULTIPLIER,
  false,
);

export const mockStellarAccount = {
  accountId: () => 'test-account-id',
  sequenceNumber: () => '123456789',
  incrementSequenceNumber: () => {},
};

export const mockTransactionResult = {
  status: 'SUCCESS',
  txHash: 'test-transaction-hash',
  returnValue: 'test-return-value',
};

export const offerMockResponse = {
  amount: 100,
  price: 50,
  isActive: true,
  user: '34a129c4-7526-669e-96d3-441f333buk6z',
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
  deletedAt: null,
  project: {
    id: '28a129c4-7526-449e-98d0-4410333b446b',
    name: 'Example Project',
    tokenSymbol: 'EXMP',
    tokenAddress: 'CBYXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAJAUEQFU6LPCSEFVXON',
  },
};
