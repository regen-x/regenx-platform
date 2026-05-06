import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class TransferTokenDto {
  @ApiProperty({
    description: 'The investor address',
    type: String,
    example: 'GABCABCABCABCABCABCABCABCABCABCA',
  })
  @IsStellarPublicKey({
    message: 'Investor address must be a valid Stellar public key',
  })
  @IsString()
  @IsNotEmpty()
  investorAddress: string;

  @ApiProperty({
    description: 'The amount of tokens to transfer',
    type: Number,
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'The token address',
    type: String,
    example: 'GABCABCABCABCABCABCABCABCABCABCA',
  })
  @IsString()
  @IsNotEmpty()
  tokenAddress: string;
}
