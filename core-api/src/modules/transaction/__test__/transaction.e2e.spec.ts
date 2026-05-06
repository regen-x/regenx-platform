import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupApp } from '../../../configuration/app.configuration';
import { createAccessToken } from '../../../test/test.util';
import { loadFixtures } from '../../../../data/util/loader';
import { join } from 'path';
import { testModuleBootstrapper } from '../../../test/test.module.bootstrapper';
import { TRANSACTION_TYPE } from '../domain/transaction-type.enum';

describe('Transaction Module', () => {
  let app: INestApplication;

  const adminToken = createAccessToken({
    sub: '00000000-0000-0000-0000-00000000000X',
  });

  beforeAll(async () => {
    await loadFixtures(
      `${__dirname}/fixture`,
      join(__dirname, '..', '..', '..', 'configuration/orm.configuration.ts'),
    );
    const moduleRef = await testModuleBootstrapper();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET - /transaction', () => {
    it('should return paginated transactions', async () => {
      await request(app.getHttpServer())
        .get(
          '/api/v1/transaction?filter[buyerAddress]=GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI',
        )
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const expectedResponse = expect.objectContaining({
            data: expect.arrayContaining([
              expect.objectContaining({ type: 'transaction' }),
              expect.objectContaining({ type: 'transaction' }),
              expect.objectContaining({ type: 'transaction' }),
            ]),
          });
          expect(body).toEqual(expectedResponse);
        });
    });

    it('should filter transactions by type', async () => {
      await request(app.getHttpServer())
        .get(
          `/api/v1/transaction?filter[type]=${TRANSACTION_TYPE.DIRECT_PURCHASE}&filter[buyerAddress]=GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI`,
        )
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          body.data.forEach((transaction) => {
            expect(transaction.attributes.type).toBe(
              TRANSACTION_TYPE.DIRECT_PURCHASE,
            );
          });
        });
    });

    it('should filter transactions by project', async () => {
      const projectUuid = '28a129c4-7526-449e-98d0-4410333b446b';

      await request(app.getHttpServer())
        .get(
          `/api/v1/transaction?filter[projectUuid]=${projectUuid}&filter[buyerAddress]=GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI`,
        )
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          body.data.forEach((transaction) => {
            expect(transaction.attributes.projectUuid).toBe(projectUuid);
          });
        });
    });

    it('should sort transactions by amount', async () => {
      await request(app.getHttpServer())
        .get(
          '/api/v1/transaction?sort[amount]=DESC&filter[buyerAddress]=GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI',
        )
        .auth(adminToken, { type: 'bearer' })
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          const amounts = body.data.map(
            (transaction) => transaction.attributes.amount,
          );
          const sortedAmounts = [...amounts].sort((a, b) => b - a);
          expect(amounts).toEqual(sortedAmounts);
        });
    });
  });
});
