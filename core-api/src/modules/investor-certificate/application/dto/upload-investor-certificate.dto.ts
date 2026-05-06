import { IsIn, IsOptional, IsString } from 'class-validator';

export class UploadInvestorCertificateDto {
  @IsString()
  @IsIn(['wholesale', 'sophisticated'])
  investorCategory: 'wholesale' | 'sophisticated';

  @IsString()
  @IsIn(['accountant_certificate', 'income', 'net_assets'])
  qualificationMethod: 'accountant_certificate' | 'income' | 'net_assets';

  @IsOptional()
  @IsString()
  issuedAt?: string;

  @IsOptional()
  @IsString()
  accountantName?: string;

  @IsOptional()
  @IsString()
  accountantFirm?: string;

  @IsOptional()
  @IsString()
  membershipBody?: string;

  @IsOptional()
  @IsString()
  membershipNumber?: string;
}
