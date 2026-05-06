import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpsertSpvDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalEntityName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jurisdiction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  structureType?: string;

  @ApiPropertyOptional({ enum: ['draft', 'ready', 'active', 'inactive', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'ready', 'active', 'inactive', 'archived'])
  status?: 'draft' | 'ready' | 'active' | 'inactive' | 'archived';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  sponsorEntityId?: number;

  @ApiPropertyOptional({ enum: ['self_custody', 'regenx_custody'] })
  @IsOptional()
  @IsIn(['self_custody', 'regenx_custody'])
  custodyModel?: 'self_custody' | 'regenx_custody';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  projectId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
