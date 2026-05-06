import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeveloperProfileEntity } from './infrastructure/persistence/entities/developer-profile.entity';
import { DeveloperProfileService } from './application/service/developer-profile.service';
import { DeveloperProfileController } from './interface/developer-profile.controller';
import { NotificationModule } from '../notification/notification.module';
import { UserEntity } from '../iam/user/infrastructure/persistence/entities/user.entity';
import { ProjectEntity } from '../project/infrastructure/persistence/entities/project.entity';
import { SpvEntity } from '../spv/infrastructure/persistence/entities/spv.entity';
import { SeriesEntity } from '../spv/infrastructure/persistence/entities/series.entity';
import { CustodyChangeRequestEntity } from '../project/infrastructure/persistence/entities/custody-change-request.entity';
import { AuditLogEntity } from '../project/infrastructure/persistence/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeveloperProfileEntity,
      UserEntity,
      ProjectEntity,
      SpvEntity,
      SeriesEntity,
      CustodyChangeRequestEntity,
      AuditLogEntity,
    ]),
    NotificationModule,
  ],
  controllers: [DeveloperProfileController],
  providers: [DeveloperProfileService],
  exports: [DeveloperProfileService],
})
export class DeveloperProfileModule {}
