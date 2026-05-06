import { forwardRef, Module } from '@nestjs/common';
import { ContractService } from './application/service/contract.service';
import { ContractResponseAdapter } from './application/adapter/contract-response.adapter';
import { ContractController } from './interface/contract.controller';
import { CommonModule } from '../../common/common.module';
import { StellarModule } from '../../common/infrastructure/stellar/stellar.module';
import { TransactionModule } from '../transaction/transaction.module';
import { ProjectModule } from '../project/project.module';
import { UserModule } from '../iam/user/user.module';

@Module({
  imports: [
    CommonModule,
    StellarModule,
    forwardRef(() => TransactionModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => UserModule),
  ],
  providers: [ContractService, ContractResponseAdapter],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ContractModule {}
