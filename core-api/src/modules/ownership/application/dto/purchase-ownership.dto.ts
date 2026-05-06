import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class PurchaseOwnershipDto {
  @IsNumber()
  @IsPositive()
  projectId!: number;

  @IsNumber()
  @IsPositive()
  audAmount!: number;

  @IsNumber()
  @IsPositive()
  tokenAmount!: number;

  @IsOptional()
  @IsString()
  walletPublicKey?: string;

  @IsOptional()
  @IsString()
  txHash?: string;
}
