import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class UpdateProjectWalletConfigDto {
  @ApiPropertyOptional({ enum: ['self_custody', 'regenx_custody'] })
  @IsOptional()
  @IsIn(['self_custody', 'regenx_custody'])
  custodyMode?: 'self_custody' | 'regenx_custody';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsStellarPublicKey()
  developerWalletAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsStellarPublicKey()
  issuerWalletAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsStellarPublicKey()
  distributionWalletAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsStellarPublicKey()
  proceedsWalletAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
