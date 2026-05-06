import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsOptional()
  @IsString()
  siteAddress?: string;

  @IsOptional()
  @IsNumber()
  fundingGoal?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  climateImpact?: string;

  @IsOptional()
  @IsNumber()
  tokenSupply?: number;

  @IsOptional()
  @IsNumber()
  tokenPrice?: number;

  @IsOptional()
  @IsString()
  ownerAddress?: string;

  @IsOptional()
  @IsString()
  tokenSymbol?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailImageUrl?: string;

  @IsOptional()
  @IsBoolean()
  generatesCarbonCredits?: boolean;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsString()
  dseType?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  minimumInvestment?: string;

  @IsOptional()
  @IsString()
  totalProjectCapex?: string;

  @IsOptional()
  @IsString()
  targetIrr?: string;

  @IsOptional()
  @IsString()
  targetAnnualYield?: string;

  @IsOptional()
  @IsString()
  investmentTermYears?: string;

  @IsOptional()
  @IsString()
  investmentSummary?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  draftPayload?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  workflowStatus?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  workflowStatusJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  battery?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  capitalStructure?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  documents?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  hybrid?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  agreement?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  useOfFunds?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  completedCount?: number;

  @IsOptional()
  @IsNumber()
  totalSections?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
