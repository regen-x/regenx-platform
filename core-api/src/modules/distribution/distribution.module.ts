import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DistributionController } from './interface/distribution.controller';
import { DistributionService } from './application/service/distribution.service';
import { DistributionEventEntity } from './infrastructure/persistence/entities/distribution-event.entity';
import { DistributionEntitlementEntity } from './infrastructure/persistence/entities/distribution-entitlement.entity';
import { DistributionPayoutEntity } from './infrastructure/persistence/entities/distribution-payout.entity';
import { DistributionRecordEntity } from './infrastructure/persistence/entities/distribution-record.entity';
import { NotificationModule } from '../notification/notification.module';
import { OwnershipEntity } from '../ownership/infrastructure/persistence/entities/ownership.entity';
import { ProjectEntity } from '../project/infrastructure/persistence/entities/project.entity';
import { TransactionEntity } from '../transaction/infrastructure/persistence/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DistributionEventEntity,
      DistributionEntitlementEntity,
      DistributionPayoutEntity,
      DistributionRecordEntity,
      OwnershipEntity,
      ProjectEntity,
      TransactionEntity,
    ]),
    NotificationModule,
  ],
  controllers: [DistributionController],
  providers: [DistributionService],
  exports: [DistributionService],
})
export class DistributionModule {}
