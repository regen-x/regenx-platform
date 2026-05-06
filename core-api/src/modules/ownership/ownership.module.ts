import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OwnershipController } from './interface/ownership.controller';
import { OwnershipService } from './application/service/ownership.service';

import { OwnershipEntity } from './infrastructure/persistence/entities/ownership.entity';
import { OwnershipTransactionEntity } from './infrastructure/persistence/entities/ownership-transaction.entity';

import { ContractModule } from '../contract/contract.module';
import { ProjectModule } from '../project/project.module';
import { InvestorVerificationModule } from '../investor-verification/investor-verification.module';
import { TransactionModule } from '../transaction/transaction.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OwnershipEntity,
      OwnershipTransactionEntity,
    ]),
    forwardRef(() => ContractModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => InvestorVerificationModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => OrderModule),
  ],
  controllers: [OwnershipController],
  providers: [OwnershipService],
  exports: [OwnershipService],
})
export class OwnershipModule {}
