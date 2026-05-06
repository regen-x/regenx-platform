import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { setupApp, setupSwagger } from './configuration/app.configuration';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>('frontend.url');

  app.enableCors({
    origin: [
      frontendUrl,
      'https://staging.app.regenx.io',
      'http://localhost:5173',
      'http://localhost:4173',
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  setupApp(app);
  setupSwagger(app);

  await app.listen(configService.get('server.port'));
}
bootstrap();
