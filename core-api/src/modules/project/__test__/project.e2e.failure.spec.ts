import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import { createProjectDto } from './mocks/project.e2e.mocks';
import { createAccessToken } from '../../../test/test.util';
import { setupApp } from '../../../configuration/app.configuration';
import { loadFixtures } from '../../../../data/util/loader';
import {
  stellarAccountAdapterMock,
  stellarAssetAdapterMock,
  stellarTransactionAdapterMock,
  testStellarModuleBootstrapper,
} from '../../../test/test.stellar.module.bootstrapper';

describe('Project Module', () => {
  let app: INestApplication;

  const adminToken = createAccessToken({
    sub: '00000000-0000-0000-0000-00000000000X',
  });

  beforeAll(async () => {
    await loadFixtures(
      `${__dirname}/fixture`,
      join(__dirname, '..', '..', '..', 'configuration/orm.configuration.ts'),
    );

    const moduleRef = await testStellarModuleBootstrapper();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST - /project', () => {
    it('should throw an error if changing distributor trust fails', async () => {
      stellarAssetAdapterMock.buildAsset.mockReturnValueOnce({});
      stellarAccountAdapterMock.getAccount.mockRejectedValueOnce(
        new Error('Unknown error changing trust'),
      );

      await request(app.getHttpServer())
        .post('/api/v1/project')
        .auth(adminToken, { type: 'bearer' })
        .send(createProjectDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .then(({ body }) => {
          expect(body.error).toEqual(
            expect.objectContaining({
              status: String(HttpStatus.INTERNAL_SERVER_ERROR),
              source: expect.objectContaining({
                pointer: '/api/v1/project',
              }),
              title: 'Unknown error',
              detail: 'Unknown error changing trust',
            }),
          );
        });
    });

    it('should throw an error if issuing a new token fails', async () => {
      stellarAssetAdapterMock.buildAsset.mockReturnValueOnce({});
      stellarAccountAdapterMock.getAccount.mockResolvedValueOnce({});
      stellarAccountAdapterMock.getKeypair.mockReturnValueOnce({});
      stellarAccountAdapterMock.createChangeTrustOperation.mockReturnValueOnce(
        {},
      );
      stellarTransactionAdapterMock.buildTransaction.mockResolvedValueOnce({});
      stellarTransactionAdapterMock.signTransaction.mockReturnValueOnce({});
      stellarTransactionAdapterMock.submitTransaction.mockResolvedValueOnce({});
      stellarAccountAdapterMock.getAccount.mockRejectedValueOnce(
        new Error('Unknown error issuing asset'),
      );

      await request(app.getHttpServer())
        .post('/api/v1/project')
        .auth(adminToken, { type: 'bearer' })
        .send(createProjectDto)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .then(({ body }) => {
          expect(body.error).toEqual(
            expect.objectContaining({
              status: String(HttpStatus.INTERNAL_SERVER_ERROR),
              source: expect.objectContaining({
                pointer: '/api/v1/project',
              }),
              title: 'Unknown error',
              detail: 'Unknown error issuing asset',
            }),
          );
        });
    });
  });
});
