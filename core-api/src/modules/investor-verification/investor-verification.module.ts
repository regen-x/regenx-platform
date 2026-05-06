import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestorVerificationEntity } from './entities/investor-verification.entity';
import { InvestorVerificationService } from './investor-verification.service';
import { InvestorVerificationController } from './investor-verification.controller';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { NotificationModule } from '../notification/notification.module';
import { SumsubModule } from '../sumsub/sumsub.module';
import { UserEntity } from '../iam/user/infrastructure/persistence/entities/user.entity';
import { AuditLogEntity } from '../project/infrastructure/persistence/entities/audit-log.entity';
import { CustodyModule } from '../custody/custody.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvestorVerificationEntity,
      UserEntity,
      AuditLogEntity,
    ]),
    FileStorageModule,
    NotificationModule,
    SumsubModule,
    CustodyModule,
  ],
  providers: [InvestorVerificationService],
  controllers: [InvestorVerificationController],
  exports: [InvestorVerificationService],
})
export class InvestorVerificationModule {}
