import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { UpdateProjectWalletConfigDto } from './update-project-wallet-config.dto';

export class RequestProjectWalletChangeDto {
  @ApiProperty({ type: UpdateProjectWalletConfigDto })
  @ValidateNested()
  @Type(() => UpdateProjectWalletConfigDto)
  changes: UpdateProjectWalletConfigDto;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  reason: string;
}
