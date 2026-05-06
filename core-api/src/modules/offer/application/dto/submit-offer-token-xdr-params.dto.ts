import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OfferTransactionType } from '../enum/offer-transaction-type.enum';
import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';
export class SubmitOfferTokenXdrParamsDto {
  @ApiProperty({
    description: 'The XDR of the offer',
    example: 'AAAAA/FJIE342NOasdeuwi',
  })
  @IsString()
  @IsNotEmpty()
  xdr: string;

  @ApiProperty({
    description: 'The type of the offer',
    example: 'create_offer',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(OfferTransactionType)
  type: OfferTransactionType;

  @ApiProperty({
    description: 'The user address',
    example:
      'GBZ2222222222222222222222222222222222222222222222222222222222222222',
  })
  @IsString()
  @IsNotEmpty()
  @IsStellarPublicKey()
  userAddress: string;
}
