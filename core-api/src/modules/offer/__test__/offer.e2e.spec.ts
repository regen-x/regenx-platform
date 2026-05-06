import { HttpStatus, INestApplication } from '@nestjs/common';
import { join } from 'path';
import { setupApp } from '../../../configuration/app.configuration';
import * as request from 'supertest';
import { testModuleBootstrapper } from '../../../test/test.module.bootstrapper';
import { loadFixtures } from '../../../../data/util/loader';
import { createAccessToken } from '../../../test/test.util';

import { SorobanContractAdapter } from '../../../common/infrastructure/stellar/soroban.contract.adapter';
import { StellarTransactionAdapter } from '../../../common/infrastructure/stellar/stellar.transaction.adapter';
import { StellarAccountAdapter } from '../../../common/infrastructure/stellar/stellar.account.adapter';
import {
  createOfferDto,
  mockBuyOfferReturnValue,
  mockCancelOfferReturnValue,
  mockCreateOfferReturnValue,
  mockUpdateOfferReturnValue,
  offerMockResponse,
  submitBuyOfferDto,
  submitCancelOfferDto,
  submitCreateOfferDto,
  submitUpdateOfferPriceDto,
  updateOfferPriceDto,
} from './mocks/offer.e2e.mocks';
import { rpc } from '@stellar/stellar-sdk';

describe('Offer Module', () => {
  let app: INestApplication;
  let mockSorobanContractAdapter: SorobanContractAdapter;
  let mockStellarTransactionAdapter: StellarTransactionAdapter;
  let mockStellarAccountAdapter: StellarAccountAdapter;

  const userToken = createAccessToken({
    sub: '00000000-0000-0000-0000-00000000001X',
  });

  const invalidToken = 'invalid-token';

  beforeAll(async () => {
    const moduleRef = await testModuleBootstrapper();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();

    mockSorobanContractAdapter = app.get(SorobanContractAdapter);
    mockStellarTransactionAdapter = app.get(StellarTransactionAdapter);
    mockStellarAccountAdapter = app.get(StellarAccountAdapter);

    await loadFixtures(
      `${__dirname}/fixture`,
      join(__dirname, '..', '..', '..', 'configuration/orm.configuration.ts'),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST - /offer', () => {
    it('should create an offer transaction', async () => {
      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      jest
        .spyOn(mockSorobanContractAdapter, 'buildCreateTokenOfferTransaction')
        .mockResolvedValueOnce('test-transaction-xdr');

      await request(app.getHttpServer())
        .post('/api/v1/offer')
        .send(createOfferDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              attributes: expect.objectContaining({
                transactionXdr: 'test-transaction-xdr',
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should fail when owner address is not found', async () => {
      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post('/api/v1/offer')
        .send(createOfferDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.NOT_FOUND)
        .then(({ body }) => {
          expect(body.error.detail).toContain('Owner account not found');
        });
    });

    it('should fail when project does not exist', async () => {
      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      const invalidProjectDto = {
        ...createOfferDto,
        projectUuid: 'non-existent-uuid',
      };

      await request(app.getHttpServer())
        .post('/api/v1/offer')
        .send(invalidProjectDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.NOT_FOUND)
        .then(({ body }) => {
          expect(body.error.detail).toContain(
            `Project with ${invalidProjectDto.projectUuid} not found`,
          );
        });
    });

    it('should fail with invalid authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/offer')
        .send(createOfferDto)
        .auth(invalidToken, { type: 'bearer' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST - /offer/submit', () => {
    it('should submit an offer creation transaction', async () => {
      jest
        .spyOn(mockStellarTransactionAdapter, 'submitSorobanTransaction')
        .mockResolvedValueOnce({
          status: 'SUCCESS',
          txHash: 'test-transaction-hash',
        } as unknown as rpc.Api.GetTransactionResponse);

      jest
        .spyOn(mockStellarTransactionAdapter, 'getSorobanTransaction')
        .mockResolvedValueOnce({
          returnValue: mockCreateOfferReturnValue,
        });

      await request(app.getHttpServer())
        .post('/api/v1/offer/submit')
        .send(submitCreateOfferDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          expect(body.data.attributes).toEqual(offerMockResponse);
        });
    });

    it('Should submit an edit offer transaction', async () => {
      jest
        .spyOn(mockStellarTransactionAdapter, 'submitSorobanTransaction')
        .mockResolvedValueOnce({
          status: 'SUCCESS',
          txHash: 'test-transaction-hash',
        } as unknown as rpc.Api.GetTransactionResponse);

      jest
        .spyOn(mockStellarTransactionAdapter, 'getSorobanTransaction')
        .mockResolvedValueOnce({
          returnValue: mockUpdateOfferReturnValue,
        });

      await request(app.getHttpServer())
        .post('/api/v1/offer/submit')
        .send(submitUpdateOfferPriceDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED);
    });

    it('Should submit an cancel offer transaction', async () => {
      jest
        .spyOn(mockStellarTransactionAdapter, 'submitSorobanTransaction')
        .mockResolvedValueOnce({
          status: 'SUCCESS',
          txHash: 'test-transaction-hash',
        } as unknown as rpc.Api.GetTransactionResponse);

      jest
        .spyOn(mockStellarTransactionAdapter, 'getSorobanTransaction')
        .mockResolvedValueOnce({
          returnValue: mockCancelOfferReturnValue,
        });

      await request(app.getHttpServer())
        .post('/api/v1/offer/submit')
        .send(submitCancelOfferDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED);
    });

    it('Should submit an buy offer transaction', async () => {
      jest
        .spyOn(mockStellarTransactionAdapter, 'submitSorobanTransaction')
        .mockResolvedValueOnce({
          status: 'SUCCESS',
          txHash: 'test-transaction-hash',
        } as unknown as rpc.Api.GetTransactionResponse);

      jest
        .spyOn(mockStellarTransactionAdapter, 'getSorobanTransaction')
        .mockResolvedValueOnce({
          returnValue: mockBuyOfferReturnValue,
        });

      await request(app.getHttpServer())
        .post('/api/v1/offer/submit')
        .send(submitBuyOfferDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED);
    });

    it('should handle failed transaction submission', async () => {
      jest
        .spyOn(mockStellarTransactionAdapter, 'submitSorobanTransaction')
        .mockRejectedValueOnce(new Error('Transaction submission failed'));

      await request(app.getHttpServer())
        .post('/api/v1/offer/submit')
        .send(submitCreateOfferDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should handle invalid transaction type', async () => {
      const invalidSubmitDto = {
        ...submitCreateOfferDto,
        type: 'INVALID_TYPE',
      };

      await request(app.getHttpServer())
        .post('/api/v1/offer/submit')
        .send(invalidSubmitDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET - /offer', () => {
    const userAddress =
      'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ';
    it('should return a list of the user offers', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/offer?filter[userAddress]=${userAddress}`)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          expect(body.data).toBeDefined();
          expect(body.data.length).toBe(4);
        });
    });

    it('should return a list of all but the user offers', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/offer?filter[excludeAddress]=${userAddress}`)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          expect(body.data).toBeDefined();
          expect(body.data.length).toBe(4);
          body.data.forEach((offer) => {
            expect(offer.attributes.user).not.toBe(userAddress);
          });
        });
    });

    it('should handle pagination correctly', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/offer?page[size]=2&page[number]=1')
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          expect(body.data.length).toBeLessThanOrEqual(2);
          expect(body.meta.pageSize).toBe(2);
          expect(body.meta.pageNumber).toBe(1);
        });
    });

    it('should filter by token symbol', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/offer?filter[tokenSymbol]=TEST')
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          body.data.forEach((offer) => {
            expect(offer.attributes.project.tokenSymbol).toContain('TEST');
          });
        });
    });
  });

  describe('GET - /offer/:uuid', () => {
    it('should return an offer', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/offer/00000000-0000-0000-0000-000000000001')
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          expect(body.data.attributes).toEqual({
            ...offerMockResponse,
            price: 75,
          });
        });
    });

    it('should fail when offer does not exist', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/offer/non-existent-uuid')
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST - /offer/:uuid/cancel', () => {
    const userAddress =
      'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ';

    it('should create a cancel offer transaction', async () => {
      const offerUuid = '00000000-0000-0000-0000-000000000001';

      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      jest
        .spyOn(mockSorobanContractAdapter, 'buildCancelTokenOfferTransaction')
        .mockResolvedValueOnce('test-cancel-transaction-xdr');

      await request(app.getHttpServer())
        .post(`/api/v1/offer/${offerUuid}/cancel`)
        .send({ userAddress })
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              attributes: expect.objectContaining({
                transactionXdr: 'test-cancel-transaction-xdr',
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should fail when offer does not exist', async () => {
      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      await request(app.getHttpServer())
        .post('/api/v1/offer/non-existent-uuid/cancel')
        .send({ userAddress })
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.NOT_FOUND)
        .then(({ body }) => {
          expect(body.error.detail).toContain(
            'Offer with non-existent-uuid not found',
          );
        });
    });
  });

  describe('POST - /offer/:uuid/buy', () => {
    const userAddress =
      'GD7BTI6WZ4L4NP54EY4PVL5NLBE4X2HJLN6KPDJTYTXMQHNJGRIC55NJ';

    it('should create a buy offer transaction', async () => {
      const offerUuid = '00000000-0000-0000-0000-000000000005';

      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      jest
        .spyOn(mockSorobanContractAdapter, 'buildBuyTokenOfferTransaction')
        .mockResolvedValueOnce('test-buy-transaction-xdr');

      await request(app.getHttpServer())
        .post(`/api/v1/offer/${offerUuid}/buy`)
        .send({ buyerAddress: userAddress })
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              attributes: expect.objectContaining({
                transactionXdr: 'test-buy-transaction-xdr',
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should fail when trying to buy own offer', async () => {
      const ownOfferUuid = '00000000-0000-0000-0000-000000000001';

      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      await request(app.getHttpServer())
        .post(`/api/v1/offer/${ownOfferUuid}/buy`)
        .send({ buyerAddress: userAddress })
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.BAD_REQUEST)
        .then(({ body }) => {
          expect(body.error.detail).toContain(
            `Offer with ${ownOfferUuid} is owned by the buyer`,
          );
        });
    });

    it('should fail when offer is not active', async () => {
      const inactiveOfferUuid = '00000000-0000-0000-0000-000000000003';

      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      await request(app.getHttpServer())
        .post(`/api/v1/offer/${inactiveOfferUuid}/buy`)
        .send({ buyerAddress: userAddress })
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.BAD_REQUEST)
        .then(({ body }) => {
          expect(body.error.detail).toContain(
            `Offer with ${inactiveOfferUuid} is not active`,
          );
        });
    });

    it('should fail when buyer account is not found', async () => {
      const offerUuid = '00000000-0000-0000-0000-000000000001';

      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post(`/api/v1/offer/${offerUuid}/buy`)
        .send({ buyerAddress: userAddress })
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.NOT_FOUND)
        .then(({ body }) => {
          expect(body.error.detail).toContain('Buyer account not found');
        });
    });
  });

  describe('POST - /offer/:uuid/price', () => {
    it('should update offer price', async () => {
      const offerUuid = '00000000-0000-0000-0000-000000000001';

      jest
        .spyOn(mockStellarAccountAdapter, 'getAccount')
        .mockResolvedValueOnce({} as any);

      jest
        .spyOn(
          mockSorobanContractAdapter,
          'buildUpdateTokenOfferPriceTransaction',
        )
        .mockResolvedValueOnce('test-update-price-transaction-xdr');

      await request(app.getHttpServer())
        .post(`/api/v1/offer/${offerUuid}/price`)
        .send(updateOfferPriceDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              attributes: expect.objectContaining({
                transactionXdr: 'test-update-price-transaction-xdr',
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should fail when price is invalid', async () => {
      const offerUuid = '00000000-0000-0000-0000-000000000001';
      const invalidPriceDto = {
        price: -10,
      };

      await request(app.getHttpServer())
        .post(`/api/v1/offer/${offerUuid}/price`)
        .send(invalidPriceDto)
        .auth(userToken, { type: 'bearer' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
