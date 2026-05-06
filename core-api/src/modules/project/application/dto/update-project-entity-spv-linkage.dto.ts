import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProjectEntitySpvLinkageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  sponsorEntityId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  spvId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
