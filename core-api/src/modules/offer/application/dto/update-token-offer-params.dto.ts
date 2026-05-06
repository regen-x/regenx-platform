import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class UpdateTokenOfferParamsDto {
  @ApiProperty({
    description: 'The offer price',
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @Transform(({ value }) => parseInt(Number(value).toFixed(0)))
  price: number;

  @ApiProperty({
    description: 'The offer user address',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @IsStellarPublicKey()
  userAddress: string;
}
