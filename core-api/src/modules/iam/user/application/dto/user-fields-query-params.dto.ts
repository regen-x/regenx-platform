import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

import { User } from '../../../user/domain/user.domain';
import { fromCommaSeparatedToArray } from '../../../../../common/application/mapper/base.mapper';
import { IGetAllOptions } from '../../../../../common/application/interface/get-all-options.interface';

type UserFields = IGetAllOptions<User>['fields'];

export class UserFieldsQueryParamsDto {
  @ApiPropertyOptional()
  @IsIn(['email', 'externalId', 'role'] as UserFields, { each: true })
  @Transform((params) => fromCommaSeparatedToArray(params.value))
  @IsOptional()
  target?: UserFields;
}
