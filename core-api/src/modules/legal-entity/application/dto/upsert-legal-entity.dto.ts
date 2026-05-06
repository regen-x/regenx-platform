import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertLegalEntityDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  entityName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradingName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  abn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  acn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jurisdiction?: string;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'inactive', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'active', 'inactive', 'archived'])
  status?: 'draft' | 'active' | 'inactive' | 'archived';

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  operationalRole?: string;

  @ApiPropertyOptional({ enum: ['self_custody', 'regenx_custody'] })
  @IsOptional()
  @IsIn(['self_custody', 'regenx_custody'])
  custodyModel?: 'self_custody' | 'regenx_custody';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
