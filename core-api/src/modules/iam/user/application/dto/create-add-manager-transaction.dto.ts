import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAddManagerTransactionDto {
  @ApiProperty()
  @IsString()
  managerUuid: string;
}
