import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpsertSpvRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  entityId?: number | null;

  @ApiPropertyOptional({
    enum: [
      'developer',
      'sponsor',
      'trustee',
      'responsible_entity',
      'operator',
      'issuer',
      'custodian',
      'custody_provider',
      'proceeds_recipient',
    ],
  })
  @IsString()
  role: string;

  @ApiPropertyOptional({ enum: ['suggested', 'linked', 'approved', 'rejected'] })
  @IsOptional()
  @IsIn(['suggested', 'linked', 'approved', 'rejected'])
  status?: 'suggested' | 'linked' | 'approved' | 'rejected';

  @ApiPropertyOptional({ enum: ['auto', 'manual'] })
  @IsOptional()
  @IsIn(['auto', 'manual'])
  source?: 'auto' | 'manual';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
