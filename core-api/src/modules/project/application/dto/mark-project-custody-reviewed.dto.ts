import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarkProjectCustodyReviewedDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
