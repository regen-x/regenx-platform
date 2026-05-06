import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetModule } from '../asset/asset.module';
import { DeveloperProfileModule } from '../developer-profile/developer-profile.module';
import { NotificationModule } from '../notification/notification.module';
import { SpvModule } from '../spv/spv.module';
import { OwnershipEntity } from '../ownership/infrastructure/persistence/entities/ownership.entity';
import { OwnershipTransactionEntity } from '../ownership/infrastructure/persistence/entities/ownership-transaction.entity';
import { TransactionEntity } from '../transaction/infrastructure/persistence/entities/transaction.entity';
import { UserEntity } from '../iam/user/infrastructure/persistence/entities/user.entity';

import { ProjectController } from './interface/project.controller';
import { AdminCustodyController } from './interface/admin-custody.controller';
import { ProjectReadinessController } from './interface/project-readiness.controller';

import { ProjectFileEntity } from './infrastructure/persistence/entities/project-file.entity';
import { ProjectEntity } from './infrastructure/persistence/entities/project.entity';
import { ProjectVersionEntity } from './infrastructure/persistence/entities/project-version.entity';
import { ProjectCashflowAllocationEntity } from './infrastructure/persistence/entities/project-cashflow-allocation.entity';
import { ProjectEnergyConfigurationEntity } from './infrastructure/persistence/entities/project-energy-configuration.entity';
import { ProjectInvestmentStructureEntity } from './infrastructure/persistence/entities/project-investment-structure.entity';
import { ProjectIssuanceEntity } from './infrastructure/persistence/entities/project-issuance.entity';
import { ProjectReturnOutputsEntity } from './infrastructure/persistence/entities/project-return-outputs.entity';
import { ProjectRevenueProfileEntity } from './infrastructure/persistence/entities/project-revenue-profile.entity';
import { ProjectRiskInputsEntity } from './infrastructure/persistence/entities/project-risk-inputs.entity';
import { ProjectPostgresqlRepository } from './infrastructure/database/project.postgresql.repository';

import { ProjectService } from './application/service/project.service';
import { ProjectReadinessService } from './application/service/project-readiness.service';
import { ReturnEngineService } from './application/service/return-engine.service';
import { RpaSummaryService } from './application/service/rpa-summary.service';
import { ProjectMapper } from './application/mapper/project.mapper';
import { PROJECT_REPOSITORY_KEY } from './application/repository/project.repository.interface';

import { DeveloperProfileEntity } from '../developer-profile/infrastructure/persistence/entities/developer-profile.entity';
import { SpvEntity } from '../spv/infrastructure/persistence/entities/spv.entity';
import { SpvEntityRoleEntity } from '../spv/infrastructure/persistence/entities/spv-entity-role.entity';
import { ProjectWalletAuditEntity } from './infrastructure/persistence/entities/project-wallet-audit.entity';
import { LegalEntityEntity } from '../legal-entity/infrastructure/persistence/entities/legal-entity.entity';
import { AuditLogEntity } from './infrastructure/persistence/entities/audit-log.entity';
import { CustodyChangeRequestEntity } from './infrastructure/persistence/entities/custody-change-request.entity';

const ProjectRepositoryProvider = {
  provide: PROJECT_REPOSITORY_KEY,
  useClass: ProjectPostgresqlRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectEntity,
      ProjectCashflowAllocationEntity,
      ProjectEnergyConfigurationEntity,
      ProjectInvestmentStructureEntity,
      ProjectIssuanceEntity,
      ProjectFileEntity,
      ProjectReturnOutputsEntity,
      ProjectRevenueProfileEntity,
      ProjectRiskInputsEntity,
      ProjectVersionEntity,
      DeveloperProfileEntity,
      OwnershipEntity,
      OwnershipTransactionEntity,
      TransactionEntity,
      UserEntity,
      SpvEntity,
      SpvEntityRoleEntity,
      ProjectWalletAuditEntity,
      LegalEntityEntity,
      AuditLogEntity,
      CustodyChangeRequestEntity,
    ]),
    AssetModule,
    DeveloperProfileModule,
    NotificationModule,
    SpvModule,
  ],
  controllers: [ProjectController, ProjectReadinessController, AdminCustodyController],
  providers: [
    ProjectService,
    ProjectReadinessService,
    ReturnEngineService,
    RpaSummaryService,
    ProjectMapper,
    ProjectRepositoryProvider,
  ],
  exports: [
    ProjectService,
    ProjectReadinessService,
    ReturnEngineService,
    RpaSummaryService,
    ProjectMapper,
    ProjectRepositoryProvider,
  ],
})
export class ProjectModule {}
