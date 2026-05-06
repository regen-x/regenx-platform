import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectFileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  purpose: string;

  @ApiPropertyOptional()
  documentKey?: string | null;

  @ApiProperty()
  storageKey: string;

  @ApiProperty()
  originalFilename: string;

  @ApiProperty()
  mimeType: string;

  @ApiPropertyOptional()
  fileSize?: number | null;

  @ApiPropertyOptional()
  uploadedBy?: number | null;

  @ApiProperty()
  uploadedAt: string;

  @ApiPropertyOptional()
  url?: string;
}

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  uuid?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional()
  deletedAt?: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  fundingGoal?: number;

  @ApiPropertyOptional()
  fundedSoFar?: number;

  @ApiPropertyOptional()
  amountSettled?: number;

  @ApiPropertyOptional()
  investorCount?: number;

  @ApiPropertyOptional()
  unitsSold?: number;

  @ApiPropertyOptional()
  unitsRemaining?: number;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  endDate?: string;

  @ApiPropertyOptional()
  climateImpact?: string;

  @ApiPropertyOptional()
  tokenSupply?: number;

  @ApiPropertyOptional()
  tokenPrice?: number;

  @ApiPropertyOptional()
  tokenAddress?: string;

  @ApiPropertyOptional()
  spvId?: number;

  @ApiPropertyOptional()
  sponsorEntityId?: number;

  @ApiPropertyOptional()
  seriesId?: number;

  @ApiPropertyOptional()
  custodyMode?: 'self_custody' | 'regenx_custody';

  @ApiPropertyOptional()
  developerWalletAddress?: string;

  @ApiPropertyOptional()
  issuerWalletPublic?: string;

  @ApiPropertyOptional()
  distributorWalletPublic?: string;

  @ApiPropertyOptional()
  proceedsWalletAddress?: string;

  @ApiPropertyOptional()
  assetCode?: string;

  @ApiPropertyOptional()
  assetIssuer?: string;

  @ApiPropertyOptional()
  issuedSupply?: string;

  @ApiPropertyOptional()
  issuanceStatus?: string;

  @ApiPropertyOptional()
  issuanceTxHash?: string;

  @ApiPropertyOptional()
  issuanceFailureReason?: string;

  @ApiPropertyOptional({ type: Object })
  issuanceFailurePayload?: Record<string, unknown>;

  @ApiPropertyOptional()
  issuanceInitiatedBy?: number;

  @ApiPropertyOptional()
  walletConfigLockedAt?: string;

  @ApiPropertyOptional()
  walletConfigLockedReason?: string;

  @ApiPropertyOptional()
  walletLastUpdatedAt?: string;

  @ApiPropertyOptional()
  walletLastUpdatedBy?: number;

  @ApiPropertyOptional()
  tokenSymbol?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: ProjectFileResponseDto })
  thumbnailFile?: ProjectFileResponseDto;

  @ApiPropertyOptional({ type: [ProjectFileResponseDto] })
  projectFiles?: ProjectFileResponseDto[];

  @ApiPropertyOptional()
  ownerAddress?: string;

  @ApiProperty()
  generatesCarbonCredits: boolean;

  @ApiPropertyOptional()
  projectType?: string;

  @ApiPropertyOptional()
  dseType?: string;

  @ApiPropertyOptional()
  stage?: string;

  @ApiPropertyOptional()
  jurisdiction?: string;

  @ApiPropertyOptional()
  minimumInvestment?: string;

  @ApiPropertyOptional()
  totalProjectCapex?: string;

  @ApiPropertyOptional()
  targetIrr?: string;

  @ApiPropertyOptional()
  targetAnnualYield?: string;

  @ApiPropertyOptional()
  investmentTermYears?: string;

  @ApiPropertyOptional()
  investmentSummary?: string;

  @ApiPropertyOptional({ type: Object })
  payloadJson?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  draftPayload?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  workflowStatusJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  completedCount?: number;

  @ApiPropertyOptional()
  totalSections?: number;

  @ApiPropertyOptional()
  adminNotes?: string;

  @ApiPropertyOptional()
  agreementAccepted?: boolean;

  @ApiPropertyOptional()
  agreementAcceptedAt?: string;

  @ApiPropertyOptional()
  agreementVersion?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  submittedAt?: string;

  @ApiPropertyOptional()
  approvedAt?: string;

  @ApiPropertyOptional()
  issuedAt?: string;

  @ApiPropertyOptional()
  liveAt?: string;

  @ApiPropertyOptional()
  rejectedAt?: string;

  @ApiPropertyOptional()
  lockedAt?: string;

  @ApiPropertyOptional()
  lockReason?: string;

  @ApiPropertyOptional()
  lastReviewedAt?: string;

  @ApiProperty({
    description: 'Total capital raised for the project',
    example: 0,
  })
  raisedAmount?: number;

  @ApiProperty({
    description: 'Percentage of funding goal achieved',
    example: 0,
  })
  percentFunded: number;

  @ApiProperty({
    description: 'Remaining token supply available for purchase',
    example: 0,
  })
  remainingSupply: number;

  @ApiPropertyOptional()
  purchasedAmount?: number;
}
