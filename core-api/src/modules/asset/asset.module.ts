import { Module } from '@nestjs/common';
import { AssetService } from './application/service/asset.service';
import { CommonModule } from '../../common/common.module';
import { StellarModule } from '../../common/infrastructure/stellar/stellar.module';

@Module({
  imports: [CommonModule, StellarModule],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
