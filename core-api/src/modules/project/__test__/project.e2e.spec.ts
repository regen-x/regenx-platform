import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import {
  createProjectDto,
  genericProjectResponseDto,
  getAllProjectsResponseDto,
} from './mocks/project.e2e.mocks';
import { createAccessToken } from '../../../test/test.util';
import { testModuleBootstrapper } from '../../../test/test.module.bootstrapper';
import { setupApp } from '../../../configuration/app.configuration';
import { loadFixtures } from '../../../../data/util/loader';
import { createAccount } from '../../../common/infrastructure/stellar/stellar-local-setup';
import { ContractService } from '../../contract/application/service/contract.service';

const DELAY_IN_MILLISECONDS = 20000;

describe('Project Module', () => {
  let app: INestApplication;
  let contractService: ContractService;

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

    await loadFixtures(
      `${__dirname}/fixture`,
      join(__dirname, '..', '..', '..', 'configuration/orm.configuration.ts'),
    );
    const moduleRef = await testModuleBootstrapper();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();

    contractService = app.get(ContractService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET - /project', () => {
    it('should return paginated projects', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/project')
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining(
            getAllProjectsResponseDto,
          );
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should allow to filter by attributes', async () => {
      const userUuid = '28a129c4-7526-449e-98d0-4410333b446a';
      const expectedProjectUuid = '28a129c4-7526-449e-98d0-4410333b446b';

      await request(app.getHttpServer())
        .get(`/api/v1/project?filter[userUuid]=${userUuid}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({
                id: expectedProjectUuid,
              }),
            ]),
          });
          expect(body).toEqual(expectedResponse);
        });
    });
  });

  describe('GET - /project/:uuid', () => {
    const projectUuid = '28a129c4-7526-449e-98d0-4410333b446b';

    it('should return a project', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/project/${projectUuid}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.objectContaining({
              id: expect.any(String),
              attributes: expect.objectContaining(genericProjectResponseDto),
            }),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should throw an error if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/project/${projectUuid}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should throw a not found exception if the project is not found', async () => {
      const nonExistentProjectUuid = '28a129c4-7526-449e-98d0-4410333b555b';

      await request(app.getHttpServer())
        .get(`/api/v1/project/${nonExistentProjectUuid}`)
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.NOT_FOUND)
        .then(({ body }) => {
          expect(body.error).toEqual(
            expect.objectContaining({
              status: String(HttpStatus.NOT_FOUND),
              source: expect.objectContaining({
                pointer: `/api/v1/project/${nonExistentProjectUuid}`,
              }),
              title: expect.any(String),
              detail: expect.any(String),
            }),
          );
        });
    });
  });

  describe('POST - /project', () => {
    it(
      'should create a project',
      async () => {
        jest.spyOn(contractService, 'issueToken').mockResolvedValueOnce();

        await request(app.getHttpServer())
          .post('/api/v1/project')
          .auth(adminToken, { type: 'bearer' })
          .send(createProjectDto)
          .expect(HttpStatus.CREATED);
      },
      DELAY_IN_MILLISECONDS,
    );

    it('should throw an error if the owner address is not a valid Stellar public key', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/project')
        .auth(adminToken, { type: 'bearer' })
        .send({ ...createProjectDto, ownerAddress: 'invalid-address' })
        .expect(HttpStatus.BAD_REQUEST)
        .then(({ body }) => {
          expect(body.error).toEqual(
            expect.objectContaining({
              detail: ['Owner address must be a valid Stellar public key'],
            }),
          );
        });
    });

    it('should throw an error if user is not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/project')
        .send(createProjectDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should throw a bad request exception if the project is not valid', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/project')
        .auth(adminToken, { type: 'bearer' })
        .send({ ...createProjectDto, name: '', tokenSymbol: '' })
        .expect(HttpStatus.BAD_REQUEST)
        .then(({ body }) => {
          expect(body.error).toEqual(
            expect.objectContaining({
              status: String(HttpStatus.BAD_REQUEST),
              source: expect.objectContaining({
                pointer: '/api/v1/project',
              }),
              title: expect.any(String),
              detail: [
                'name should not be empty',
                'Token symbol must only contain uppercase letters and numbers.',
                'Token symbol must be between 4 and 12 characters.',
              ],
            }),
          );
        });
    });

    it('should throw a bad request exception if the project already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/project')
        .auth(adminToken, { type: 'bearer' })
        .send(createProjectDto)
        .expect(HttpStatus.BAD_REQUEST)
        .then(({ body }) => {
          expect(body.error).toEqual(
            expect.objectContaining({
              detail: expect.stringContaining(
                `Project with name ${createProjectDto.name} already exists`,
              ),
            }),
          );
        });
    });

    it('should throw a bad request exception if the token symbol already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/project')
        .auth(adminToken, { type: 'bearer' })
        .send({ ...createProjectDto, name: 'New Project' })
        .expect(HttpStatus.BAD_REQUEST)
        .then(({ body }) => {
          expect(body.error).toEqual(
            expect.objectContaining({
              detail: expect.stringContaining(
                `Project with symbol ${createProjectDto.tokenSymbol} already exists`,
              ),
            }),
          );
        });
    });
  });
});
