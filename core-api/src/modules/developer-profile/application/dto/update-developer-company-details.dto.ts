import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDeveloperCompanyDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalEntityName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tradingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  abn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  acn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  registeredAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  businessDescription?: string;
}
