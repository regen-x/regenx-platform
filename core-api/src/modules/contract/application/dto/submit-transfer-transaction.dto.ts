import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SubmitTransferTransactionDto {
  @ApiProperty({
    description: 'The signed XDR transaction',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  signedXdr: string;

  @ApiProperty({
    description: 'The project UUID',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  projectUuid: string;

  @ApiProperty({
    description: 'The token amount',
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'The buyer address',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  buyerAddress: string;
}
