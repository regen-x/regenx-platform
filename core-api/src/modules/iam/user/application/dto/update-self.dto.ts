import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { IsStellarPublicKey } from '../../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class UpdateSelfDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  birthdate: string;

  @ApiPropertyOptional()
  @IsString()
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsStellarPublicKey()
  @IsOptional()
  walletAddress: string;
}
