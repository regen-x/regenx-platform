import { IsEnum, IsOptional } from 'class-validator';
import { SortType } from '../../../../common/application/enum/sort-type.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionSortQueryParamsDto {
  @ApiPropertyOptional()
  @IsEnum(SortType)
  @IsOptional()
  createdAt?: SortType;

  @ApiPropertyOptional()
  @IsEnum(SortType)
  @IsOptional()
  amount?: SortType;

  @ApiPropertyOptional()
  @IsEnum(SortType)
  @IsOptional()
  settledAt?: SortType;
}
