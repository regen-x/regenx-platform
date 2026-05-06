import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderController } from './interface/order.controller';
import { OrderService } from './application/service/order.service';
import { OrderEntity } from './infrastructure/persistence/entities/order.entity';
import { NotificationModule } from '../notification/notification.module';
import { ProjectEntity } from '../project/infrastructure/persistence/entities/project.entity';
import { TransactionEntity } from '../transaction/infrastructure/persistence/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, ProjectEntity, TransactionEntity]),
    NotificationModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
