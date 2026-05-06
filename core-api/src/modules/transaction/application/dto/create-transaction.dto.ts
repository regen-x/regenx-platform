import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TRANSACTION_TYPE } from '../../domain/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../domain/transaction-status.enum';

export class CreateTransactionDto {
  @IsOptional()
  @IsNumber()
  userId?: number | null;

  @IsOptional()
  @IsNumber()
  projectId?: number | null;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  tokenAmount?: number | null;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNotEmpty()
  @IsEnum(TRANSACTION_TYPE)
  type: TRANSACTION_TYPE;

  @IsOptional()
  @IsEnum(TRANSACTION_STATUS)
  status?: TRANSACTION_STATUS;

  @IsOptional()
  @IsString()
  reference?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  settledAt?: Date | string | null;
}
