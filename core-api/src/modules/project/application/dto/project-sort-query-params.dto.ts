import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SortType } from '../../../../common/application/enum/sort-type.enum';

export class ProjectSortQueryParamsDto {
  @ApiPropertyOptional()
  @IsEnum(SortType)
  @IsOptional()
  name?: SortType;

  @ApiPropertyOptional()
  @IsEnum(SortType)
  @IsOptional()
  startDate?: SortType;

  @ApiPropertyOptional()
  @IsEnum(SortType)
  @IsOptional()
  endDate?: SortType;
}
