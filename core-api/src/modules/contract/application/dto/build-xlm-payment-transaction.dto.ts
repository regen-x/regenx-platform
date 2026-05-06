import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class BuildXlmPaymentTransactionDto {
  @IsString()
  @IsNotEmpty()
  investorAddress: string;

  @IsNumber()
  @Min(0.0000001)
  amount: number;
}
