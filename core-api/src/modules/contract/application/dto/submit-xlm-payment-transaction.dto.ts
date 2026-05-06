import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SubmitXlmPaymentTransactionDto {
  @IsString()
  @IsNotEmpty()
  signedXdr: string;

  @IsString()
  @IsNotEmpty()
  projectUuid: string;

  @IsNumber()
  @Min(0.0000001)
  amount: number;

  @IsString()
  @IsNotEmpty()
  buyerAddress: string;
}
