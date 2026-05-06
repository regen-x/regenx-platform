import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileStorageModule } from '../file-storage/file-storage.module';
import { UserEntity } from '../iam/user/infrastructure/persistence/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { SupportTicketService } from './application/service/support-ticket.service';
import { SupportTicketEntity } from './infrastructure/persistence/entities/support-ticket.entity';
import { SupportTicketController } from './interface/support-ticket.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicketEntity, UserEntity]),
    FileStorageModule,
    NotificationModule,
  ],
  controllers: [SupportTicketController],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportModule {}
