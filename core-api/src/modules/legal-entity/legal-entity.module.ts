import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogEntity } from '../project/infrastructure/persistence/entities/audit-log.entity';
import { LegalEntityController } from './interface/legal-entity.controller';
import { LegalEntityService } from './application/service/legal-entity.service';
import { LegalEntityEntity } from './infrastructure/persistence/entities/legal-entity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LegalEntityEntity, AuditLogEntity])],
  controllers: [LegalEntityController],
  providers: [LegalEntityService],
  exports: [LegalEntityService, TypeOrmModule],
})
export class LegalEntityModule {}
