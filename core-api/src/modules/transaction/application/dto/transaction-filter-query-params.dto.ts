import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TRANSACTION_TYPE } from '../../domain/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../domain/transaction-status.enum';

export class TransactionFilterQueryParamsDto {
  @IsOptional()
  @IsString()
  projectUuid?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(TRANSACTION_TYPE)
  type?: TRANSACTION_TYPE;

  @IsOptional()
  @IsEnum(TRANSACTION_STATUS)
  status?: TRANSACTION_STATUS;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
