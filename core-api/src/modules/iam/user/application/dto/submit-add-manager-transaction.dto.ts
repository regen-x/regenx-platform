import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateAddManagerTransactionDto } from './create-add-manager-transaction.dto';

export class SubmitAddManagerTransactionDto extends CreateAddManagerTransactionDto {
  @ApiProperty()
  @IsString()
  transactionXdr: string;
}
