import { IsOptional, IsString, MaxLength } from 'class-validator';

import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class UpdateDeveloperWalletSettingsDto {
  @IsString()
  @IsStellarPublicKey()
  walletAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  walletLabel?: string;
}
