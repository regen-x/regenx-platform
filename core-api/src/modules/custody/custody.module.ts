import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvestorVerificationEntity } from '../investor-verification/entities/investor-verification.entity';
import { UserEntity } from '../iam/user/infrastructure/persistence/entities/user.entity';
import { ProjectEntity } from '../project/infrastructure/persistence/entities/project.entity';
import { OrderEntity } from '../order/infrastructure/persistence/entities/order.entity';
import { CustodyProviderFactory } from './application/service/custody-provider.factory';
import { CustodyAccountService } from './application/service/custody-account.service';
import { CustodyReconciliationService } from './application/service/custody-reconciliation.service';
import { TestnetStellarCustodyProvider } from './application/providers/testnet-stellar-custody.provider';
import { FireblocksCustodyProvider } from './application/providers/fireblocks-custody.provider';
import { ZodiaCustodyProvider } from './application/providers/zodia-custody.provider';
import { InvestorCustodyAccountEntity } from './infrastructure/persistence/entities/investor-custody-account.entity';
import { CustodyTransactionEntity } from './infrastructure/persistence/entities/custody-transaction.entity';
import { SystemCustodyAccountEntity } from './infrastructure/persistence/entities/system-custody-account.entity';
import { CustodyController } from './interface/custody.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvestorCustodyAccountEntity,
      CustodyTransactionEntity,
      SystemCustodyAccountEntity,
      InvestorVerificationEntity,
      UserEntity,
      ProjectEntity,
      OrderEntity,
    ]),
  ],
  controllers: [CustodyController],
  providers: [
    CustodyProviderFactory,
    CustodyAccountService,
    CustodyReconciliationService,
    TestnetStellarCustodyProvider,
    FireblocksCustodyProvider,
    ZodiaCustodyProvider,
  ],
  exports: [CustodyAccountService, CustodyReconciliationService, CustodyProviderFactory],
})
export class CustodyModule {}
