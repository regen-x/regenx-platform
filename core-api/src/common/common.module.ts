import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MapperService } from './application/mapper/mapper.service';
import { S3StorageService } from './infrastructure/storage/s3.storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MapperService, S3StorageService],
  exports: [MapperService, S3StorageService],
})
export class CommonModule {}
