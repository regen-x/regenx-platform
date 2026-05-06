import { Injectable } from '@nestjs/common';
import { Project } from '../../domain/project.domain';
import { ProjectResponseDto } from '../dto/project-response.dto';

type AnyRecord = Record<string, any>;

@Injectable()
export class ProjectMapper {
  private asRecord(value: unknown): AnyRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as AnyRecord;
  }

  private toIso(value?: Date | string | null): string | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private firstDefined<T>(...values: T[]): T | undefined {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return undefined;
  }

  private normalizeStatus(status?: string): string {
    const raw = String(status ?? 'draft').trim().toLowerCase();
    if (raw === 'token_issued') return 'issued';

    const allowed = new Set([
      'draft',
      'under_review',
      'changes_requested',
      'approved',
      'issued',
      'live',
      'locked',
    ]);

    return allowed.has(raw) ? raw : 'draft';
  }

  private resolvePayload(project: AnyRecord): AnyRecord {
    return (
      this.asRecord(project.payloadJson) ||
      this.asRecord(project.payload_json) ||
      this.asRecord(project.draftPayload) ||
      this.asRecord(project.draft_payload)
    );
  }

  private resolveDseType(project: AnyRecord, payload: AnyRecord): string | undefined {
    return this.firstDefined(
      project.dseType,
      payload.dseType,
      payload.tokenStructure?.dseType,
      project.projectType,
      payload.projectType,
    );
  }

  fromProjectToProjectResponseDto(project: Project | AnyRecord): ProjectResponseDto {
    const row = project as AnyRecord;
    const payload = this.resolvePayload(row);
    const fundingGoal = this.toNumber(
      this.firstDefined(
        row.fundingGoal,
        row.totalProjectCapex,
        payload.fundingGoal,
        payload.capitalStructure?.fundingGoal,
        payload.capitalStructure?.totalProjectCapex,
      ),
    );
    const legacyFundedSoFar = this.toNumber(
      this.firstDefined(
        row.fundedSoFar,
        row.amountRaised,
        row.raisedAmount,
        row.raisedSoFar,
        payload.fundedSoFar,
        payload.amountRaised,
        payload.raisedAmount,
        payload.raisedSoFar,
      ),
    );
    const tokenSupply = this.toNumber(
      this.firstDefined(
        row.tokenSupply,
        payload.tokenSupply,
        payload.tokenStructure?.totalTokenSupply,
      ),
    );
    const unitsSold = this.toNumber(
      this.firstDefined(row.unitsSold, row.purchasedAmount),
    );
    const amountSettled = this.toNumber(
      this.firstDefined(row.amountSettled, legacyFundedSoFar),
    );
    const investorCount = this.toNumber(row.investorCount);
    const unitsRemaining = this.toNumber(
      this.firstDefined(row.unitsRemaining, Math.max(tokenSupply - unitsSold, 0)),
    );
    const percentFunded =
      fundingGoal > 0 ? Math.min(100, (amountSettled / fundingGoal) * 100) : 0;

    const projectResponseDto = new ProjectResponseDto();

    projectResponseDto.id = String(row.id ?? row.uuid ?? '');
    projectResponseDto.uuid = row.uuid ? String(row.uuid) : undefined;
    projectResponseDto.createdAt = this.toIso(row.createdAt) ?? '';
    projectResponseDto.updatedAt = this.toIso(row.updatedAt) ?? '';
    projectResponseDto.deletedAt = this.toIso(row.deletedAt);
    projectResponseDto.name = this.firstDefined(row.name, payload.projectName);
    projectResponseDto.description = this.firstDefined(
      row.description,
      row.investmentSummary,
      payload.description,
      payload.investmentSummary,
    );
    projectResponseDto.location = this.firstDefined(
      row.location,
      payload.location,
      payload.siteAddress,
      payload.fullAddress,
    );
    projectResponseDto.status = this.normalizeStatus(row.status);
    projectResponseDto.thumbnailUrl = this.firstDefined(
      row.thumbnailUrl,
      row.thumbnailImageUrl,
      payload.thumbnailUrl,
      payload.thumbnailImageUrl,
    );
    projectResponseDto.thumbnailFile = row.thumbnailFile;
    projectResponseDto.projectFiles = Array.isArray(row.projectFiles)
      ? row.projectFiles
      : undefined;
    projectResponseDto.fundingGoal = fundingGoal;
    projectResponseDto.fundedSoFar = amountSettled;
    projectResponseDto.amountSettled = amountSettled;
    projectResponseDto.investorCount = investorCount;
    projectResponseDto.unitsSold = unitsSold;
    projectResponseDto.unitsRemaining = unitsRemaining;
    projectResponseDto.startDate = this.firstDefined(row.startDate, payload.startDate);
    projectResponseDto.endDate = this.firstDefined(row.endDate, payload.endDate);
    projectResponseDto.climateImpact = this.firstDefined(
      row.climateImpact,
      payload.climateImpact,
    );
    projectResponseDto.tokenSupply = tokenSupply || undefined;
    projectResponseDto.tokenPrice = this.toNumber(
      this.firstDefined(row.tokenPrice, payload.tokenPrice),
    );
    projectResponseDto.tokenAddress = this.firstDefined(
      row.tokenAddress,
      payload.tokenAddress,
    );
    projectResponseDto.spvId = this.toNumber(this.firstDefined(row.spvId, payload.spvId)) || undefined;
    projectResponseDto.sponsorEntityId =
      this.toNumber(this.firstDefined(row.sponsorEntityId, payload.sponsorEntityId)) ||
      undefined;
    projectResponseDto.seriesId = this.toNumber(this.firstDefined(row.seriesId, payload.seriesId)) || undefined;
    projectResponseDto.custodyMode = this.firstDefined(
      row.custodyMode,
      payload.custodyMode,
    );
    projectResponseDto.developerWalletAddress = this.firstDefined(
      row.developerWalletAddress,
      payload.developerWalletAddress,
    );
    projectResponseDto.issuerWalletPublic = this.firstDefined(
      row.issuerWalletPublic,
      payload.issuerWalletPublic,
    );
    projectResponseDto.distributorWalletPublic = this.firstDefined(
      row.distributorWalletPublic,
      payload.distributorWalletPublic,
    );
    projectResponseDto.proceedsWalletAddress = this.firstDefined(
      row.proceedsWalletAddress,
      payload.proceedsWalletAddress,
    );
    projectResponseDto.assetCode = this.firstDefined(
      row.assetCode,
      payload.assetCode,
      row.tokenSymbol,
      payload.tokenSymbol,
    );
    projectResponseDto.assetIssuer = this.firstDefined(
      row.assetIssuer,
      payload.assetIssuer,
      row.issuerWalletPublic,
      payload.issuerWalletPublic,
    );
    projectResponseDto.issuedSupply = this.firstDefined(
      row.issuedSupply,
      payload.issuedSupply,
    );
    projectResponseDto.issuanceStatus = this.firstDefined(
      row.issuanceStatus,
      payload.issuanceStatus,
      'not_started',
    );
    projectResponseDto.issuanceTxHash = this.firstDefined(
      row.issuanceTxHash,
      payload.issuanceTxHash,
    );
    projectResponseDto.issuanceFailureReason = this.firstDefined(
      row.issuanceFailureReason,
      payload.issuanceFailureReason,
    );
    projectResponseDto.issuanceFailurePayload = this.asRecord(
      this.firstDefined(row.issuanceFailurePayload, payload.issuanceFailurePayload),
    );
    projectResponseDto.issuanceInitiatedBy = this.toNumber(
      this.firstDefined(row.issuanceInitiatedBy, payload.issuanceInitiatedBy),
    ) || undefined;
    projectResponseDto.walletConfigLockedAt = this.toIso(row.walletConfigLockedAt);
    projectResponseDto.walletConfigLockedReason = this.firstDefined(
      row.walletConfigLockedReason,
      payload.walletConfigLockedReason,
    );
    projectResponseDto.walletLastUpdatedAt = this.toIso(row.walletLastUpdatedAt);
    projectResponseDto.walletLastUpdatedBy = this.toNumber(
      this.firstDefined(row.walletLastUpdatedBy, payload.walletLastUpdatedBy),
    ) || undefined;
    projectResponseDto.tokenSymbol = this.firstDefined(
      row.tokenSymbol,
      payload.tokenSymbol,
      payload.tokenStructure?.tokenSymbol,
    );
    projectResponseDto.ownerAddress = this.firstDefined(
      row.ownerAddress,
      payload.ownerAddress,
    );
    projectResponseDto.generatesCarbonCredits = Boolean(
      this.firstDefined(row.generatesCarbonCredits, payload.generatesCarbonCredits),
    );
    projectResponseDto.projectType = this.firstDefined(
      row.projectType,
      payload.projectType,
    );
    projectResponseDto.dseType = this.resolveDseType(row, payload);
    projectResponseDto.stage = this.firstDefined(row.stage, payload.stage);
    projectResponseDto.jurisdiction = this.firstDefined(
      row.jurisdiction,
      payload.jurisdiction,
    );
    projectResponseDto.minimumInvestment = String(
      this.firstDefined(
        row.minimumInvestment,
        payload.minimumInvestment,
        payload.capitalStructure?.minimumInvestment,
      ) ?? '',
    );
    projectResponseDto.totalProjectCapex = String(
      this.firstDefined(
        row.totalProjectCapex,
        payload.totalProjectCapex,
        payload.capitalStructure?.totalProjectCapex,
      ) ?? '',
    );
    projectResponseDto.targetIrr = String(
      this.firstDefined(
        row.targetIrr,
        payload.targetIrr,
        payload.investorStructure?.targetIrrExpectation,
      ) ?? '',
    );
    projectResponseDto.targetAnnualYield = String(
      this.firstDefined(
        row.targetAnnualYield,
        payload.targetAnnualYield,
        payload.investorStructure?.targetAnnualYieldExpectation,
      ) ?? '',
    );
    projectResponseDto.investmentTermYears = String(
      this.firstDefined(
        row.investmentTermYears,
        payload.investmentTermYears,
        payload.investorStructure?.maximumTermYears,
      ) ?? '',
    );
    projectResponseDto.investmentSummary = this.firstDefined(
      row.investmentSummary,
      payload.investmentSummary,
    );
    projectResponseDto.payloadJson = this.asRecord(row.payloadJson);
    projectResponseDto.draftPayload = this.asRecord(row.draftPayload);
    projectResponseDto.workflowStatusJson = this.asRecord(row.workflowStatusJson);
    projectResponseDto.completedCount = this.toNumber(row.completedCount);
    projectResponseDto.totalSections = this.toNumber(row.totalSections);
    projectResponseDto.adminNotes = row.adminNotes;
    projectResponseDto.agreementAccepted = Boolean(row.agreementAccepted);
    projectResponseDto.agreementAcceptedAt = this.toIso(row.agreementAcceptedAt);
    projectResponseDto.agreementVersion = row.agreementVersion;
    projectResponseDto.submittedAt = this.toIso(row.submittedAt);
    projectResponseDto.approvedAt = this.toIso(row.approvedAt);
    projectResponseDto.issuedAt = this.toIso(row.issuedAt);
    projectResponseDto.liveAt = this.toIso(row.liveAt);
    projectResponseDto.rejectedAt = this.toIso(row.rejectedAt);
    projectResponseDto.lockedAt = this.toIso(row.lockedAt);
    projectResponseDto.lockReason = row.lockReason;
    projectResponseDto.lastReviewedAt = this.toIso(row.lastReviewedAt);
    projectResponseDto.purchasedAmount = unitsSold;
    projectResponseDto.raisedAmount = amountSettled;
    projectResponseDto.percentFunded = percentFunded;
    projectResponseDto.remainingSupply = unitsRemaining;

    return projectResponseDto;
  }
}
