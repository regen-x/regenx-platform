import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { IsStellarPublicKey } from '../../../../common/infrastructure/stellar/decorator/is-public-key.decorator';

export class OfferFilterQueryParamsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tokenSymbol?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsStellarPublicKey()
  userAddress?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value * 10 ** 7))
  price?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsStellarPublicKey()
  excludeAddress?: string;
}
