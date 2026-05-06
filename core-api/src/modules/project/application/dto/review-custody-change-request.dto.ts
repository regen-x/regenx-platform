import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class ReviewCustodyChangeRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'more_info_required'] })
  @IsIn(['approved', 'rejected', 'more_info_required'])
  status: 'approved' | 'rejected' | 'more_info_required';

  @ApiProperty()
  @IsString()
  @MinLength(2)
  adminNotes: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
