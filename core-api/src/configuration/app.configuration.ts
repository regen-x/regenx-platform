import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppExceptionFilter } from '../modules/app/application/filter/exception.filter';
import { GetCurrentEndpointInterceptor } from '../modules/app/application/interceptor/get-current-endpoint-interceptor';
import { AppService } from '../modules/app/application/service/app.service';
import { SWAGGER_CONFIGURATION } from '../common/application/constant/swagger.constant';

export const setupApp = (app: INestApplication) => {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalInterceptors(
    new GetCurrentEndpointInterceptor(app.get(AppService)),
  );
  app.useGlobalFilters(new AppExceptionFilter());
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
};

export const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('RegenX Core API')
    .setDescription('Handles the web API for RegenX')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, SWAGGER_CONFIGURATION);
};
