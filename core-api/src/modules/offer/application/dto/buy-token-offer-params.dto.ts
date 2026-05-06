import { ApiProperty } from '@nestjs/swagger';
import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';
import { IsString } from 'class-validator';

export class BuyTokenOfferParamsDto {
  @ApiProperty()
  @IsString()
  @IsStellarPublicKey()
  buyerAddress: string;
}
