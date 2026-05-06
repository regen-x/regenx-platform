import { Module } from '@nestjs/common';

import { AuddController } from './audd.controller';
import { AuddService } from './audd.service';

@Module({
  controllers: [AuddController],
  providers: [AuddService],
  exports: [AuddService],
})
export class AuddModule {}
