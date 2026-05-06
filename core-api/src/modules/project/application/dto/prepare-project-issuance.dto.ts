import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PrepareProjectIssuanceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
