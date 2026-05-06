import { IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { IGetAllOptions } from '../../../../common/application/interface/get-all-options.interface';
import { Transaction } from '../../domain/transaction.domain';
import { fromCommaSeparatedToArray } from '../../../../common/application/mapper/base.mapper';

type TransactionFields = IGetAllOptions<Transaction>['fields'];

export class TransactionFieldsQueryParamsDto {
  @IsOptional()
  @IsIn(['amount', 'type'] as TransactionFields, { each: true })
  @Transform((params) => fromCommaSeparatedToArray(params.value))
  @IsOptional()
  target?: TransactionFields;
}
