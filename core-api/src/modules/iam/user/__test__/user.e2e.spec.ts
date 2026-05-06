import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupApp } from '../../../../configuration/app.configuration';
import { createAccessToken } from '../../../../test/test.util';
import { loadFixtures } from '../../../../../data/util/loader';
import { join } from 'path';
import { USER_ENTITY_NAME } from '../domain/user.name';
import { UserResponseDto } from '../application/dto/user-response.dto';
import {
  genericUserResponseDto,
  transactionXdr,
  validWalletAddress,
  wealthManagerUuid,
} from './mocks/user.e2e.mocks';
import {
  stellarTransactionAdapterMock,
  testStellarModuleBootstrapper,
} from '../../../../test/test.stellar.module.bootstrapper';

describe('User Module', () => {
  let app: INestApplication;

  const adminToken = createAccessToken({
    sub: '00000000-0000-0000-0000-00000000000X',
  });

  const wealthManagerToken = createAccessToken({
    sub: '00000000-0000-0000-0000-00000000000Z',
  });

  beforeAll(async () => {
    await loadFixtures(
      `${__dirname}/fixture`,
      join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'configuration/orm.configuration.ts',
      ),
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

  describe('GET - /user', () => {
    it('should return paginated users', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/user')
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                type: USER_ENTITY_NAME,
                id: expect.any(String),
                attributes: expect.objectContaining({
                  email: expect.any(String),
                  externalId: expect.any(String),
                  role: expect.any(String),
                  createdAt: expect.any(String),
                  updatedAt: expect.any(String),
                  deletedAt: null,
                }),
              }),
            ]),
            links: expect.any(Object),
            meta: expect.objectContaining({
              pageNumber: expect.any(Number),
              pageSize: expect.any(Number),
              pageCount: expect.any(Number),
              itemCount: expect.any(Number),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should allow to filter by attributes', async () => {
      const email = 'admin@test.com';

      await request(app.getHttpServer())
        .get(`/api/v1/user?filter[email]=${email}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                attributes: expect.objectContaining({
                  email,
                }),
              }),
            ]),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should allow to sort by attributes', async () => {
      const firstUser = { email: '' } as UserResponseDto;
      const lastUser = { email: '' } as UserResponseDto;
      let pageCount: number;

      await request(app.getHttpServer())
        .get('/api/v1/user?sort[email]=DESC')
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          firstUser.email = body.data[0].attributes.email;
          pageCount = body.meta.pageCount;
        });

      await request(app.getHttpServer())
        .get(`/api/v1/user?sort[email]=ASC&page[number]=${pageCount}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const resources = body.data;
          lastUser.email = resources[resources.length - 1].attributes.email;
          expect(lastUser.email).toBe(firstUser.email);
        });
    });

    it('should allow to select specific attributes', async () => {
      const attributes = [
        'email',
        'externalId',
        'role',
      ] as (keyof UserResponseDto)[];

      await request(app.getHttpServer())
        .get(`/api/v1/user?fields[target]=${attributes.join(',')}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const resourceAttributes = body.data[0].attributes;
          expect(Object.keys(resourceAttributes).length).toBe(
            attributes.length,
          );
          expect(resourceAttributes).toEqual({
            email: expect.any(String),
            externalId: expect.any(String),
            role: expect.any(String),
          });
        });
    });
  });

  describe('GET - /user/me', () => {
    it('should return current user', async () => {
      const { id, ...userResponseDto } = genericUserResponseDto;

      await request(app.getHttpServer())
        .get('/api/v1/user/me')
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              id,
              attributes: expect.objectContaining(userResponseDto),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/user/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PATCH - /user/me', () => {
    it('should update current user', async () => {
      const { id, ...userResponseDto } = genericUserResponseDto;

      await request(app.getHttpServer())
        .patch('/api/v1/user/me')
        .send({
          walletAddress: validWalletAddress,
        })
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              id,
              attributes: expect.objectContaining({
                ...userResponseDto,
                walletAddress: validWalletAddress,
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/user/me')
        .send({
          walletAddress: validWalletAddress,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should throw an error if the user tries to add a wallet that already exists', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/user/me')
        .auth(wealthManagerToken, { type: 'bearer' })
        .send({
          walletAddress: validWalletAddress,
        })
        .expect(HttpStatus.BAD_REQUEST)
        .then(({ body }) => {
          expect(body.error.detail).toContain(
            `Wallet ${validWalletAddress} is already connected to a user`,
          );
        });
    });
  });

  describe('POST - /user/me/wallet-manager/transaction', () => {
    it('should create a wallet manager cosigner transaction', async () => {
      stellarTransactionAdapterMock.createCosignerTransaction.mockResolvedValue(
        transactionXdr,
      );

      await request(app.getHttpServer())
        .post('/api/v1/user/me/wallet-manager/transaction')
        .send({
          managerUuid: wealthManagerUuid,
        })
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              attributes: expect.objectContaining({
                transactionXdr: expect.any(String),
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/user/me/wallet-manager/transaction')
        .send({
          walletAddress: validWalletAddress,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST - /user/me/wallet-manager', () => {
    it('should add a wallet manager', async () => {
      const { id, ...userResponseDto } = genericUserResponseDto;

      stellarTransactionAdapterMock.signTransaction.mockResolvedValue(
        transactionXdr,
      );

      await request(app.getHttpServer())
        .post('/api/v1/user/me/wallet-manager')
        .send({
          managerUuid: wealthManagerUuid,
          transactionXdr: transactionXdr,
        })
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              id,
              attributes: expect.objectContaining({
                ...userResponseDto,
                walletAddress: validWalletAddress,
                walletManager: wealthManagerUuid,
              }),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/user/me/wallet-manager')
        .send({
          walletAddress: validWalletAddress,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET - /user/:uuid/portfolio', () => {
    it('should return user portfolio projects', async () => {
      const userAddress =
        'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';

      await request(app.getHttpServer())
        .get(`/api/v1/user/${userAddress}/portfolio`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                type: 'project',
              }),
            ]),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should return empty portfolio for user with no transactions', async () => {
      const userAddress =
        'GDSTJ7RZNY45BTX7UVP77MPNIFMN3SJJZ4YIAESCS444OZRRGAWZ4K3L';

      await request(app.getHttpServer())
        .get(`/api/v1/user/${userAddress}/portfolio`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          expect(body.data).toHaveLength(0);
          expect(body.meta.itemCount).toBe(0);
        });
    });
  });
});
