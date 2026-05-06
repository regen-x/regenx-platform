import { Module } from '@nestjs/common';
import { StellarService } from './application/service/stellar.service';

@Module({
  providers: [StellarService],
  exports: [StellarService],
})
export class StellarModule {}
