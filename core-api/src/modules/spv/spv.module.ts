import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SpvEntity } from './infrastructure/persistence/entities/spv.entity';
import { SeriesEntity } from './infrastructure/persistence/entities/series.entity';
import { StellarAssetEntity } from './infrastructure/persistence/entities/stellar-asset.entity';
import { SpvEntityRoleEntity } from './infrastructure/persistence/entities/spv-entity-role.entity';

import { ProjectEntity } from '../project/infrastructure/persistence/entities/project.entity';
import { LegalEntityEntity } from '../legal-entity/infrastructure/persistence/entities/legal-entity.entity';
import { AuditLogEntity } from '../project/infrastructure/persistence/entities/audit-log.entity';
import { DeveloperProfileEntity } from '../developer-profile/infrastructure/persistence/entities/developer-profile.entity';
import { UserEntity } from '../iam/user/infrastructure/persistence/entities/user.entity';

import { SpvService } from './application/spv.service';
import { SpvController } from './interface/spv.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpvEntity,
      SeriesEntity,
      StellarAssetEntity,
      SpvEntityRoleEntity,
      ProjectEntity,
      LegalEntityEntity,
      DeveloperProfileEntity,
      UserEntity,
      AuditLogEntity,
    ]),
  ],
  controllers: [SpvController],
  providers: [SpvService],
  exports: [SpvService],
})
export class SpvModule {}
