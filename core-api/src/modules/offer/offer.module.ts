import { Module, Provider } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { StellarModule } from '../../common/infrastructure/stellar/stellar.module';
import { OfferResponseAdapter } from './application/adapter/offer-responser.adapter';
import { OfferService } from './application/service/offer.service';
import { SorobanContractAdapter } from '../../common/infrastructure/stellar/soroban.contract.adapter';
import { StellarAccountAdapter } from '../../common/infrastructure/stellar/stellar.account.adapter';
import { StellarTransactionAdapter } from '../../common/infrastructure/stellar/stellar.transaction.adapter';
import { OfferController } from './interface/offer.controller';
import { OFFER_REPOSITORY_KEY } from './application/repository/offer.repository.interface';
import { OfferPostgresqlRepository } from './infrastructure/database/offer.postgresql.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfferEntity } from './infrastructure/persistence/entities/offer.entity';
import { OfferMapper } from './application/mapper/offer.mapper';
import { ContractModule } from '../contract/contract.module';
import { NotificationModule } from '../notification/notification.module';
import { OwnershipEntity } from '../ownership/infrastructure/persistence/entities/ownership.entity';
import { ProjectModule } from '../project/project.module';
import { projectPermissions } from '../project/domain/project.permission';
import { AuthorizationModule } from '../iam/authorization/authorization.module';
import { UserModule } from '../iam/user/user.module';
import { TransactionModule } from '../transaction/transaction.module';
const OfferRepositoryProvider: Provider = {
  provide: OFFER_REPOSITORY_KEY,
  useClass: OfferPostgresqlRepository,
};

@Module({
  imports: [
    CommonModule,
    StellarModule,
    TypeOrmModule.forFeature([OfferEntity, OwnershipEntity]),
    AuthorizationModule.forFeature({ permissions: projectPermissions }),
    ContractModule,
    NotificationModule,
    ProjectModule,
    UserModule,
    TransactionModule,
  ],
  providers: [
    OfferResponseAdapter,

    OfferService,
    SorobanContractAdapter,
    StellarAccountAdapter,
    StellarTransactionAdapter,
    OfferRepositoryProvider,
    OfferMapper,
  ],
  controllers: [OfferController],
})
export class OfferModule {}
