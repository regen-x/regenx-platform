import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserType } from '../../domain/user-type.enum';

export class UserFilterQueryParamsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullname?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsEnum(UserType)
  @IsOptional()
  type?: UserType;

  @ApiPropertyOptional()
  @IsString()
  @IsUUID()
  @IsOptional()
  walletManagerUuid?: string;
}
