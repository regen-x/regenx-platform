import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { IGetAllOptions } from '../../../../common/application/interface/get-all-options.interface';
import { Project } from '../../domain/project.domain';
import { fromCommaSeparatedToArray } from '../../../../common/application/mapper/base.mapper';

type ProjectFields = IGetAllOptions<Project>['fields'];

export class ProjectFieldsQueryParamsDto {
  @ApiPropertyOptional()
  @IsIn(['name', 'tokenSymbol', 'location'] as ProjectFields, { each: true })
  @Transform((params) => fromCommaSeparatedToArray(params.value))
  @IsOptional()
  target?: ProjectFields;
}
