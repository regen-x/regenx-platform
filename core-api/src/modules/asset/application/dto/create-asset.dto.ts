import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  amount: string;
}
