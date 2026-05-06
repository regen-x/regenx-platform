import { forwardRef, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './infrastructure/persistence/entities/transaction.entity';
import { TransactionController } from './interface/transaction.controller';
import { TransactionService } from './application/service/transaction.service';
import { TransactionMapper } from './application/mapper/transaction.mapper';
import { TransactionResponseAdapter } from './application/adapter/transaction-response.adapter';
import { TRANSACTION_REPOSITORY_KEY } from './application/repository/transaction.repository.interface';
import { TransactionPostgresqlRepository } from './infrastructure/database/transaction.postgresql.repository';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../iam/user/user.module';
import { ProjectModule } from '../project/project.module';
import { AuthorizationModule } from '../iam/authorization/authorization.module';
import { transactionPermissions } from './domain/transaction.permission';
import { ReadTransactionPolicyHandler } from './application/policy/read-transaction-policy.handler';

const TransactionRepositoryProvider: Provider = {
  provide: TRANSACTION_REPOSITORY_KEY,
  useClass: TransactionPostgresqlRepository,
};

const policyHandlersProviders = [ReadTransactionPolicyHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    CommonModule,
    forwardRef(() => UserModule),
    forwardRef(() => ProjectModule),
    AuthorizationModule.forFeature({ permissions: transactionPermissions }),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionRepositoryProvider,
    TransactionMapper,
    TransactionResponseAdapter,
    ...policyHandlersProviders,
  ],
  exports: [
    TransactionService,
    TransactionRepositoryProvider,
    TransactionMapper,
  ],
})
export class TransactionModule {}
