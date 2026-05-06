import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class CancelTokenOfferParamsDto {
  @ApiProperty({
    description: 'The offer user address',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsStellarPublicKey()
  userAddress: string;
}
