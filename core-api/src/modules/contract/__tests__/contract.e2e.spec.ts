import {
  HttpStatus,
  INestApplication,
  InternalServerErrorException,
} from '@nestjs/common';
import { join } from 'path';
import { setupApp } from '../../../configuration/app.configuration';
import * as request from 'supertest';
import { testModuleBootstrapper } from '../../../test/test.module.bootstrapper';
import { loadFixtures } from '../../../../data/util/loader';
import { createAccount } from '../../../common/infrastructure/stellar/stellar-local-setup';
import { createAccessToken } from '../../../test/test.util';
import {
  createTransferDto,
  submitTransactionDto,
} from './mocks/contract.e2e.mocks';
import { SorobanContractAdapter } from '../../../common/infrastructure/stellar/soroban.contract.adapter';
import { StellarTransactionAdapter } from '../../../common/infrastructure/stellar/stellar.transaction.adapter';
import { TRANSACTION_TYPE } from '../../transaction/domain/transaction-type.enum';
jest.mock('../../../common/infrastructure/stellar/soroban.contract.adapter');
jest.mock('../../../common/infrastructure/stellar/stellar.transaction.adapter');
describe('Contract Module', () => {
  let app: INestApplication;
  let investorAddress = '';

  const adminToken = createAccessToken({
    sub: '00000000-0000-0000-0000-00000000000X',
  });

  beforeAll(async () => {
    const issuerAccount = await createAccount();
    process.env.STELLAR_ISSUER_PUBLIC_KEY = issuerAccount.publicKey();
    process.env.STELLAR_ISSUER_SECRET_KEY = issuerAccount.secret();

    const distributorAccount = await createAccount();
    process.env.STELLAR_DISTRIBUTOR_PUBLIC_KEY = distributorAccount.publicKey();
    process.env.STELLAR_DISTRIBUTOR_SECRET_KEY = distributorAccount.secret();

    const investorAccount = await createAccount();
    investorAddress = investorAccount.publicKey();

    const moduleRef = await testModuleBootstrapper();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();

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

  describe('POST - /contract/transfer/transaction', () => {
    it('should create a transfer transaction', async () => {
      jest
        .mocked(SorobanContractAdapter.prototype.buildTransferTokenTransaction)
        .mockResolvedValueOnce('test-transaction-xdr');

      await request(app.getHttpServer())
        .post('/api/v1/contract/transfer/transaction')
        .send({
          ...createTransferDto,
          investorAddress,
        })
        .auth(adminToken, { type: 'bearer' })
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
          expect(
            SorobanContractAdapter.prototype.buildTransferTokenTransaction,
          ).toHaveBeenCalledWith(
            expect.any(Object),
            investorAddress,
            createTransferDto.tokenAddress,
            createTransferDto.amount,
          );
        });
    });

    it('should handle soroban contract interaction errors', async () => {
      jest
        .mocked(SorobanContractAdapter.prototype.buildTransferTokenTransaction)
        .mockRejectedValueOnce(
          new InternalServerErrorException('Failed to transfer token'),
        );

      await request(app.getHttpServer())
        .post('/api/v1/contract/transfer/transaction')
        .send({ ...createTransferDto, investorAddress })
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .then(({ body }) => {
          expect(body).toEqual(
            expect.objectContaining({
              error: expect.objectContaining({
                detail: expect.stringContaining('Failed to transfer token'),
              }),
            }),
          );
        });
    });
  });

  describe('POST - /contract/transfer', () => {
    it('should submit a transfer transaction', async () => {
      jest
        .mocked(StellarTransactionAdapter.prototype.submitSorobanTransaction)
        .mockResolvedValueOnce({
          status: 'SUCCESS',
          txHash: 'test-transaction-hash',
        } as any);

      await request(app.getHttpServer())
        .post('/api/v1/contract/transfer')
        .send(submitTransactionDto)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              attributes: expect.objectContaining({
                type: TRANSACTION_TYPE.DIRECT_PURCHASE,
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
          expect(
            StellarTransactionAdapter.prototype.submitSorobanTransaction,
          ).toHaveBeenCalledWith(submitTransactionDto.signedXdr);
        });
    });

    it('should throw a project not found exception', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/contract/transfer')
        .send({ ...submitTransactionDto, projectUuid: 'invalid-uuid' })
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.NOT_FOUND)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            error: expect.objectContaining({
              detail: 'Project with invalid-uuid not found',
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });
});
