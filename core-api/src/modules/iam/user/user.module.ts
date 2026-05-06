import { forwardRef, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadUserPolicyHandler } from '../authentication/application/policy/read-user-policy.handler';
import { USER_REPOSITORY_KEY } from './application/repository/user.repository.interface';
import { UserMysqlRepository } from './infrastructure/database/user.mysql.repository';
import { AuthorizationModule } from '../authorization/authorization.module';
import { userPermissions } from './domain/user.permission';
import { UserController } from './interface/user.controller';
import { UserService } from './application/service/user.service';
import { UserMapper } from './application/mapper/user.mapper';
import { UserResponseAdapter } from './application/adapter/user-responser.adapter';
import { UserEntity } from './infrastructure/persistence/entities/user.entity';
import { StellarModule } from '../../../common/infrastructure/stellar/stellar.module';
import { ProjectModule } from '../../project/project.module';
import { OwnershipModule } from '../../ownership/ownership.module';

const policyHandlersProviders = [ReadUserPolicyHandler];

const userRepositoryProvider: Provider = {
  provide: USER_REPOSITORY_KEY,
  useClass: UserMysqlRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AuthorizationModule.forFeature({ permissions: userPermissions }),
    StellarModule,
    forwardRef(() => ProjectModule),
    forwardRef(() => OwnershipModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    userRepositoryProvider,
    UserMapper,
    UserResponseAdapter,
    ...policyHandlersProviders,
  ],
  exports: [UserService, userRepositoryProvider, UserMapper],
})
export class UserModule {}
