import { Base } from '../../../common/domain/base.domain';
import { User } from '../../iam/user/domain/user.domain';
import { Offer } from '../../offer/domain/offer.domain';

export type ProjectFile = {
  id: string;
  category: string;
  purpose: string;
  documentKey?: string | null;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize?: number | null;
  uploadedBy?: number | null;
  uploadedAt: string;
  url?: string;
};

export class Project extends Base {
  name?: string;
  description?: string;
  location?: string;
  fundingGoal?: number;
  amountRaised?: string;
  amountSettled?: number;
  investorCount?: number;
  unitsSold?: number;
  unitsRemaining?: number;
  startDate?: string;
  endDate?: string;
  climateImpact?: string;
  tokenSymbol?: string;
  tokenSupply?: number;
  tokenPrice?: number;
  tokenAddress?: string;
  spvId?: number;
  seriesId?: number;
  issuerWalletPublic?: string;
  distributorWalletPublic?: string;
  assetCode?: string;
  assetIssuer?: string;
  issuedSupply?: string;
  issuanceStatus?: string;
  issuanceTxHash?: string;
  issuanceInitiatedBy?: number;
  thumbnailUrl?: string;
  thumbnailFile?: ProjectFile;
  projectFiles?: ProjectFile[];
  generatesCarbonCredits: boolean;
  ownerAddress?: string;

  projectType?: string;
  dseType?: string;
  stage?: string;
  jurisdiction?: string;
  minimumInvestment?: string;
  totalProjectCapex?: string;
  targetIrr?: string;
  targetAnnualYield?: string;
  investmentTermYears?: string;
  investmentSummary?: string;

  payloadJson?: Record<string, unknown>;
  draftPayload?: Record<string, unknown>;
  workflowStatusJson?: Record<string, unknown>;
  completedCount?: number;
  totalSections?: number;
  adminNotes?: string;
  agreementAccepted?: boolean;
  agreementAcceptedAt?: Date;
  agreementVersion?: string;

  status?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  issuedAt?: Date;
  liveAt?: Date;
  rejectedAt?: Date;
  lockedAt?: Date;
  lockReason?: string;
  lastReviewedAt?: Date;

  user: User;
  purchasedAmount?: number;
  offers: Offer[];

  constructor(
    uuid?: string,
    id?: number,
    createdAt?: string,
    updatedAt?: string,
    deletedAt?: string,
    name?: string,
    description?: string,
    location?: string,
    fundingGoal?: number,
    amountRaised?: string,
    amountSettled?: number,
    investorCount?: number,
    unitsSold?: number,
    unitsRemaining?: number,
    startDate?: string,
    endDate?: string,
    climateImpact?: string,
    tokenSymbol?: string,
    tokenSupply?: number,
    tokenPrice?: number,
    tokenAddress?: string,
    spvId?: number,
    seriesId?: number,
    issuerWalletPublic?: string,
    distributorWalletPublic?: string,
    assetCode?: string,
    assetIssuer?: string,
    issuedSupply?: string,
    issuanceStatus?: string,
    issuanceTxHash?: string,
    issuanceInitiatedBy?: number,
    thumbnailUrl?: string,
    thumbnailFile?: ProjectFile,
    projectFiles?: ProjectFile[],
    generatesCarbonCredits: boolean = false,
    user?: User,
    ownerAddress?: string,
    offers?: Offer[],
    projectType?: string,
    dseType?: string,
    stage?: string,
    jurisdiction?: string,
    minimumInvestment?: string,
    totalProjectCapex?: string,
    targetIrr?: string,
    targetAnnualYield?: string,
    investmentTermYears?: string,
    investmentSummary?: string,
    payloadJson?: Record<string, unknown>,
    draftPayload?: Record<string, unknown>,
    workflowStatusJson?: Record<string, unknown>,
    completedCount?: number,
    totalSections?: number,
    adminNotes?: string,
    agreementAccepted?: boolean,
    agreementAcceptedAt?: Date,
    agreementVersion?: string,
    status?: string,
    submittedAt?: Date,
    approvedAt?: Date,
    issuedAt?: Date,
    liveAt?: Date,
    rejectedAt?: Date,
    lockedAt?: Date,
    lockReason?: string,
    lastReviewedAt?: Date,
  ) {
    super(id, uuid, createdAt, updatedAt, deletedAt);
    this.name = name;
    this.description = description;
    this.location = location;
    this.fundingGoal = fundingGoal;
    this.amountRaised = amountRaised;
    this.amountSettled = amountSettled;
    this.investorCount = investorCount;
    this.unitsSold = unitsSold;
    this.unitsRemaining = unitsRemaining;
    this.startDate = startDate;
    this.endDate = endDate;
    this.climateImpact = climateImpact;
    this.tokenSymbol = tokenSymbol;
    this.tokenSupply = tokenSupply;
    this.tokenPrice = tokenPrice;
    this.tokenAddress = tokenAddress;
    this.spvId = spvId;
    this.seriesId = seriesId;
    this.issuerWalletPublic = issuerWalletPublic;
    this.distributorWalletPublic = distributorWalletPublic;
    this.assetCode = assetCode;
    this.assetIssuer = assetIssuer;
    this.issuedSupply = issuedSupply;
    this.issuanceStatus = issuanceStatus;
    this.issuanceTxHash = issuanceTxHash;
    this.issuanceInitiatedBy = issuanceInitiatedBy;
    this.thumbnailUrl = thumbnailUrl;
    this.thumbnailFile = thumbnailFile;
    this.projectFiles = projectFiles ?? [];
    this.generatesCarbonCredits = generatesCarbonCredits;
    this.user = user;
    this.ownerAddress = ownerAddress;
    this.offers = offers ?? [];
    this.projectType = projectType;
    this.dseType = dseType;
    this.stage = stage;
    this.jurisdiction = jurisdiction;
    this.minimumInvestment = minimumInvestment;
    this.totalProjectCapex = totalProjectCapex;
    this.targetIrr = targetIrr;
    this.targetAnnualYield = targetAnnualYield;
    this.investmentTermYears = investmentTermYears;
    this.investmentSummary = investmentSummary;
    this.payloadJson = payloadJson ?? {};
    this.draftPayload = draftPayload ?? {};
    this.workflowStatusJson = workflowStatusJson ?? {};
    this.completedCount = completedCount ?? 0;
    this.totalSections = totalSections ?? 0;
    this.adminNotes = adminNotes;
    this.agreementAccepted = agreementAccepted ?? false;
    this.agreementAcceptedAt = agreementAcceptedAt;
    this.agreementVersion = agreementVersion;
    this.status = status ?? 'draft';
    this.submittedAt = submittedAt;
    this.approvedAt = approvedAt;
    this.issuedAt = issuedAt;
    this.liveAt = liveAt;
    this.rejectedAt = rejectedAt;
    this.lockedAt = lockedAt;
    this.lockReason = lockReason;
    this.lastReviewedAt = lastReviewedAt;
  }
}
