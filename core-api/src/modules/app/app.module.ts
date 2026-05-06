import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  addTransactionalDataSource,
  getDataSourceByName,
} from 'typeorm-transactional';

import { configuration } from '../../configuration/configuration';
import { configurationValidate } from '../../configuration/configuration.validate';
import { datasourceOptions } from '../../configuration/orm.configuration';
import { CommonModule } from '../../common/common.module';
import { AppService } from './application/service/app.service';
import { ResponseSerializerService } from './application/service/response-serializer.service';
import { AssetModule } from '../asset/asset.module';
import { ContractModule } from '../contract/contract.module';
import { HealthController } from '../health/interface/health.controller';
import { IamModule } from '../iam/iam.module';
import { InvestorCertificateModule } from '../investor-certificate/investor-certificate.module';
import { InvestorVerificationModule } from '../investor-verification/investor-verification.module';
import { OfferModule } from '../offer/offer.module';
import { ProjectModule } from '../project/project.module';
import { TransactionModule } from '../transaction/transaction.module';
import { DeveloperProfileModule } from '../developer-profile/developer-profile.module';
import { OwnershipModule } from '../ownership/ownership.module';
import { StellarModule } from '../stellar/stellar.module';
import { DistributionModule } from '../distribution/distribution.module';
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import { SupportModule } from '../support/support.module';
import { LegalEntityModule } from '../legal-entity/legal-entity.module';
import { CustodyModule } from '../custody/custody.module';
import { AuddModule } from '../audd/audd.module';

@Global()
@Module({
  imports: [
    DeveloperProfileModule,
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: configurationValidate,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...datasourceOptions,
        autoLoadEntities: true,
      }),
      dataSourceFactory: async (options) => {
        return (
          getDataSourceByName('default') ||
          addTransactionalDataSource(new DataSource(options))
        );
      },
    }),
    IamModule,
    ProjectModule,
    CommonModule,
    DiscoveryModule,
    AssetModule,
    ContractModule,
    OfferModule,
    TransactionModule,
    InvestorCertificateModule,
    InvestorVerificationModule,
    OwnershipModule,
    StellarModule,
    DistributionModule,
    OrderModule,
    NotificationModule,
    SupportModule,
    LegalEntityModule,
    CustodyModule,
    AuddModule,
  ],
  providers: [AppService, ResponseSerializerService],
  exports: [AppService, ResponseSerializerService],
  controllers: [HealthController],
})
export class AppModule {}
