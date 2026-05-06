import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StrKey } from '@stellar/stellar-sdk';
import { In, IsNull, Repository } from 'typeorm';

import { S3StorageService } from '../../../../common/infrastructure/storage/s3.storage.service';
import { ProjectEntity } from '../../infrastructure/persistence/entities/project.entity';
import {
  ProjectFileCategory,
  ProjectFileEntity,
  ProjectFilePurpose,
} from '../../infrastructure/persistence/entities/project-file.entity';
import { ProjectVersionEntity } from '../../infrastructure/persistence/entities/project-version.entity';
import { DeveloperProfileEntity } from '../../../developer-profile/infrastructure/persistence/entities/developer-profile.entity';
import { AssetService } from '../../../asset/application/service/asset.service';
import { SpvService } from '../../../spv/application/spv.service';
import { SpvEntity } from '../../../spv/infrastructure/persistence/entities/spv.entity';
import { ProjectMapper } from '../mapper/project.mapper';
import { RequestProjectWalletChangeDto } from '../dto/request-project-wallet-change.dto';
import { UpdateProjectEntitySpvLinkageDto } from '../dto/update-project-entity-spv-linkage.dto';
import { UpdateProjectWalletConfigDto } from '../dto/update-project-wallet-config.dto';
import { OwnershipEntity } from '../../../ownership/infrastructure/persistence/entities/ownership.entity';
import { OwnershipTransactionEntity } from '../../../ownership/infrastructure/persistence/entities/ownership-transaction.entity';
import { NotificationService } from '../../../notification/application/service/notification.service';
import { NotificationType } from '../../../notification/infrastructure/persistence/entities/notification.entity';
import { TransactionEntity } from '../../../transaction/infrastructure/persistence/entities/transaction.entity';
import { UserEntity } from '../../../iam/user/infrastructure/persistence/entities/user.entity';
import { ProjectWalletAuditEntity } from '../../infrastructure/persistence/entities/project-wallet-audit.entity';
import { LegalEntityEntity } from '../../../legal-entity/infrastructure/persistence/entities/legal-entity.entity';
import { AuditLogEntity } from '../../infrastructure/persistence/entities/audit-log.entity';
import {
  CustodyChangeRequestEntity,
  CustodyChangeRequestStatus,
  CustodyParticipantType,
} from '../../infrastructure/persistence/entities/custody-change-request.entity';

type ProjectReviewStatus =
  | 'draft'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'issued'
  | 'live'
  | 'locked';

type IssuanceExecutionStatus = 'not_started' | 'pending' | 'completed' | 'failed';

type IssuanceFailureDetails = {
  reason: string;
  payload: Record<string, unknown>;
};

type WalletFieldName =
  | 'custodyMode'
  | 'developerWalletAddress'
  | 'issuerWalletAddress'
  | 'distributionWalletAddress'
  | 'proceedsWalletAddress';

type WalletChangeType = 'pre_issuance_edit' | 'post_issuance_change_request';
type CustodyMode = 'self_custody' | 'regenx_custody';
type CustodySetupStatus =
  | 'not_started'
  | 'incomplete'
  | 'pending_review'
  | 'complete'
  | 'reviewed'
  | 'blocked';
type CustodyReadinessStatus = 'ready' | 'warning' | 'blocked';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(ProjectFileEntity)
    private readonly projectFileRepo: Repository<ProjectFileEntity>,

    @InjectRepository(ProjectVersionEntity)
    private readonly versionRepo: Repository<ProjectVersionEntity>,

    @InjectRepository(DeveloperProfileEntity)
    private readonly developerProfileRepo: Repository<DeveloperProfileEntity>,

    @InjectRepository(OwnershipEntity)
    private readonly ownershipRepo: Repository<OwnershipEntity>,

    @InjectRepository(OwnershipTransactionEntity)
    private readonly ownershipTxRepo: Repository<OwnershipTransactionEntity>,

    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(SpvEntity)
    private readonly spvRepo: Repository<SpvEntity>,

    @InjectRepository(LegalEntityEntity)
    private readonly legalEntityRepo: Repository<LegalEntityEntity>,

    @InjectRepository(ProjectWalletAuditEntity)
    private readonly projectWalletAuditRepo: Repository<ProjectWalletAuditEntity>,

    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,

    @InjectRepository(CustodyChangeRequestEntity)
    private readonly custodyChangeRequestRepo: Repository<CustodyChangeRequestEntity>,

    private readonly s3StorageService: S3StorageService,
    private readonly assetService: AssetService,
    private readonly spvService: SpvService,
    private readonly projectMapper: ProjectMapper,
    private readonly notificationService: NotificationService,
  ) {}

  private asRecord(value: unknown): Record<string, any> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, any>;
  }

  private hasMeaningfulPayload(value: unknown): value is Record<string, any> {
    const record = this.asRecord(value);
    if (!record) return false;

    return Object.values(record).some((entry) => {
      if (entry == null) return false;
      if (typeof entry === 'string') return entry.trim() !== '';
      if (typeof entry === 'number') return !Number.isNaN(entry);
      if (typeof entry === 'boolean') return true;
      if (Array.isArray(entry)) return entry.length > 0;
      if (typeof entry === 'object') return Object.keys(entry).length > 0;
      return false;
    });
  }

  private buildTopLevelDraftFallback(source: Record<string, any>): Record<string, any> {
    const {
      payloadJson,
      payload_json,
      draftPayload,
      draft_payload,
      payload: nestedPayload,
      workflowStatus,
      workflowStatusJson,
      workflow_status_json,
      completedCount,
      totalSections,
      status,
      id,
      createdAt,
      updatedAt,
      deletedAt,
      lastSavedAt,
      submittedAt,
      approvedAt,
      rejectedAt,
      lockedAt,
      ...rest
    } = source;

    return rest;
  }

  private resolveCanonicalDraftPayload(payload: any): Record<string, any> {
    const record = this.asRecord(payload) ?? {};
    const candidates = [
      record.draftPayload,
      record.draft_payload,
      record.payloadJson,
      record.payload_json,
      record.payload,
      this.buildTopLevelDraftFallback(record),
    ];

    for (const candidate of candidates) {
      if (this.hasMeaningfulPayload(candidate)) {
        return candidate as Record<string, any>;
      }
    }

    return {};
  }

  private resolveWorkflowStatus(payload: any): Record<string, any> {
    const record = this.asRecord(payload) ?? {};

    return (
      this.asRecord(record.workflowStatusJson) ??
      this.asRecord(record.workflow_status_json) ??
      this.asRecord(record.workflowStatus) ??
      {}
    );
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private maskInvestorName(fullname?: string | null, uuid?: string | null) {
    const cleanName = String(fullname ?? '').trim();
    if (cleanName) {
      const parts = cleanName.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        return `${parts[0]} ••••`;
      }

      return `${parts[0]} ${parts[1].slice(0, 1)}.`;
    }

    const fallback = String(uuid ?? '').trim();
    return fallback ? `Investor ${fallback.slice(0, 6)}` : 'Investor';
  }

  private async findProjectOrThrow(id: string) {
    const numericId = Number(id);
    const project = Number.isFinite(numericId) && numericId > 0
      ? await this.projectRepo.findOne({
          where: { id: numericId },
          relations: ['user'],
        })
      : await this.projectRepo.findOne({
          where: { uuid: id },
          relations: ['user'],
        });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private getProjectFileCategory(purpose: ProjectFilePurpose): ProjectFileCategory {
    if (purpose === 'PROJECT_DOCUMENT') return 'PROJECT_DOCUMENT';
    if (purpose === 'VERIFICATION_DOCUMENT') return 'VERIFICATION_DOCUMENT';
    return 'PROJECT_MEDIA';
  }

  private validateProjectFileUpload(params: {
    purpose: ProjectFilePurpose;
    mimeType: string;
    documentKey?: string | null;
  }) {
    const allowedPurposes: ProjectFilePurpose[] = [
      'PROJECT_THUMBNAIL',
      'PROJECT_SUPPORTING_IMAGE',
      'PROJECT_DOCUMENT',
      'VERIFICATION_DOCUMENT',
    ];

    if (!allowedPurposes.includes(params.purpose)) {
      throw new BadRequestException('Invalid project file purpose');
    }

    const mimeType = String(params.mimeType ?? '').toLowerCase();
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    if (params.purpose === 'PROJECT_THUMBNAIL' || params.purpose === 'PROJECT_SUPPORTING_IMAGE') {
      if (!isImage) {
        throw new BadRequestException('Only image files are allowed for project media uploads');
      }
    }

    if (params.purpose === 'PROJECT_DOCUMENT' || params.purpose === 'VERIFICATION_DOCUMENT') {
      if (!isPdf) {
        throw new BadRequestException('Only PDF files are allowed for project document uploads');
      }
    }

    if (params.purpose === 'PROJECT_DOCUMENT' && !String(params.documentKey ?? '').trim()) {
      throw new BadRequestException('documentKey is required for project document uploads');
    }
  }

  private async markExistingProjectFilesReplaced(params: {
    projectId: number;
    purpose: ProjectFilePurpose;
    documentKey?: string | null;
  }) {
    const where: any = {
      projectId: params.projectId,
      purpose: params.purpose,
      deletedAt: IsNull(),
    };

    if (params.purpose === 'PROJECT_DOCUMENT') {
      where.documentKey = params.documentKey ?? null;
    }

    const existing = await this.projectFileRepo.find({ where });

    if (existing.length === 0) return;

    const deletedAt = new Date().toISOString();
    for (const file of existing) {
      file.deletedAt = deletedAt as any;
    }
    await this.projectFileRepo.save(existing);
  }

  private async mapProjectFile(file: ProjectFileEntity) {
    return {
      id: String(file.id),
      category: file.category,
      purpose: file.purpose,
      documentKey: file.documentKey ?? null,
      storageKey: file.storageKey,
      originalFilename: file.originalFilename,
      mimeType: file.mimeType,
      fileSize: file.fileSize ?? null,
      uploadedBy: file.uploadedBy ?? null,
      uploadedAt: new Date(file.createdAt).toISOString(),
      url: await this.s3StorageService.getSignedDownloadUrl(file.storageKey),
    };
  }

  private async attachProjectAssets(projects: Record<string, any>[]) {
    if (projects.length === 0) return [];

    const ids = projects
      .map((project) => Number(project.id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (ids.length === 0) return projects;

    const files = await this.projectFileRepo.find({
      where: {
        projectId: In(ids),
        deletedAt: IsNull(),
      } as any,
      order: {
        createdAt: 'DESC' as any,
      },
    });

    const mappedFiles = await Promise.all(
      files.map(async (file) => ({
        projectId: Number(file.projectId),
        file: await this.mapProjectFile(file),
      })),
    );

    const filesByProjectId = new Map<number, any[]>();

    for (const item of mappedFiles) {
      const existing = filesByProjectId.get(item.projectId) ?? [];
      existing.push(item.file);
      filesByProjectId.set(item.projectId, existing);
    }

    return projects.map((project) => {
      const projectFiles = filesByProjectId.get(Number(project.id)) ?? [];
      const thumbnailFile =
        projectFiles.find((file) => file.purpose === 'PROJECT_THUMBNAIL') ?? null;
      const payloadJson = this.asRecord(project.payloadJson) ?? {};
      const draftPayload = this.asRecord(project.draftPayload) ?? {};
      const mergeDocuments = (source: Record<string, any>) => {
        const existingDocs = this.asRecord(source.documents) ?? {};

        for (const file of projectFiles) {
          if (file.purpose === 'PROJECT_DOCUMENT' && file.documentKey) {
            existingDocs[file.documentKey] = {
              ...(this.asRecord(existingDocs[file.documentKey]) ?? {}),
              url: file.url,
              fileId: file.id,
              fileName: file.originalFilename,
              mimeType: file.mimeType,
              storageKey: file.storageKey,
              uploadedAt: file.uploadedAt,
            };
          }
        }

        return {
          ...source,
          thumbnailImageUrl: thumbnailFile?.url ?? source.thumbnailImageUrl ?? source.thumbnailUrl ?? '',
          thumbnailUrl: thumbnailFile?.url ?? source.thumbnailUrl ?? source.thumbnailImageUrl ?? '',
          thumbnailFile:
            thumbnailFile ??
            source.thumbnailFile ??
            null,
          documents: existingDocs,
        };
      };

      return {
        ...project,
        thumbnailUrl: thumbnailFile?.url ?? project.thumbnailUrl,
        thumbnailFile,
        projectFiles,
        payloadJson: mergeDocuments(payloadJson),
        draftPayload: mergeDocuments(draftPayload),
      };
    });
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeOptionalText(value?: string | null) {
    const normalized = String(value ?? '').trim();
    return normalized || null;
  }

  private normalizeOptionalDate(value: unknown, fallback?: string | null) {
    if (value === undefined) return fallback ?? null;
    if (value === null) return null;

    const normalized = String(value).trim();
    return normalized || null;
  }

  private normalizeWalletAddress(value?: string | null) {
    const normalized = String(value ?? '').trim().toUpperCase();
    return normalized || null;
  }

  private normalizeOptionalId(value?: number | null) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private isValidStellarPublicKey(value?: string | null) {
    return Boolean(value) && StrKey.isValidEd25519PublicKey(String(value));
  }

  private isWalletConfigLocked(project: ProjectEntity) {
    return Boolean(
      project.walletConfigLockedAt ||
        project.issuedAt ||
        this.normalizeOptionalText(project.issuanceTxHash),
    );
  }

  private resolveProjectCustodyMode(
    project: ProjectEntity,
    profile?: DeveloperProfileEntity | null,
  ) {
    return (project.custodyMode ?? profile?.custodyMode ?? 'self_custody') as
      | 'self_custody'
      | 'regenx_custody';
  }

  private async writeAdminAuditLog(params: {
    actorUserId?: number | null;
    action: string;
    entityId: number;
    detailsJson?: Record<string, unknown> | null;
  }) {
    const row = this.auditLogRepo.create({
      actor: params.actorUserId ? ({ id: params.actorUserId } as any) : null,
      actorRole: 'admin',
      entityType: 'Project',
      entityId: params.entityId,
      action: params.action,
      detailsJson: params.detailsJson ?? null,
    } as any);

    await this.auditLogRepo.save(row);
  }

  private getCustodyModeLabel(value?: CustodyMode | null) {
    if (value === 'regenx_custody') return 'RegenX custody';
    if (value === 'self_custody') return 'Self custody';
    return 'Not set';
  }

  private getWalletStatusLabel(params: {
    custodyMode?: CustodyMode | null;
    walletAddress?: string | null;
    walletValid?: boolean;
  }) {
    if (params.custodyMode === 'regenx_custody' && !params.walletAddress) {
      return 'managed';
    }

    if (!params.walletAddress) {
      return 'missing';
    }

    return params.walletValid ? 'verified' : 'invalid';
  }

  private buildProjectCustodyRequestedChangeStatus(
    request?: CustodyChangeRequestEntity | null,
  ): CustodyChangeRequestStatus | 'none' {
    return request?.status ?? 'none';
  }

  private buildProjectCustodyReadiness(params: {
    project: ProjectEntity;
    profile?: DeveloperProfileEntity | null;
    spv?: SpvEntity | null;
    legalEntity?: LegalEntityEntity | null;
    pendingRequest?: CustodyChangeRequestEntity | null;
  }) {
    const { project, profile, spv, legalEntity, pendingRequest } = params;
    const walletReadiness = this.buildWalletReadiness({
      project,
      profile,
      spv,
      legalEntity,
    });
    const custodyMode = this.resolveProjectCustodyMode(project, profile);
    const blockingReasons = walletReadiness.issues.map((issue) => issue.message);
    const warnings: string[] = [];

    if (pendingRequest?.status === 'pending') {
      blockingReasons.push('A custody change request is pending review.');
    }

    if (pendingRequest?.status === 'more_info_required') {
      blockingReasons.push(
        'Custody change review is waiting for more information before issuance can proceed.',
      );
    }

    if (project.issuanceBlockedByCustody) {
      blockingReasons.push(
        this.normalizeOptionalText(project.custodyBlockReason) ??
          'Issuance is manually blocked by custody review.',
      );
    }

    if (custodyMode === 'regenx_custody' && !walletReadiness.wallets.distributionWalletAddress?.value) {
      blockingReasons.push(
        'RegenX custody requires a configured RegenX-managed distribution wallet before issuance.',
      );
    }

    if (
      custodyMode === 'self_custody' &&
      !walletReadiness.wallets.developerWalletAddress?.value
    ) {
      blockingReasons.push(
        'Self custody requires a participant-controlled developer wallet before issuance.',
      );
    }

    if (
      custodyMode === 'regenx_custody' &&
      walletReadiness.wallets.developerWalletAddress?.value
    ) {
      warnings.push(
        'A developer wallet is present while the project is configured for RegenX custody. Confirm this is intentional.',
      );
    }

    const dedupedBlockingReasons = Array.from(new Set(blockingReasons));
    const dedupedWarnings = Array.from(new Set(warnings));
    let setupStatus: CustodySetupStatus = 'not_started';

    if (project.issuanceBlockedByCustody) {
      setupStatus = 'blocked';
    } else if (pendingRequest?.status === 'pending' || pendingRequest?.status === 'more_info_required') {
      setupStatus = 'pending_review';
    } else if (dedupedBlockingReasons.length > 0) {
      setupStatus = 'incomplete';
    } else if (project.custodyReviewedAt) {
      setupStatus = 'reviewed';
    } else {
      setupStatus = 'complete';
    }

    const readinessStatus: CustodyReadinessStatus =
      dedupedBlockingReasons.length > 0
        ? 'blocked'
        : dedupedWarnings.length > 0
          ? 'warning'
          : 'ready';

    return {
      custodyMode,
      setupStatus,
      readinessStatus,
      blockingReasons: dedupedBlockingReasons,
      warnings: dedupedWarnings,
      requestedChangeStatus: this.buildProjectCustodyRequestedChangeStatus(
        pendingRequest,
      ),
      walletStatus: this.getWalletStatusLabel({
        custodyMode,
        walletAddress: walletReadiness.wallets.developerWalletAddress?.value,
        walletValid: walletReadiness.wallets.developerWalletAddress?.valid,
      }),
      walletVerificationState: walletReadiness.status,
      issuanceBlockedByCustody: Boolean(project.issuanceBlockedByCustody),
      issuanceBlockReason: project.custodyBlockReason ?? null,
      reviewedAt: project.custodyReviewedAt
        ? new Date(project.custodyReviewedAt).toISOString()
        : null,
      reviewedBy: project.custodyReviewedBy ?? null,
      walletReadiness,
    };
  }

  private getProjectWalletValues(
    project: ProjectEntity,
    profile?: DeveloperProfileEntity | null,
  ): Record<WalletFieldName, string | null> {
    return {
      custodyMode: this.resolveProjectCustodyMode(project, profile),
      developerWalletAddress: this.normalizeWalletAddress(
        project.developerWalletAddress ?? profile?.primaryWalletAddress ?? null,
      ),
      issuerWalletAddress: this.normalizeWalletAddress(project.issuerWalletPublic),
      distributionWalletAddress: this.normalizeWalletAddress(project.distributorWalletPublic),
      proceedsWalletAddress: this.normalizeWalletAddress(project.proceedsWalletAddress),
    };
  }

  private async getProjectWalletContext(project: ProjectEntity) {
    const [profile, spv, lastUpdatedBy, legalEntity] = await Promise.all([
      project.user?.id
        ? this.developerProfileRepo.findOne({
            where: { user: { id: Number(project.user.id) } } as any,
            relations: ['user'],
          })
        : Promise.resolve(null),
      project.spvId
        ? this.spvRepo.findOne({
            where: { id: Number(project.spvId) },
          })
        : Promise.resolve(null),
      project.walletLastUpdatedBy
        ? this.userRepo.findOne({ where: { id: Number(project.walletLastUpdatedBy) } })
        : Promise.resolve(null),
      project.sponsorEntityId
        ? this.legalEntityRepo.findOne({
            where: { id: Number(project.sponsorEntityId) },
          })
        : Promise.resolve(null),
    ]);

    return { profile, spv, lastUpdatedBy, legalEntity };
  }

  private buildWalletReadiness(params: {
    project: ProjectEntity;
    profile?: DeveloperProfileEntity | null;
    spv?: SpvEntity | null;
    legalEntity?: LegalEntityEntity | null;
  }) {
    const { project, profile, spv, legalEntity } = params;
    const values = this.getProjectWalletValues(project, profile);
    const issues: Array<{
      field: string;
      message: string;
      code: string;
    }> = [];
    const locked = this.isWalletConfigLocked(project);
    const linkedLegalEntity =
      this.normalizeOptionalText(legalEntity?.entityName) ??
      this.normalizeOptionalText(profile?.legalEntityName) ??
      this.normalizeOptionalText(profile?.businessName);

    const pushMissing = (field: string, message: string) => {
      issues.push({ field, message, code: 'missing' });
    };

    const pushInvalid = (field: string, message: string) => {
      issues.push({ field, message, code: 'invalid' });
    };

    const validatedWallets = [
      ['developerWalletAddress', values.developerWalletAddress],
      ['issuerWalletAddress', values.issuerWalletAddress],
      ['distributionWalletAddress', values.distributionWalletAddress],
      ['proceedsWalletAddress', values.proceedsWalletAddress],
    ] as const;

    for (const [field, value] of validatedWallets) {
      if (value && !this.isValidStellarPublicKey(value)) {
        pushInvalid(field, `${field} is not a valid Stellar public key.`);
      }
    }

    if (values.custodyMode === 'self_custody' && !values.developerWalletAddress) {
      pushMissing(
        'developerWalletAddress',
        'Developer wallet is required when custody mode is self custody.',
      );
    }

    if (!values.distributionWalletAddress) {
      pushMissing(
        'distributionWalletAddress',
        'Distribution wallet is required before issuance can run.',
      );
    }

    if (!this.normalizeOptionalText(project.tokenSymbol)) {
      pushMissing('tokenSymbol', 'Token symbol is required before issuance can run.');
    }

    if (this.toNumber(project.tokenSupply) <= 0) {
      pushMissing('tokenSupply', 'Token supply must be greater than zero before issuance can run.');
    }

    if (!project.sponsorEntityId || !legalEntity) {
      pushMissing('linkedLegalEntity', 'Linked legal entity is required before issuance can run.');
    }

    if (!project.spvId) {
      pushMissing('linkedSpv', 'Linked SPV is required before issuance can run.');
    }

    if (project.spvId && !spv) {
      pushInvalid('linkedSpv', 'Linked SPV could not be found.');
    }

    if (
      spv?.sponsorEntityId &&
      legalEntity?.id &&
      Number(spv.sponsorEntityId) !== Number(legalEntity.id)
    ) {
      pushInvalid(
        'linkedSpv',
        'Linked SPV sponsor entity does not match the project sponsor entity.',
      );
    }

    if (
      values.custodyMode === 'regenx_custody' &&
      spv?.custodyModel &&
      spv.custodyModel !== 'regenx_custody'
    ) {
      pushInvalid(
        'custodyMode',
        'Project custody mode does not align with the linked SPV custody model.',
      );
    }

    if (
      spv?.legalEntityName &&
      linkedLegalEntity &&
      spv.legalEntityName.trim().toLowerCase() !== linkedLegalEntity.trim().toLowerCase()
    ) {
      pushInvalid(
        'linkedSpv',
        'Linked SPV legal entity does not match the developer legal entity on file.',
      );
    }

    const status = issues.length === 0 ? 'ready' : issues.some((issue) => issue.code === 'invalid') ? 'invalid' : 'missing';

    return {
      isReady: issues.length === 0,
      status: locked && issues.length === 0 ? 'locked' : status,
      issues,
      locked,
      lockedFields: locked
        ? ['developerWalletAddress', 'issuerWalletAddress', 'distributionWalletAddress', 'proceedsWalletAddress']
        : [],
      linkedLegalEntity,
      linkedSpv: spv
        ? {
            id: spv.id,
            name: spv.name,
            legalEntityName: spv.legalEntityName ?? null,
            status: spv.status ?? 'draft',
            sponsorEntityId: spv.sponsorEntityId ?? null,
          }
        : project.spvId || project.spvName
          ? {
              id: project.spvId ?? null,
              name: project.spvName ?? null,
              legalEntityName: null,
            }
          : null,
      wallets: {
        developerWalletAddress: {
          value: values.developerWalletAddress,
          required: values.custodyMode === 'self_custody',
          valid:
            !values.developerWalletAddress ||
            this.isValidStellarPublicKey(values.developerWalletAddress),
        },
        issuerWalletAddress: {
          value: values.issuerWalletAddress,
          required: false,
          valid:
            !values.issuerWalletAddress ||
            this.isValidStellarPublicKey(values.issuerWalletAddress),
        },
        distributionWalletAddress: {
          value: values.distributionWalletAddress,
          required: true,
          valid:
            !values.distributionWalletAddress ||
            this.isValidStellarPublicKey(values.distributionWalletAddress),
        },
        proceedsWalletAddress: {
          value: values.proceedsWalletAddress,
          required: false,
          valid:
            !values.proceedsWalletAddress ||
            this.isValidStellarPublicKey(values.proceedsWalletAddress),
        },
      },
    };
  }

  private buildProjectWalletConfigResponse(params: {
    project: ProjectEntity;
    profile?: DeveloperProfileEntity | null;
    spv?: SpvEntity | null;
    lastUpdatedBy?: UserEntity | null;
    legalEntity?: LegalEntityEntity | null;
    pendingRequest?: CustodyChangeRequestEntity | null;
  }) {
    const { project, profile, spv, lastUpdatedBy, legalEntity, pendingRequest } = params;
    const readiness = this.buildWalletReadiness({ project, profile, spv, legalEntity });
    const values = this.getProjectWalletValues(project, profile);
    const custodyReadiness = this.buildProjectCustodyReadiness({
      project,
      profile,
      spv,
      legalEntity,
      pendingRequest,
    });

    return {
      projectId: Number(project.id),
      custodyMode: values.custodyMode,
      developerWalletAddress: values.developerWalletAddress,
      issuerWalletAddress: values.issuerWalletAddress,
      distributionWalletAddress: values.distributionWalletAddress,
      proceedsWalletAddress: values.proceedsWalletAddress,
      linkedLegalEntity: readiness.linkedLegalEntity ?? null,
      linkedLegalEntityId: legalEntity?.id ?? project.sponsorEntityId ?? null,
      linkedSpv: readiness.linkedSpv,
      readiness,
      custodyReadiness,
      custodySetupStatus: project.custodySetupStatus ?? custodyReadiness.setupStatus,
      custodyReviewedAt: project.custodyReviewedAt
        ? new Date(project.custodyReviewedAt).toISOString()
        : null,
      custodyReviewedBy: project.custodyReviewedBy ?? null,
      custodyBlockReason: project.custodyBlockReason ?? null,
      issuanceBlockedByCustody: Boolean(project.issuanceBlockedByCustody),
      requestedChangeStatus: custodyReadiness.requestedChangeStatus,
      issuanceStatus: project.issuanceStatus ?? 'not_started',
      issuanceTxHash: project.issuanceTxHash ?? null,
      issuedAt: project.issuedAt ? new Date(project.issuedAt).toISOString() : null,
      walletConfigLockedAt: project.walletConfigLockedAt
        ? new Date(project.walletConfigLockedAt).toISOString()
        : null,
      walletConfigLockedReason: project.walletConfigLockedReason ?? null,
      walletLastUpdatedAt: project.walletLastUpdatedAt
        ? new Date(project.walletLastUpdatedAt).toISOString()
        : null,
      walletLastUpdatedBy: project.walletLastUpdatedBy ?? null,
      walletLastUpdatedByName:
        this.normalizeOptionalText((lastUpdatedBy as any)?.fullname) ??
        this.normalizeOptionalText((lastUpdatedBy as any)?.email) ??
        null,
    };
  }

  private getWalletFieldLabel(field: WalletFieldName) {
    switch (field) {
      case 'custodyMode':
        return 'custody mode';
      case 'developerWalletAddress':
        return 'developer wallet';
      case 'issuerWalletAddress':
        return 'issuer wallet';
      case 'distributionWalletAddress':
        return 'distribution wallet';
      case 'proceedsWalletAddress':
        return 'proceeds wallet';
      default:
        return field;
    }
  }

  private resolveWalletFieldChanges(
    project: ProjectEntity,
    payload: Partial<UpdateProjectWalletConfigDto>,
    profile?: DeveloperProfileEntity | null,
  ) {
    const currentValues = this.getProjectWalletValues(project, profile);
    const nextValues = { ...currentValues };
    const changes: Array<{
      fieldName: WalletFieldName;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    if (payload.custodyMode && payload.custodyMode !== currentValues.custodyMode) {
      nextValues.custodyMode = payload.custodyMode;
      changes.push({
        fieldName: 'custodyMode',
        oldValue: currentValues.custodyMode,
        newValue: payload.custodyMode,
      });
    }

    const walletFields: Array<[WalletFieldName, string | undefined]> = [
      ['developerWalletAddress', payload.developerWalletAddress],
      ['issuerWalletAddress', payload.issuerWalletAddress],
      ['distributionWalletAddress', payload.distributionWalletAddress],
      ['proceedsWalletAddress', payload.proceedsWalletAddress],
    ];

    for (const [fieldName, rawValue] of walletFields) {
      if (rawValue === undefined) continue;
      const normalized =
        fieldName === 'developerWalletAddress' ||
        fieldName === 'issuerWalletAddress' ||
        fieldName === 'distributionWalletAddress' ||
        fieldName === 'proceedsWalletAddress'
          ? this.normalizeWalletAddress(rawValue)
          : this.normalizeOptionalText(rawValue);

      if (normalized && !this.isValidStellarPublicKey(normalized)) {
        throw new BadRequestException(
          `${this.getWalletFieldLabel(fieldName)} must be a valid Stellar public key.`,
        );
      }

      if (normalized !== currentValues[fieldName]) {
        nextValues[fieldName] = normalized;
        changes.push({
          fieldName,
          oldValue: currentValues[fieldName],
          newValue: normalized,
        });
      }
    }

    return { currentValues, nextValues, changes };
  }

  private applyWalletFieldChanges(
    project: ProjectEntity,
    payload: Partial<UpdateProjectWalletConfigDto>,
  ) {
    if (payload.custodyMode) {
      project.custodyMode = payload.custodyMode;
    }

    if (payload.developerWalletAddress !== undefined) {
      project.developerWalletAddress = this.normalizeWalletAddress(
        payload.developerWalletAddress,
      ) as any;
    }

    if (payload.issuerWalletAddress !== undefined) {
      project.issuerWalletPublic = this.normalizeWalletAddress(
        payload.issuerWalletAddress,
      ) as any;
    }

    if (payload.distributionWalletAddress !== undefined) {
      project.distributorWalletPublic = this.normalizeWalletAddress(
        payload.distributionWalletAddress,
      ) as any;
    }

    if (payload.proceedsWalletAddress !== undefined) {
      project.proceedsWalletAddress = this.normalizeWalletAddress(
        payload.proceedsWalletAddress,
      ) as any;
    }
  }

  private async createProjectWalletAuditEntries(params: {
    projectId: number;
    changes: Array<{
      fieldName: WalletFieldName;
      oldValue: string | null;
      newValue: string | null;
    }>;
    changedByUserId?: number | null;
    reason: string;
    changeType: WalletChangeType;
  }) {
    if (params.changes.length === 0) return;

    const rows = params.changes.map((change) =>
      this.projectWalletAuditRepo.create({
        projectId: params.projectId,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        reason: params.reason,
        changeType: params.changeType,
        changedBy: params.changedByUserId ?? null,
      }),
    );

    await this.projectWalletAuditRepo.save(rows);
    await this.writeAdminAuditLog({
      actorUserId: params.changedByUserId,
      entityId: params.projectId,
      action:
        params.changeType === 'post_issuance_change_request'
          ? 'project_wallet_change_requested'
          : 'project_wallet_config_updated',
      detailsJson: {
        reason: params.reason,
        changeType: params.changeType,
        changes: params.changes,
      },
    });
  }

  private async assertWalletConfigReadyForIssuance(project: ProjectEntity) {
    const { profile, spv, legalEntity } = await this.getProjectWalletContext(project);
    const pendingRequest = await this.custodyChangeRequestRepo.findOne({
      where: {
        projectId: Number(project.id),
        participantType: 'project',
        status: In(['pending', 'more_info_required']) as any,
      },
      order: { requestedAt: 'DESC' as any },
    });
    const custodyReadiness = this.buildProjectCustodyReadiness({
      project,
      profile,
      spv,
      legalEntity,
      pendingRequest,
    });

    if (custodyReadiness.readinessStatus === 'blocked') {
      const detail = custodyReadiness.blockingReasons.join(' ');
      throw new BadRequestException({
        title: 'Custody configuration is not ready',
        message:
          detail || 'Custody configuration must be completed before issuance.',
        details: custodyReadiness,
      });
    }
  }

  private resolveFundingGoal(project: ProjectEntity) {
    const payload = this.asRecord(project.payloadJson) ?? {};

    return this.toNumber(
      project.fundingGoal ??
        project.totalProjectCapex ??
        payload.fundingGoal ??
        payload.capitalStructure?.fundingGoal ??
        payload.capitalStructure?.totalProjectCapex ??
        0,
    );
  }

  private resolveTokenSupply(project: ProjectEntity) {
    const payload = this.asRecord(project.payloadJson) ?? {};

    return this.toNumber(
      project.tokenSupply ??
        payload.tokenSupply ??
        payload.tokenStructure?.totalTokenSupply ??
        0,
    );
  }

  private resolveSettledAmount(params: {
    unitsSold: number;
    project: ProjectEntity;
  }) {
    const tokenPrice = this.toNumber(params.project.tokenPrice);

    // Version 1 funding progress is based on confirmed self-custody settlement
    // records only. The current self-custody flow stores one settled execution
    // amount per transaction; when an explicit token price exists we convert
    // settled units into capital, otherwise we preserve the settled amount 1:1.
    if (tokenPrice > 0) {
      return params.unitsSold * tokenPrice;
    }

    return params.unitsSold;
  }

  private async attachFundingProgress(projects: ProjectEntity[]) {
    if (projects.length === 0) return [];

    const ids = projects
      .map((project) => Number(project.id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (ids.length === 0) return projects;

    const settledRows = await this.ownershipTxRepo
      .createQueryBuilder('tx')
      .select('tx.project_id', 'projectId')
      .addSelect('COALESCE(SUM(tx.amount), 0)', 'unitsSold')
      .addSelect('COUNT(DISTINCT tx.user_id)', 'investorCount')
      .where('tx.project_id IN (:...ids)', { ids })
      .andWhere('tx.ownership_source = :ownershipSource', {
        ownershipSource: 'ON_CHAIN',
      })
      .andWhere('tx.settlement_status = :settlementStatus', {
        settlementStatus: 'SETTLED',
      })
      .groupBy('tx.project_id')
      .getRawMany();

    const settledMap = new Map<number, { unitsSold: number; investorCount: number }>();

    for (const row of settledRows) {
      settledMap.set(Number(row.projectId), {
        unitsSold: this.toNumber(row.unitsSold),
        investorCount: this.toNumber(row.investorCount),
      });
    }

    return projects.map((project) => {
      const settled = settledMap.get(Number(project.id)) ?? {
        unitsSold: 0,
        investorCount: 0,
      };
      const tokenSupply = this.resolveTokenSupply(project);
      const amountSettled = this.resolveSettledAmount({
        unitsSold: settled.unitsSold,
        project,
      });
      const fundingGoal = this.resolveFundingGoal(project);
      const percentFunded =
        fundingGoal > 0 ? Math.min(100, (amountSettled / fundingGoal) * 100) : 0;

      return {
        ...project,
        amountSettled,
        fundedSoFar: amountSettled,
        raisedAmount: amountSettled,
        investorCount: settled.investorCount,
        unitsSold: settled.unitsSold,
        unitsRemaining: Math.max(tokenSupply - settled.unitsSold, 0),
        purchasedAmount: settled.unitsSold,
        percentFunded,
      };
    });
  }

  private async serializeProject(project: ProjectEntity | null | undefined) {
    if (!project) return null;
    const [projectWithFunding] = await this.attachFundingProgress([project]);
    const [projectWithAssets] = await this.attachProjectAssets([projectWithFunding as any]);
    return this.projectMapper.fromProjectToProjectResponseDto(projectWithAssets as any);
  }

  private async serializeProjects(projects: ProjectEntity[]) {
    const projectsWithFunding = await this.attachFundingProgress(projects);
    const projectsWithAssets = await this.attachProjectAssets(projectsWithFunding as any);
    return projectsWithAssets.map((project) =>
      this.projectMapper.fromProjectToProjectResponseDto(project as any),
    );
  }

  private resolveDseType(source: Record<string, any>, rawPayload?: Record<string, any>) {
    const topLevel = rawPayload ?? {};

    return (
      source.dseType ??
      source?.tokenStructure?.dseType ??
      topLevel.dseType ??
      topLevel?.tokenStructure?.dseType ??
      source.projectType ??
      topLevel.projectType ??
      undefined
    );
  }

  private assertEditableStatus(project: ProjectEntity) {
    if (project.status !== 'draft' && project.status !== 'changes_requested') {
      throw new Error('Only draft or changes requested projects can be edited');
    }
  }

  private transitionProject(project: ProjectEntity, nextStatus: ProjectReviewStatus, notes?: string) {
    const currentStatus = String(project.status ?? 'draft') as ProjectReviewStatus;

    const allowedTransitions: Record<ProjectReviewStatus, ProjectReviewStatus[]> = {
      draft: ['under_review', 'locked'],
      under_review: ['changes_requested', 'approved', 'locked'],
      changes_requested: ['under_review', 'locked'],
      approved: ['issued', 'locked'],
      issued: ['live', 'locked'],
      live: ['locked'],
      locked: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
      throw new Error(`Invalid project status transition: ${currentStatus} -> ${nextStatus}`);
    }

    project.status = nextStatus;
    project.lastReviewedAt = new Date();

    if (notes !== undefined) {
      project.adminNotes = notes;
    }

    if (nextStatus === 'under_review') {
      project.submittedAt = new Date();
      project.rejectedAt = null as any;
    }

    if (nextStatus === 'changes_requested') {
      project.rejectedAt = new Date();
    }

    if (nextStatus === 'approved') {
      project.approvedAt = new Date();
      project.rejectedAt = null as any;
      project.lockedAt = null as any;
    }

    if (nextStatus === 'issued') {
      project.issuedAt = new Date();
      project.lockedAt = null as any;
    }

    if (nextStatus === 'live') {
      project.liveAt = new Date();
      project.lockedAt = null as any;
    }

    if (nextStatus === 'locked') {
      project.lockedAt = new Date();
      project.lockReason = notes ?? project.lockReason ?? null;
    }
  }

  private setIssuanceStatus(
    project: ProjectEntity,
    status: IssuanceExecutionStatus,
    txHash?: string | null,
  ) {
    project.issuanceStatus = status;
    if (txHash !== undefined) {
      project.issuanceTxHash = txHash;
    }
  }

  private clearIssuanceFailure(project: ProjectEntity) {
    project.issuanceFailureReason = null as any;
    project.issuanceFailurePayload = null as any;
  }

  private extractIssuanceFailureDetails(error: any): IssuanceFailureDetails {
    const horizonPayload =
      this.asRecord(error?.response?.data) ??
      this.asRecord(error?.response?.body) ??
      this.asRecord(error?.data) ??
      this.asRecord(error?.extras) ??
      {};
    const resultCodes = this.asRecord(horizonPayload?.extras?.result_codes) ?? {};
    const operationResultCodes = Array.isArray(resultCodes.operations)
      ? resultCodes.operations
      : undefined;
    const envelopeXdr = horizonPayload?.extras?.envelope_xdr;
    const messageCandidates = [
      error?.message,
      horizonPayload?.detail,
      horizonPayload?.title,
      horizonPayload?.type,
      resultCodes.transaction,
      operationResultCodes?.join(', '),
    ]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);
    const reason = messageCandidates[0] || 'Unknown issuance error';

    return {
      reason,
      payload: {
        name: error?.name ?? 'Error',
        message: error?.message ?? reason,
        horizon: Object.keys(horizonPayload).length > 0 ? horizonPayload : undefined,
        resultCodes: Object.keys(resultCodes).length > 0 ? resultCodes : undefined,
        operationResultCodes,
        envelopeXdr,
      },
    };
  }

  private buildIssuanceErrorMessage(params: {
    projectId: number;
    tokenSymbol: string;
    tokenSupply: number;
    failure: IssuanceFailureDetails;
  }) {
    return (
      `Project ${params.projectId} failed Stellar issuance for ${params.tokenSymbol} ` +
      `(${params.tokenSupply}). ${params.failure.reason}`
    );
  }

  private resolveDistributorWalletForIssuance(project: ProjectEntity) {
    const persistedDistributorWallet = this.normalizeWalletAddress(
      project.distributorWalletPublic,
    );

    if (!persistedDistributorWallet) {
      throw new BadRequestException({
        title: 'Missing distribution wallet',
        message:
          'Distribution wallet must be configured and validated before issuance can run.',
      });
    }

    return persistedDistributorWallet;
  }

  private async validateIssuancePrerequisites(params: {
    project: ProjectEntity;
    assetCode: string;
    tokenSupply: number;
    distributorWalletPublic: string;
  }) {
    const { project, assetCode, tokenSupply, distributorWalletPublic } = params;
    const missingConfig = this.assetService.getMissingCoreConfigKeys();
    if (missingConfig.length > 0) {
      throw new ServiceUnavailableException({
        title: 'Missing Stellar configuration',
        message: `Token issuance is unavailable because these env vars are missing: ${missingConfig.join(
          ', ',
        )}.`,
      });
    }

    if (!/^[A-Z0-9]{1,12}$/.test(assetCode)) {
      throw new BadRequestException({
        title: 'Invalid token symbol',
        message:
          'Token symbol must be 1-12 uppercase alphanumeric characters before issuance can run.',
      });
    }

    if (!Number.isFinite(tokenSupply) || tokenSupply <= 0) {
      throw new BadRequestException({
        title: 'Invalid token supply',
        message: 'Token supply must be greater than 0 before issuance can run.',
      });
    }

    const networkConfig = this.assetService.getNetworkConfig();
    const preflight = await this.assetService.getDistributionIssuancePreflight(
      assetCode,
      distributorWalletPublic,
    );

    const configuredIssuerWallet = this.normalizeWalletAddress(
      project.issuerWalletPublic,
    );

    if (
      configuredIssuerWallet &&
      configuredIssuerWallet !== this.normalizeWalletAddress(preflight.issuerPublicKey)
    ) {
      throw new BadRequestException({
        title: 'Issuer wallet mismatch',
        message:
          'Configured issuer wallet does not match the platform issuance issuer available in this environment.',
      });
    }

    this.logger.log(
      JSON.stringify({
        event: 'project_issuance_preflight',
        projectId: project.id,
        tokenSymbol: assetCode,
        tokenSupply,
        issuerPublicKey: preflight.issuerPublicKey,
        distributorPublicKey: preflight.distributorPublicKey,
        requestedDistributorPublicKey: project.distributorWalletPublic ?? null,
        serverUrl: networkConfig.serverUrl,
        networkPassphrase: networkConfig.networkPassphrase,
        distributorHasTrustline: preflight.distributorHasTrustline,
        distributorBalance: preflight.distributorBalance,
      }),
    );

    return preflight;
  }

  private applyIssuanceFailure(project: ProjectEntity, failure: IssuanceFailureDetails) {
    project.issuanceFailureReason = failure.reason;
    project.issuanceFailurePayload = failure.payload;
  }

  private resolveIssuedSupply(project: ProjectEntity, seriesSupply?: number | null) {
    const candidate = Number(project.tokenSupply ?? seriesSupply ?? 0);

    if (!Number.isFinite(candidate) || candidate <= 0) {
      throw new BadRequestException({
        title: 'Invalid token supply',
        message: 'Token supply must exist and be greater than 0 before issuance.',
      });
    }

    return candidate;
  }

  private resolveAssetCode(project: ProjectEntity, seriesTokenSymbol?: string | null) {
    const assetCode = String(project.tokenSymbol ?? seriesTokenSymbol ?? '')
      .trim()
      .toUpperCase();

    if (!assetCode) {
      throw new BadRequestException({
        title: 'Missing token symbol',
        message: 'Token symbol must exist before issuance.',
      });
    }

    return assetCode;
  }

  private async seedDistributorInventory(params: {
    projectId: number;
    seriesId: number;
    tokenSymbol: string;
    distributorWalletPublic: string;
    amount: number;
  }) {
    let position = await this.ownershipRepo.findOne({
      where: {
        userId: null as any,
        projectId: params.projectId,
        seriesId: params.seriesId,
        tokenSymbol: params.tokenSymbol,
        custodyType: 'self_custody',
        walletAddress: params.distributorWalletPublic,
        status: 'active',
      } as any,
    });

    if (!position) {
      position = this.ownershipRepo.create({
        userId: null,
        projectId: params.projectId,
        seriesId: params.seriesId,
        tokenSymbol: params.tokenSymbol,
        amount: 0,
        custodyType: 'self_custody',
        ownershipSource: 'ON_CHAIN',
        settlementStatus: 'SETTLED',
        walletAddress: params.distributorWalletPublic,
        custodyAccountRef: null,
        status: 'active',
      });
    }

    position.amount = params.amount;
    position.ownershipSource = 'ON_CHAIN';
    position.settlementStatus = 'SETTLED';
    position.updatedAt = new Date();
    await this.ownershipRepo.save(position);
  }

  private applyProjectFields(
    project: ProjectEntity,
    source: Record<string, any>,
    rawPayload?: Record<string, any>,
  ) {
    const topLevel = rawPayload ?? {};

    project.projectName =
      source.projectName ?? source.name ?? topLevel.projectName ?? topLevel.name ?? project.projectName;
    project.description =
      source.description ?? topLevel.description ?? project.description;
    project.projectType =
      source.projectType ?? topLevel.projectType ?? project.projectType;
    project.dseType = source.dseType ?? topLevel.dseType ?? project.dseType;
    project.stage = source.stage ?? topLevel.stage ?? project.stage;
    project.location =
      source.siteAddress ??
      source.fullAddress ??
      source.location ??
      topLevel.siteAddress ??
      topLevel.fullAddress ??
      topLevel.location ??
      project.location;
    project.jurisdiction =
      source.jurisdiction ?? topLevel.jurisdiction ?? project.jurisdiction;
    project.startDate = this.normalizeOptionalDate(
      source.startDate ?? topLevel.startDate,
      project.startDate,
    ) as any;
    project.endDate = this.normalizeOptionalDate(
      source.endDate ?? topLevel.endDate,
      project.endDate,
    ) as any;
    const hasUploadedThumbnailAsset = Boolean(
      this.asRecord(source.thumbnailAsset)?.storageKey ??
        this.asRecord(topLevel.thumbnailAsset)?.storageKey,
    );
    if (!hasUploadedThumbnailAsset) {
      project.thumbnailImageUrl =
        source.thumbnailImageUrl ??
        source.thumbnailUrl ??
        topLevel.thumbnailImageUrl ??
        topLevel.thumbnailUrl ??
        project.thumbnailImageUrl;
    }
    project.fundingGoal =
      source.fundingGoal !== undefined
        ? Number(source.fundingGoal)
        : topLevel.fundingGoal !== undefined
          ? Number(topLevel.fundingGoal)
          : project.fundingGoal;
    project.minimumInvestment = String(
      source.minimumInvestment ??
        topLevel.minimumInvestment ??
        project.minimumInvestment ??
        '',
    ) || project.minimumInvestment;
    project.totalProjectCapex = String(
      source.totalProjectCapex ??
        topLevel.totalProjectCapex ??
        project.totalProjectCapex ??
        '',
    ) || project.totalProjectCapex;
    // Calculated investor return outputs are now produced by the readiness
    // return engine, not accepted as developer-entered setup fields.
    project.investmentTermYears = String(
      source.investmentTermYears ??
        topLevel.investmentTermYears ??
        project.investmentTermYears ??
        '',
    ) || project.investmentTermYears;
    project.investmentSummary = String(
      source.investmentSummary ??
        topLevel.investmentSummary ??
        project.investmentSummary ??
        '',
    ) || project.investmentSummary;
    project.commissioningDate = this.normalizeOptionalDate(
      source.commissioningDate ?? topLevel.commissioningDate,
      project.commissioningDate,
    ) as any;
    project.tokenName = this.normalizeOptionalText(
      source?.tokenStructure?.tokenName ??
      source.tokenName ??
      topLevel?.tokenStructure?.tokenName ??
      topLevel.tokenName,
    ) ?? project.tokenName;
    project.tokenSymbol = this.normalizeOptionalText(
      source?.tokenStructure?.tokenSymbol ??
      source.tokenSymbol ??
      topLevel?.tokenStructure?.tokenSymbol ??
      topLevel.tokenSymbol,
    ) ?? project.tokenSymbol;
    // Token supply is derived from capital raise and unit price in
    // project_issuance. Preserve any existing legacy value for old records.
  }

  private async getProjectEntity(id: string) {
    const numericId = Number(id);

    if (Number.isFinite(numericId) && numericId > 0) {
      return this.projectRepo.findOne({
        where: {
          id: numericId,
          deletedAt: null,
        },
        relations: ['user'],
      });
    }

    return this.projectRepo.findOne({
      where: {
        uuid: id,
        deletedAt: null,
      } as any,
      relations: ['user'],
    });
  }

  private async clearDuplicateDraftTokenSymbol(project: ProjectEntity) {
    const tokenSymbol = this.normalizeOptionalText(project.tokenSymbol);
    if (!tokenSymbol) return;

    const existing = await this.projectRepo.findOne({
      where: { tokenSymbol } as any,
    });

    if (existing && Number(existing.id) !== Number(project.id ?? 0)) {
      project.tokenSymbol = null as any;
    }
  }

  private assertCanReadProject(project: ProjectEntity, userId: number, isAdmin: boolean) {
    if (isAdmin) return;

    if (!project.user || Number(project.user.id) !== Number(userId)) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private assertCanEditProject(project: ProjectEntity, userId: number, isAdmin: boolean) {
    if (isAdmin) return;

    if (!project.user || Number(project.user.id) !== Number(userId)) {
      throw new ForbiddenException('You do not have permission to modify this project');
    }
  }

  async uploadProjectFile(params: {
    projectId: string;
    userId?: number | null;
    isAdmin?: boolean;
    file: Express.Multer.File;
    purpose: ProjectFilePurpose;
    documentKey?: string | null;
    uploadedBy?: number | null;
  }) {
    const project = await this.getProjectEntity(params.projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    this.assertCanEditProject(
      project,
      Number(params.userId ?? 0),
      Boolean(params.isAdmin),
    );

    if (!params.file) {
      throw new BadRequestException('file is required');
    }

    this.validateProjectFileUpload({
      purpose: params.purpose,
      mimeType: params.file.mimetype,
      documentKey: params.documentKey,
    });

    await this.markExistingProjectFilesReplaced({
      projectId: Number(project.id),
      purpose: params.purpose,
      documentKey: params.documentKey,
    });

    const sanitizedName = this.sanitizeFileName(params.file.originalname);
    const storageKey = [
      'projects',
      String(project.id),
      params.purpose.toLowerCase(),
      `${Date.now()}-${sanitizedName}`,
    ].join('/');

    await this.s3StorageService.uploadFile({
      key: storageKey,
      body: params.file.buffer,
      contentType: params.file.mimetype,
      metadata: {
        projectId: String(project.id),
        purpose: params.purpose,
        documentKey: String(params.documentKey ?? ''),
        uploadedBy: String(params.uploadedBy ?? ''),
      },
    });

    const category = this.getProjectFileCategory(params.purpose);
    const entity = this.projectFileRepo.create({
      projectId: Number(project.id),
      category,
      purpose: params.purpose,
      documentKey: params.documentKey ?? null,
      storageKey,
      originalFilename: params.file.originalname,
      mimeType: params.file.mimetype,
      fileSize: params.file.size ?? null,
      uploadedBy: params.uploadedBy ?? null,
    });

    const saved = await this.projectFileRepo.save(entity);
    return this.mapProjectFile(saved);
  }

  private async assertDeveloperSetupCompleted(userId: number) {
    const profile = await this.developerProfileRepo.findOne({
      where: { user: { id: userId } } as any,
      relations: ['user'],
    });

    if (!profile) {
      throw new ForbiddenException(
        'Developer Setup must be completed before Project Setup can be started.',
      );
    }

    const allowed =
      profile.status === 'completed' || profile.status === 'approved';

    if (!allowed) {
      throw new ForbiddenException(
        'Developer Setup must be completed before Project Setup can be started.',
      );
    }

    return profile;
  }

  async getProjects() {
    const projects = await this.projectRepo.find({
      where: {
        deletedAt: null,
        status: In(['approved', 'issued', 'live']) as any,
      },
      order: {
        approvedAt: 'DESC' as any,
        liveAt: 'DESC' as any,
        updatedAt: 'DESC' as any,
      },
    });

    return await this.serializeProjects(projects);
  }

  async getAdminProjects() {
    const projects = await this.projectRepo.find({
      where: [
        { status: 'under_review' },
        { status: 'changes_requested' },
        { status: 'approved' },
        { status: 'issued' },
        { status: 'live' },
        { status: 'locked' },
      ],
      relations: ['user'],
      order: { updatedAt: 'DESC' as any },
    });

    return await this.serializeProjects(projects);
  }

  async getProject(id: string, userId: number, isAdmin = false) {
    const project = await this.getProjectEntity(id);
    if (!project) return null;
    this.assertCanReadProject(project, userId, isAdmin);
    return await this.serializeProject(project);
  }

  async getProjectInvestors(id: string, userId: number, isAdmin = false) {
    const project = await this.findProjectOrThrow(id);
    const projectOwnerId = Number(project.user?.id ?? 0);

    if (!isAdmin && projectOwnerId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const ownershipRows = await this.ownershipRepo
      .createQueryBuilder('ownership')
      .select('ownership.user_id', 'userId')
      .addSelect('SUM(ownership.amount)', 'tokensHeld')
      .addSelect(
        `MAX(CASE
          WHEN ownership.status = 'active' AND ownership.settlement_status = 'SETTLED'
          THEN 1 ELSE 0 END)`,
        'isActive',
      )
      .where('ownership.project_id = :projectId', { projectId: project.id })
      .andWhere('ownership.user_id IS NOT NULL')
      .groupBy('ownership.user_id')
      .getRawMany();

    const userIds = ownershipRows
      .map((row) => Number(row.userId))
      .filter((value) => Number.isFinite(value) && value > 0);

    const users = userIds.length
      ? await this.userRepo.findBy({ id: In(userIds) })
      : [];

    const userById = new Map(users.map((user) => [Number(user.id), user]));

    const txRows = await this.transactionRepo
      .createQueryBuilder('transaction')
      .select('transaction.user_id', 'userId')
      .addSelect('COALESCE(SUM(transaction.amount), 0)', 'amountInvested')
      .where('transaction.project_id = :projectId', { projectId: project.id })
      .andWhere('transaction.user_id IS NOT NULL')
      .andWhere('transaction.type = :type', { type: 'BUY' })
      .andWhere('transaction.status = :status', { status: 'COMPLETED' })
      .groupBy('transaction.user_id')
      .getRawMany();

    const investedByUserId = new Map(
      txRows.map((row) => [Number(row.userId), Number(row.amountInvested || 0)]),
    );

    const tokenSupply = Number(project.tokenSupply ?? 0);

    const investors = ownershipRows
      .map((row) => {
        const investorId = Number(row.userId);
        const user = userById.get(investorId);
        const tokensHeld = Number(row.tokensHeld || 0);
        const ownershipPercentage =
          tokenSupply > 0 ? (tokensHeld / tokenSupply) * 100 : 0;

        return {
          userId: investorId,
          investorName: this.maskInvestorName(user?.fullname, user?.uuid),
          amountInvested: Number(investedByUserId.get(investorId) || 0),
          tokensHeld,
          ownershipPercentage,
          status: Number(row.isActive || 0) > 0 ? 'ACTIVE' : 'PENDING',
        };
      })
      .sort((left, right) => right.tokensHeld - left.tokensHeld);

    const topHolders = investors.slice(0, 10);
    const othersRows = investors.slice(10);
    const others = othersRows.length
      ? {
          investorCount: othersRows.length,
          amountInvested: othersRows.reduce(
            (sum, row) => sum + Number(row.amountInvested || 0),
            0,
          ),
          tokensHeld: othersRows.reduce(
            (sum, row) => sum + Number(row.tokensHeld || 0),
            0,
          ),
          ownershipPercentage: othersRows.reduce(
            (sum, row) => sum + Number(row.ownershipPercentage || 0),
            0,
          ),
        }
      : null;

    return {
      project: {
        id: project.id,
        uuid: project.uuid,
        name: project.name,
        tokenSymbol: project.tokenSymbol,
        tokenSupply: Number(project.tokenSupply ?? 0),
      },
      totalInvestors: investors.length,
      totalCapitalRaised: investors.reduce(
        (sum, row) => sum + Number(row.amountInvested || 0),
        0,
      ),
      totalTokensHeld: investors.reduce(
        (sum, row) => sum + Number(row.tokensHeld || 0),
        0,
      ),
      investors,
      topHolders,
      others,
    };
  }

  async getPublicProject(id: string) {
    const project = await this.projectRepo.findOne({
      where: {
        id: Number(id),
        deletedAt: null,
        status: In(['approved', 'issued', 'live']) as any,
      },
    });

    return await this.serializeProject(project);
  }

  async getMyProjects(userId: number) {
    const projects = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('project.deleted_at IS NULL')
      .orderBy('project.updated_at', 'DESC')
      .getMany();

    return await this.serializeProjects(projects);
  }

  async createProject(payload: any, userId: number) {
    try {
      await this.assertDeveloperSetupCompleted(userId);
      const rawPayload = this.asRecord(payload) ?? {};
      const canonicalDraftPayload = this.resolveCanonicalDraftPayload(rawPayload);

      const project = this.projectRepo.create({
        user: { id: userId } as any,
        status: 'draft',
        draftPayload: canonicalDraftPayload,
        payloadJson: canonicalDraftPayload,
        workflowStatusJson: this.resolveWorkflowStatus(rawPayload),
        completedCount:
          typeof rawPayload.completedCount === 'number' ? rawPayload.completedCount : 0,
        totalSections:
          typeof rawPayload.totalSections === 'number' ? rawPayload.totalSections : 0,
        lastSavedAt: new Date(),
      });

      this.applyProjectFields(project, canonicalDraftPayload, rawPayload);
      project.dseType = this.resolveDseType(canonicalDraftPayload, rawPayload) ?? project.dseType;
      await this.clearDuplicateDraftTokenSymbol(project);

      const saved = await this.projectRepo.save(project);
      return await this.serializeProject(saved);
    } catch (error) {
      this.logger.error(
        `Failed to create project draft for user ${userId}: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  async updateProject(id: string, payload: any, userId: number, isAdmin = false) {
    try {
      const project = await this.getProjectEntity(id);
      if (!project) throw new Error('Project not found');

      this.assertCanEditProject(project, userId, isAdmin);
      this.assertEditableStatus(project);

      const rawPayload = this.asRecord(payload) ?? {};
      const canonicalDraftPayload = this.resolveCanonicalDraftPayload(rawPayload);

      this.applyProjectFields(project, canonicalDraftPayload, rawPayload);
      project.dseType = this.resolveDseType(canonicalDraftPayload, rawPayload) ?? project.dseType;
      await this.clearDuplicateDraftTokenSymbol(project);

      if (this.hasMeaningfulPayload(canonicalDraftPayload)) {
        project.payloadJson = canonicalDraftPayload;
        project.draftPayload = canonicalDraftPayload;
      }

      const workflowStatus = this.resolveWorkflowStatus(rawPayload);
      if (this.hasMeaningfulPayload(workflowStatus)) {
        project.workflowStatusJson = workflowStatus;
      }

      if (typeof rawPayload.completedCount === 'number') {
        project.completedCount = rawPayload.completedCount;
      }

      if (typeof rawPayload.totalSections === 'number') {
        project.totalSections = rawPayload.totalSections;
      }

      project.lastSavedAt = new Date();

      const saved = await this.projectRepo.save(project);
      return await this.serializeProject(saved);
    } catch (error) {
      this.logger.error(
        `Failed to save project draft ${id} for user ${userId}: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      throw error;
    }
  }

  async saveDraft(id: string, payload: any, userId: number, isAdmin = false) {
    return this.updateProject(id, payload, userId, isAdmin);
  }

  async submitProject(id: string, userId: number) {
    await this.assertDeveloperSetupCompleted(userId);

    const project = await this.getProjectEntity(id);
    if (!project) throw new Error('Project not found');

    this.assertEditableStatus(project);

    const payload = (project.draftPayload ?? project.payloadJson ?? {}) as any;

    const resolvedName = project.name ?? payload.projectName ?? payload.name;
    const resolvedProjectType = project.projectType ?? payload.projectType;
    const resolvedDseType = this.resolveDseType(payload, payload) ?? project.dseType;
    const resolvedStage = project.stage ?? payload.stage;
    const resolvedFundingGoal = project.fundingGoal ?? payload.fundingGoal;
    const resolvedMinimumInvestment =
      project.minimumInvestment ?? payload.minimumInvestment;
    const resolvedLocation =
      project.location ?? payload.fullAddress ?? payload.location;
    const resolvedJurisdiction =
      project.jurisdiction ?? payload.jurisdiction;
    const resolvedThumbnail =
      project.thumbnailUrl ?? payload.thumbnailImageUrl ?? payload.thumbnailUrl;

    if (
      !resolvedName ||
      !resolvedProjectType ||
      !resolvedDseType ||
      !resolvedStage ||
      !resolvedFundingGoal ||
      !resolvedMinimumInvestment ||
      !resolvedLocation
    ) {
      throw new Error('Missing required fields');
    }

    // TEMPORARY FIX: disable frontend-driven section completion gate
    // Rely on required field validation above instead
    // if ((project.completedCount || 0) < minimumCompletedSections) {
    //   throw new Error(
    //     `Project not complete enough. ${project.completedCount || 0}/${minimumCompletedSections} sections completed.`,
    //   );
    // }

    project.name = resolvedName;
    project.projectType = resolvedProjectType;
    project.dseType = resolvedDseType;
    project.stage = resolvedStage;
    project.fundingGoal = Number(resolvedFundingGoal);
    project.minimumInvestment = String(resolvedMinimumInvestment);
    project.location = resolvedLocation;
    project.jurisdiction = resolvedJurisdiction;
    project.thumbnailUrl = resolvedThumbnail;

    project.payloadJson = payload;
    project.workflowStatusJson = (project.workflowStatusJson as any) ?? {};

    this.transitionProject(project, 'under_review');
    project.lastSavedAt = new Date();

    const saved = await this.projectRepo.save(project);

    const existingVersions = await this.versionRepo.count({
      where: { project: { id: saved.id } as any },
    });

    const version = this.versionRepo.create({
      project: saved,
      versionNumber: existingVersions + 1,
      status: 'under_review',
      payloadJson: saved.payloadJson,
      changeSummary:
        existingVersions === 0
          ? 'Initial submission'
          : 'Resubmitted after changes',
      submittedAt: new Date(),
    });

    await this.versionRepo.save(version);

    return await this.serializeProject(saved);
  }

  async updateStatus(id: string, status: string, notes?: string) {
    const project = await this.getProjectEntity(id);
    if (!project) throw new Error('Project not found');

    const allowedStatuses: ProjectReviewStatus[] = [
      'draft',
      'under_review',
      'changes_requested',
      'approved',
      'issued',
      'live',
      'locked',
    ];

    if (!allowedStatuses.includes(status as ProjectReviewStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }

    this.transitionProject(project, status as ProjectReviewStatus, notes);

    if (status === 'approved') {
      this.setIssuanceStatus(project, 'not_started', null);
      this.clearIssuanceFailure(project);
    }

    const saved = await this.projectRepo.save(project);

    if (status === 'approved' && saved.user?.id) {
      await this.notificationService.createNotification(
        Number(saved.user.id),
        NotificationType.PROJECT_APPROVED,
        'Project approved',
        `${saved.name} has been approved for the next stage of the RegenX workflow.`,
        'project',
        Number(saved.id),
      );
    }

    return await this.serializeProject(saved);
  }

  async approveProject(id: string, notes?: string) {
    return this.updateStatus(id, 'approved', notes);
  }

  async prepareProjectForIssuance(
    id: string,
    preparedByUserId?: number,
    reason?: string,
  ) {
    const project = await this.findProjectOrThrow(id);
    if (String(project.status ?? 'draft') === 'draft') {
      throw new BadRequestException(
        'Draft projects cannot be prepared for issuance yet.',
      );
    }

    return this.spvService.prepareDraftSpvForProject(
      Number(project.id),
      preparedByUserId,
      reason ?? 'Prepare for issuance',
    );
  }

  async requestChanges(id: string, notes?: string) {
    return this.updateStatus(id, 'changes_requested', notes);
  }

  async issueProject(id: string, notes?: string, initiatedByUserId?: number) {
    const project = await this.getProjectEntity(id);
    if (!project) throw new Error('Project not found');

    if (project.status === 'issued' || project.status === 'live') {
      if (String(project.issuanceStatus ?? 'not_started') === 'completed') {
        this.logger.log(
          `Skipping duplicate issuance for project ${project.id}; already issued with tx ${project.issuanceTxHash ?? 'unknown'}.`,
        );
        return await this.serializeProject(project);
      }
    }

    if (project.status !== 'approved') {
      throw new BadRequestException({
        title: 'Invalid project status',
        message: 'Only approved projects can be issued.',
      });
    }

    if (String(project.issuanceStatus ?? 'not_started') === 'pending') {
      throw new ConflictException({
        title: 'Issuance already in progress',
        message: 'This project already has an issuance attempt in progress.',
      });
    }

    await this.assertWalletConfigReadyForIssuance(project);
    await this.spvService.assertSpvReadyForIssuance(Number(project.id));

    const seriesResult = await this.spvService.createSeriesForProject(Number(id));
    const issuedSupply = this.resolveIssuedSupply(
      project,
      Number(seriesResult.series.totalSupply ?? 0),
    );
    const assetCode = this.resolveAssetCode(project, seriesResult.series.tokenSymbol);
    const distributorWalletPublic = this.resolveDistributorWalletForIssuance(project);
    const preflight = await this.validateIssuancePrerequisites({
      project,
      assetCode,
      tokenSupply: issuedSupply,
      distributorWalletPublic,
    });
    const issuerWalletPublic = preflight.issuerPublicKey;
    const distributorBalance = Number(preflight.distributorBalance ?? 0);

    project.spvId = seriesResult.spv.id;
    project.seriesId = seriesResult.series.id;
    project.issuerWalletPublic = issuerWalletPublic;
    project.distributorWalletPublic = distributorWalletPublic;
    project.assetCode = assetCode;
    project.assetIssuer = issuerWalletPublic;
    project.issuedSupply = String(issuedSupply);
    project.issuanceInitiatedBy = initiatedByUserId ?? project.issuanceInitiatedBy;
    project.tokenSymbol = assetCode;
    this.clearIssuanceFailure(project);

    if (distributorBalance >= issuedSupply) {
      this.logger.warn(
        `Project ${project.id} already has distributor balance ${distributorBalance} for ${assetCode}; marking issuance complete without minting again.`,
      );
      this.transitionProject(project, 'issued', notes);
      this.setIssuanceStatus(project, 'completed', project.issuanceTxHash ?? null);
      project.walletConfigLockedAt = new Date();
      project.walletConfigLockedReason =
        project.walletConfigLockedReason ??
        'Wallet configuration locked after issuance completed.';

      (project as any).payloadJson = {
        ...((project as any).payloadJson ?? {}),
        seriesId: seriesResult.series.id,
        spvId: seriesResult.spv.id,
        seriesName: seriesResult.series.name,
        tokenSymbol: assetCode,
        assetCode,
        assetIssuer: issuerWalletPublic,
        issuerWalletPublic,
        distributorWalletPublic,
        issuedSupply: String(issuedSupply),
        issuanceStatus: 'completed',
        issuanceFailureReason: null,
        issuanceFailurePayload: null,
        issuanceMode: 'issuer_to_distributor',
      };

      await this.seedDistributorInventory({
        projectId: Number(project.id),
        seriesId: seriesResult.series.id,
        tokenSymbol: assetCode,
        distributorWalletPublic,
        amount: issuedSupply,
      });

      const saved = await this.projectRepo.save(project);
      return await this.serializeProject(saved);
    }

    (project as any).payloadJson = {
      ...((project as any).payloadJson ?? {}),
      seriesId: seriesResult.series.id,
      spvId: seriesResult.spv.id,
      seriesName: seriesResult.series.name,
      tokenSymbol: assetCode,
      assetCode,
      assetIssuer: issuerWalletPublic,
      issuerWalletPublic,
      distributorWalletPublic,
      issuedSupply: String(issuedSupply),
      issuanceStatus: 'pending',
      issuanceFailureReason: null,
      issuanceFailurePayload: null,
      issuanceMode: 'issuer_to_distributor',
    };

    this.setIssuanceStatus(project, 'pending');
    await this.projectRepo.save(project);

    try {
      const issuance = await this.assetService.issueToDistribution(
        assetCode,
        String(issuedSupply),
        distributorWalletPublic,
      );

      await this.seedDistributorInventory({
        projectId: Number(project.id),
        seriesId: seriesResult.series.id,
        tokenSymbol: assetCode,
        distributorWalletPublic,
        amount: issuedSupply,
      });

      this.transitionProject(project, 'issued', notes);
      this.setIssuanceStatus(project, 'completed', issuance.txHash);
      project.issuerWalletPublic = issuance.issuerPublicKey;
      project.distributorWalletPublic = issuance.distributorPublicKey;
      project.walletConfigLockedAt = new Date();
      project.walletConfigLockedReason =
        'Wallet configuration locked after issuance completed.';
      project.assetCode = assetCode;
      project.assetIssuer = issuance.issuerPublicKey;
      project.issuedSupply = String(issuedSupply);
      this.clearIssuanceFailure(project);

      (project as any).payloadJson = {
        ...((project as any).payloadJson ?? {}),
        seriesId: seriesResult.series.id,
        spvId: seriesResult.spv.id,
        seriesName: seriesResult.series.name,
        tokenSymbol: assetCode,
        assetCode,
        assetIssuer: issuance.issuerPublicKey,
        issuerWalletPublic: issuance.issuerPublicKey,
        distributorWalletPublic: issuance.distributorPublicKey,
        issuedSupply: String(issuedSupply),
        issuanceStatus: 'completed',
        issuanceTxHash: issuance.txHash,
        issuanceFailureReason: null,
        issuanceFailurePayload: null,
        issuedAt: new Date().toISOString(),
        issuanceMode: 'issuer_to_distributor',
        fundingSourceOfTruth:
          'Future funding progress must be based on confirmed settled distribution or ownership events, not investor intent or unsigned transactions.',
      };

      const saved = await this.projectRepo.save(project);
      return await this.serializeProject(saved);
    } catch (error: any) {
      this.setIssuanceStatus(project, 'failed', null);
      const failure = this.extractIssuanceFailureDetails(error);
      this.applyIssuanceFailure(project, failure);

      (project as any).payloadJson = {
        ...((project as any).payloadJson ?? {}),
        seriesId: seriesResult.series.id,
        spvId: seriesResult.spv.id,
        tokenSymbol: assetCode,
        assetCode,
        assetIssuer: issuerWalletPublic,
        issuerWalletPublic,
        distributorWalletPublic,
        issuedSupply: String(issuedSupply),
        issuanceStatus: 'failed',
        issuanceFailureReason: failure.reason,
        issuanceFailurePayload: failure.payload,
        issuanceMode: 'issuer_to_distributor',
      };

      await this.projectRepo.save(project);
      this.logger.error(
        JSON.stringify({
          event: 'project_issuance_failed',
          projectId: project.id,
          tokenSymbol: assetCode,
          tokenSupply: issuedSupply,
          issuerPublicKey: issuerWalletPublic,
          distributorPublicKey: distributorWalletPublic,
          requestedDistributorPublicKey: project.distributorWalletPublic ?? null,
          horizonPayload: failure.payload.horizon ?? null,
          resultCodes: failure.payload.resultCodes ?? null,
        }),
      );
      throw new BadGatewayException({
        title: 'Project issuance failed',
        message: this.buildIssuanceErrorMessage({
          projectId: Number(project.id),
          tokenSymbol: assetCode,
          tokenSupply: issuedSupply,
          failure,
        }),
      });
    }
  }

  async goLive(id: string) {
    const project = await this.getProjectEntity(id);
    if (!project) throw new Error('Project not found');

    if (project.status !== 'issued') {
      throw new Error('Only issued projects can go live');
    }

    const payload = this.asRecord(project.payloadJson);
    if (String(project.issuanceStatus ?? payload?.issuanceStatus ?? 'not_started') !== 'completed') {
      throw new Error('Project issuance has not completed successfully');
    }

    const resolvedSeriesId = project.seriesId ?? Number(payload?.seriesId ?? 0);
    const resolvedAssetCode = project.assetCode ?? String(payload?.assetCode ?? '').trim();
    const resolvedAssetIssuer =
      project.assetIssuer ?? String(payload?.assetIssuer ?? '').trim();

    if (!project.issuedAt || !resolvedSeriesId || !resolvedAssetCode || !resolvedAssetIssuer) {
      throw new Error('Project issuance prerequisites are incomplete');
    }

    this.transitionProject(project, 'live');

    const saved = await this.projectRepo.save(project);
    return await this.serializeProject(saved);
  }

  async approveAndIssueClassic(id: string, notes?: string) {
    return this.approveProject(id, notes);
  }

  async getProjectWalletConfig(id: string) {
    const project = await this.getProjectEntity(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const context = await this.getProjectWalletContext(project);
    const pendingRequest = await this.custodyChangeRequestRepo.findOne({
      where: {
        projectId: Number(project.id),
        participantType: 'project',
        status: In(['pending', 'more_info_required']) as any,
      },
      order: { requestedAt: 'DESC' as any },
    });
    return this.buildProjectWalletConfigResponse({
      project,
      ...context,
      pendingRequest,
    });
  }

  async validateProjectWalletReadiness(id: string) {
    const project = await this.getProjectEntity(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const { profile, spv, legalEntity } = await this.getProjectWalletContext(project);
    const pendingRequest = await this.custodyChangeRequestRepo.findOne({
      where: {
        projectId: Number(project.id),
        participantType: 'project',
        status: In(['pending', 'more_info_required']) as any,
      },
      order: { requestedAt: 'DESC' as any },
    });
    return this.buildProjectCustodyReadiness({
      project,
      profile,
      spv,
      legalEntity,
      pendingRequest,
    });
  }

  async getProjectEntitySpvSummary(id: string) {
    const project = await this.getProjectEntity(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const [legalEntity, spv, spvDetail] = await Promise.all([
      project.sponsorEntityId
        ? this.legalEntityRepo.findOne({ where: { id: Number(project.sponsorEntityId) } })
        : Promise.resolve(null),
      project.spvId
        ? this.spvRepo.findOne({ where: { id: Number(project.spvId) } })
        : Promise.resolve(null),
      project.spvId
        ? this.spvService.getSpvDetail(Number(project.spvId))
        : Promise.resolve(null),
    ]);

    const alignmentIssues: string[] = [];
    if (project.sponsorEntityId && !legalEntity) {
      alignmentIssues.push('Linked sponsor entity could not be found.');
    }
    if (project.spvId && !spv) {
      alignmentIssues.push('Linked SPV could not be found.');
    }
    if (spv?.custodyModel && project.custodyMode && spv.custodyModel !== project.custodyMode) {
      alignmentIssues.push('SPV custody model does not match the project custody mode.');
    }

    return {
      projectId: Number(project.id),
      sponsorEntity: legalEntity
        ? {
            id: legalEntity.id,
            entityName: legalEntity.entityName,
            tradingName: legalEntity.tradingName ?? null,
            status: legalEntity.status,
            jurisdiction: legalEntity.jurisdiction ?? null,
          }
        : null,
      linkedSpv: spvDetail,
      walletAlignment: {
        custodyMode: project.custodyMode ?? null,
        proceedsWalletAddress: this.normalizeWalletAddress(project.proceedsWalletAddress),
        issuerWalletAddress: this.normalizeWalletAddress(project.issuerWalletPublic),
        distributionWalletAddress: this.normalizeWalletAddress(project.distributorWalletPublic),
        matchesStructure:
          alignmentIssues.length === 0 && Boolean(spvDetail?.readiness?.issuanceReady),
        issues: [
          ...alignmentIssues,
          ...(spvDetail?.readiness?.blockingIssues ?? []),
        ],
      },
      readiness: spvDetail?.readiness ?? {
        status: 'blocked',
        requiredRolesComplete: false,
        custodyComplete: false,
        issuanceReady: false,
        blockingIssues: ['No SPV is linked to this project.'],
      },
    };
  }

  async updateProjectEntitySpvLinkage(
    id: string,
    payload: UpdateProjectEntitySpvLinkageDto,
    changedByUserId?: number,
  ) {
    const project = await this.getProjectEntity(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const reason = this.normalizeOptionalText(payload.reason);
    if (!reason) {
      throw new BadRequestException('A reason is required before updating entity or SPV linkage.');
    }

    const nextSponsorEntityId =
      payload.sponsorEntityId !== undefined
        ? this.normalizeOptionalId(payload.sponsorEntityId)
        : this.normalizeOptionalId(project.sponsorEntityId);
    const nextSpvId =
      payload.spvId !== undefined
        ? this.normalizeOptionalId(payload.spvId)
        : this.normalizeOptionalId(project.spvId);

    const [legalEntity, spv] = await Promise.all([
      nextSponsorEntityId
        ? this.legalEntityRepo.findOne({ where: { id: nextSponsorEntityId } })
        : Promise.resolve(null),
      nextSpvId
        ? this.spvRepo.findOne({ where: { id: nextSpvId } })
        : Promise.resolve(null),
    ]);

    if (nextSponsorEntityId && !legalEntity) {
      throw new BadRequestException('Linked sponsor entity could not be found.');
    }

    if (nextSpvId && !spv) {
      throw new BadRequestException('Linked SPV could not be found.');
    }

    if (
      nextSponsorEntityId &&
      spv?.sponsorEntityId &&
      Number(spv.sponsorEntityId) !== Number(nextSponsorEntityId)
    ) {
      throw new BadRequestException(
        'Linked SPV belongs to a different sponsor entity. Choose a matching SPV or update the sponsor entity first.',
      );
    }

    const before = {
      sponsorEntityId: this.normalizeOptionalId(project.sponsorEntityId),
      spvId: this.normalizeOptionalId(project.spvId),
    };

    project.sponsorEntityId = nextSponsorEntityId as any;
    project.spvId = nextSpvId as any;

    const saved = await this.projectRepo.save(project);
    await this.writeAdminAuditLog({
      actorUserId: changedByUserId,
      entityId: Number(saved.id),
      action: 'project_entity_spv_linkage_updated',
      detailsJson: {
        reason,
        before,
        after: {
          sponsorEntityId: saved.sponsorEntityId ?? null,
          spvId: saved.spvId ?? null,
        },
      },
    });
    if (saved.spvId) {
      const spv = await this.spvRepo.findOne({ where: { id: Number(saved.spvId) } });
      if (spv) {
        spv.projectId = Number(saved.id);
        if (saved.sponsorEntityId) {
          spv.sponsorEntityId = Number(saved.sponsorEntityId);
        }
        await this.spvRepo.save(spv);
        await this.spvService.prepareDraftSpvForProject(
          Number(saved.id),
          changedByUserId,
          reason,
        );
      }
    }

    return this.getProjectEntitySpvSummary(String(saved.id));
  }

  async getProjectWalletHistory(id: string) {
    const project = await this.getProjectEntity(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const rows = await this.projectWalletAuditRepo.find({
      where: { projectId: Number(project.id) },
      relations: ['changedByUser'],
      order: { changedAt: 'DESC' as any, id: 'DESC' as any },
    });

    return rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      fieldName: row.fieldName,
      fieldLabel: this.getWalletFieldLabel(row.fieldName as WalletFieldName),
      oldValue: row.oldValue ?? null,
      newValue: row.newValue ?? null,
      reason: row.reason ?? null,
      changeType: row.changeType,
      changedBy: row.changedBy ?? null,
      changedByName:
        this.normalizeOptionalText((row.changedByUser as any)?.fullname) ??
        this.normalizeOptionalText((row.changedByUser as any)?.email) ??
        null,
      changedAt: row.changedAt ? new Date(row.changedAt).toISOString() : null,
    }));
  }

  async updateProjectWalletConfig(
    id: string,
    payload: UpdateProjectWalletConfigDto,
    changedByUserId?: number,
  ) {
    const project = await this.getProjectEntity(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const reason = this.normalizeOptionalText(payload.reason);
    if (!reason) {
      throw new BadRequestException('A reason is required before saving wallet configuration changes.');
    }

    if (this.isWalletConfigLocked(project)) {
      throw new BadRequestException({
        title: 'Wallet configuration locked',
        message:
          'Issued projects cannot overwrite wallet configuration directly. Use the post-issuance change request workflow instead.',
      });
    }

    const { profile } = await this.getProjectWalletContext(project);
    const { changes } = this.resolveWalletFieldChanges(project, payload, profile);

    if (changes.length === 0) {
      throw new BadRequestException('No wallet configuration changes were detected.');
    }

    this.applyWalletFieldChanges(project, payload);
    project.walletLastUpdatedAt = new Date();
    project.walletLastUpdatedBy = (changedByUserId ?? null) as any;

    const { profile: nextProfile, spv, lastUpdatedBy, legalEntity } =
      await this.getProjectWalletContext(project);
    const readiness = this.buildWalletReadiness({
      project,
      profile: nextProfile,
      spv,
      legalEntity,
    });
    const custodyReadiness = this.buildProjectCustodyReadiness({
      project,
      profile: nextProfile,
      spv,
      legalEntity,
      pendingRequest: null,
    });

    if (!readiness.isReady && project.status === 'approved') {
      this.logger.warn(
        `Project ${project.id} wallet configuration saved but is not issuance ready: ${readiness.issues
          .map((issue) => issue.message)
          .join(' | ')}`,
      );
    }

    project.custodySetupStatus = custodyReadiness.setupStatus;
    const saved = await this.projectRepo.save(project);
    await this.createProjectWalletAuditEntries({
      projectId: Number(saved.id),
      changes,
      changedByUserId,
      reason,
      changeType: 'pre_issuance_edit',
    });

    return this.buildProjectWalletConfigResponse({
      project: saved,
      profile: nextProfile,
      spv,
      lastUpdatedBy,
      legalEntity,
    });
  }

  async requestPostIssuanceWalletChange(
    id: string,
    payload: RequestProjectWalletChangeDto,
    changedByUserId?: number,
  ) {
    const project = await this.getProjectEntity(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!this.isWalletConfigLocked(project)) {
      throw new BadRequestException({
        title: 'Project not locked',
        message:
          'Post-issuance wallet change requests are only available after issuance has locked the wallet configuration.',
      });
    }

    const reason = this.normalizeOptionalText(payload.reason);
    if (!reason) {
      throw new BadRequestException('A reason is required for a post-issuance wallet change request.');
    }

    const { profile } = await this.getProjectWalletContext(project);
    const { changes } = this.resolveWalletFieldChanges(project, payload.changes ?? {}, profile);

    if (changes.length === 0) {
      throw new BadRequestException('No wallet configuration changes were detected.');
    }

    const request = this.custodyChangeRequestRepo.create({
      projectId: Number(project.id),
      participantType: 'project',
      participantEntityId: Number(project.id),
      participantLabel: this.normalizeOptionalText(project.name) ?? `Project ${project.id}`,
      currentCustodyMode: this.resolveProjectCustodyMode(project, profile),
      requestedCustodyMode:
        (payload.changes?.custodyMode as CustodyMode | undefined) ??
        this.resolveProjectCustodyMode(project, profile),
      walletAddress:
        this.normalizeWalletAddress(
          payload.changes?.developerWalletAddress ??
            payload.changes?.distributionWalletAddress ??
            project.developerWalletAddress ??
            project.distributorWalletPublic,
        ) ?? null,
      requestedWalletAddress:
        changes.find((change) => change.fieldName === 'developerWalletAddress')
          ?.newValue ??
        changes.find((change) => change.fieldName === 'distributionWalletAddress')
          ?.newValue ??
        null,
      reason,
      status: 'pending',
      requestedBy: changedByUserId ?? null,
      requestPayloadJson: {
        changes,
      },
    });

    const savedRequest = await this.custodyChangeRequestRepo.save(request);

    await this.createProjectWalletAuditEntries({
      projectId: Number(project.id),
      changes,
      changedByUserId,
      reason,
      changeType: 'post_issuance_change_request',
    });

    return {
      projectId: Number(project.id),
      requestId: Number(savedRequest.id),
      requestedAt: new Date().toISOString(),
      requestedBy: changedByUserId ?? null,
      reason,
      changeType: 'post_issuance_change_request',
      requestedChanges: changes.map((change) => ({
        fieldName: change.fieldName,
        fieldLabel: this.getWalletFieldLabel(change.fieldName),
        oldValue: change.oldValue,
        newValue: change.newValue,
      })),
    };
  }

  async getAdminCustodyQueue() {
    const projects = await this.projectRepo.find({
      where: [
        { status: 'under_review' },
        { status: 'changes_requested' },
        { status: 'approved' },
        { status: 'issued' },
        { status: 'live' },
        { status: 'locked' },
      ],
      relations: ['user'],
      order: { updatedAt: 'DESC' as any },
    });

    if (projects.length === 0) {
      return [];
    }

    const projectIds = projects.map((project) => Number(project.id));
    const developerUserIds = projects
      .map((project) => Number(project.user?.id ?? 0))
      .filter((id) => Number.isFinite(id) && id > 0);
    const spvIds = projects
      .map((project) => Number(project.spvId ?? 0))
      .filter((id) => Number.isFinite(id) && id > 0);
    const legalEntityIds = projects
      .map((project) => Number(project.sponsorEntityId ?? 0))
      .filter((id) => Number.isFinite(id) && id > 0);

    const [profiles, spvs, legalEntities, requests, ownerships] = await Promise.all([
      developerUserIds.length
        ? this.developerProfileRepo.find({
            where: { user: { id: In(developerUserIds) } } as any,
            relations: ['user'],
          })
        : Promise.resolve([]),
      spvIds.length
        ? this.spvRepo.find({
            where: { id: In(spvIds) } as any,
          })
        : Promise.resolve([]),
      legalEntityIds.length
        ? this.legalEntityRepo.find({
            where: { id: In(legalEntityIds) } as any,
          })
        : Promise.resolve([]),
      this.custodyChangeRequestRepo.find({
        where: [
          { projectId: In(projectIds) as any },
          { participantUserId: In(developerUserIds) as any, participantType: 'developer' as any },
        ] as any,
        relations: ['requestedByUser', 'decidedByUser'],
        order: { requestedAt: 'DESC' as any, id: 'DESC' as any },
      }),
      this.ownershipRepo.find({
        where: { projectId: In(projectIds) as any } as any,
      }),
    ]);

    const investorUserIds = Array.from(
      new Set(
        ownerships
          .map((ownership) => Number(ownership.userId ?? 0))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
    const investors = investorUserIds.length
      ? await this.userRepo.findBy({ id: In(investorUserIds) as any })
      : [];

    const profileByUserId = new Map(
      profiles.map((profile) => [Number(profile.user?.id), profile]),
    );
    const spvById = new Map(spvs.map((spv) => [Number(spv.id), spv]));
    const legalEntityById = new Map(
      legalEntities.map((entity) => [Number(entity.id), entity]),
    );
    const investorById = new Map(investors.map((investor) => [Number(investor.id), investor]));

    const latestRequestByKey = new Map<string, CustodyChangeRequestEntity>();
    for (const request of requests) {
      const key = `${request.participantType}:${request.projectId ?? 'none'}:${
        request.participantUserId ??
        request.participantDeveloperProfileId ??
        request.participantEntityId ??
        'none'
      }`;
      if (!latestRequestByKey.has(key)) {
        latestRequestByKey.set(key, request);
      }
    }

    const ownershipsByProjectId = new Map<number, OwnershipEntity[]>();
    for (const ownership of ownerships) {
      const bucket = ownershipsByProjectId.get(Number(ownership.projectId)) ?? [];
      bucket.push(ownership);
      ownershipsByProjectId.set(Number(ownership.projectId), bucket);
    }

    const queue: any[] = [];

    for (const project of projects) {
      const profile = profileByUserId.get(Number(project.user?.id ?? 0)) ?? null;
      const spv = spvById.get(Number(project.spvId ?? 0)) ?? null;
      const legalEntity =
        legalEntityById.get(Number(project.sponsorEntityId ?? 0)) ?? null;
      const projectRequest =
        latestRequestByKey.get(`project:${project.id}:${project.id}`) ??
        latestRequestByKey.get(`project:${project.id}:none`) ??
        null;
      const projectReadiness = this.buildProjectCustodyReadiness({
        project,
        profile,
        spv,
        legalEntity,
        pendingRequest: projectRequest,
      });

      queue.push({
        entryType: 'project',
        projectId: Number(project.id),
        participantId: Number(project.id),
        participantType: 'project',
        projectName: this.normalizeOptionalText(project.name) ?? `Project ${project.id}`,
        participantName: this.normalizeOptionalText(project.name) ?? `Project ${project.id}`,
        entityName:
          this.normalizeOptionalText(legalEntity?.entityName) ??
          this.normalizeOptionalText(profile?.legalEntityName) ??
          null,
        custodyMode: projectReadiness.custodyMode,
        walletAddress:
          projectReadiness.walletReadiness.wallets.developerWalletAddress?.value ?? null,
        walletStatus: projectReadiness.walletStatus,
        custodySetupStatus: projectReadiness.setupStatus,
        custodyChangeRequestStatus: projectReadiness.requestedChangeStatus,
        issuanceReadinessImpact:
          projectReadiness.readinessStatus === 'blocked'
            ? 'blocks_issuance'
            : projectReadiness.readinessStatus === 'warning'
              ? 'review_before_issuance'
              : 'ready',
        lastUpdated: new Date(String(project.updatedAt ?? new Date())).toISOString(),
        readiness: projectReadiness,
        requestId: projectRequest?.id ?? null,
      });

      if (profile) {
        const developerRequest =
          latestRequestByKey.get(`developer:none:${project.user?.id}`) ??
          latestRequestByKey.get(`developer:${project.id}:${project.user?.id}`) ??
          null;
        const walletAddress =
          this.normalizeWalletAddress(
            profile.primaryWalletAddress ?? profile.walletAddress ?? null,
          ) ?? null;
        const walletValid = !walletAddress || this.isValidStellarPublicKey(walletAddress);
        const blockingReasons: string[] = [];
        if (profile.custodyMode === 'self_custody' && !walletAddress) {
          blockingReasons.push(
            'Developer self custody requires a valid participant-controlled wallet.',
          );
        }
        if (walletAddress && !walletValid) {
          blockingReasons.push('Developer wallet is not a valid Stellar public key.');
        }
        if (
          developerRequest?.status === 'pending' ||
          developerRequest?.status === 'more_info_required'
        ) {
          blockingReasons.push('Developer custody change request is pending review.');
        }
        queue.push({
          entryType: 'participant',
          projectId: Number(project.id),
          participantId: Number(profile.user?.id ?? profile.id),
          participantType: 'developer',
          projectName: this.normalizeOptionalText(project.name) ?? `Project ${project.id}`,
          participantName:
            this.normalizeOptionalText(profile.tradingName) ??
            this.normalizeOptionalText(profile.legalEntityName) ??
            this.normalizeOptionalText(profile.businessName) ??
            this.normalizeOptionalText(project.user?.fullname) ??
            this.normalizeOptionalText(project.user?.email) ??
            `Developer ${profile.id}`,
          entityName:
            this.normalizeOptionalText(profile.legalEntityName) ??
            this.normalizeOptionalText(profile.businessName) ??
            null,
          custodyMode: profile.custodyMode,
          walletAddress,
          walletStatus: this.getWalletStatusLabel({
            custodyMode: profile.custodyMode,
            walletAddress,
            walletValid,
          }),
          custodySetupStatus:
            developerRequest?.status === 'pending' ||
            developerRequest?.status === 'more_info_required'
              ? 'pending_review'
              : blockingReasons.length > 0
                ? 'incomplete'
                : 'complete',
          custodyChangeRequestStatus: developerRequest?.status ?? 'none',
          issuanceReadinessImpact:
            profile.custodyMode === 'self_custody' && blockingReasons.length > 0
              ? 'blocks_issuance'
              : 'supports_project',
          lastUpdated: new Date(String(profile.updatedAt ?? new Date())).toISOString(),
          readiness: {
            custodyMode: profile.custodyMode,
            setupStatus:
              blockingReasons.length > 0 ? 'incomplete' : 'complete',
            readinessStatus:
              blockingReasons.length > 0 ? 'blocked' : 'ready',
            blockingReasons,
            warnings: [],
            requestedChangeStatus: developerRequest?.status ?? 'none',
          },
          requestId: developerRequest?.id ?? null,
        });
      }

      if (legalEntity) {
        const legalEntityBlockingReasons: string[] = [];
        if (!legalEntity.custodyModel) {
          legalEntityBlockingReasons.push('Legal entity custody model is not set.');
        }
        if (
          legalEntity.custodyModel &&
          legalEntity.custodyModel !== projectReadiness.custodyMode
        ) {
          legalEntityBlockingReasons.push(
            'Legal entity custody model does not match the project custody mode.',
          );
        }
        queue.push({
          entryType: 'participant',
          projectId: Number(project.id),
          participantId: Number(legalEntity.id),
          participantType: 'legal_entity',
          projectName: this.normalizeOptionalText(project.name) ?? `Project ${project.id}`,
          participantName: legalEntity.entityName,
          entityName: legalEntity.entityName,
          custodyMode: legalEntity.custodyModel,
          walletAddress: null,
          walletStatus: legalEntity.custodyModel ? 'configured' : 'missing',
          custodySetupStatus:
            legalEntityBlockingReasons.length > 0 ? 'incomplete' : 'complete',
          custodyChangeRequestStatus: 'none',
          issuanceReadinessImpact:
            legalEntityBlockingReasons.length > 0
              ? 'blocks_issuance'
              : 'supports_project',
          lastUpdated: new Date(
            String(legalEntity.updatedAt ?? new Date()),
          ).toISOString(),
          readiness: {
            custodyMode: legalEntity.custodyModel,
            setupStatus:
              legalEntityBlockingReasons.length > 0 ? 'incomplete' : 'complete',
            readinessStatus:
              legalEntityBlockingReasons.length > 0 ? 'blocked' : 'ready',
            blockingReasons: legalEntityBlockingReasons,
            warnings: [],
            requestedChangeStatus: 'none',
          },
          requestId: null,
        });
      }

      if (spv) {
        const spvBlockingReasons: string[] = [];
        if (!spv.custodyModel) {
          spvBlockingReasons.push('SPV custody model is not set.');
        }
        if (spv.custodyModel && spv.custodyModel !== projectReadiness.custodyMode) {
          spvBlockingReasons.push(
            'SPV custody model does not match the project custody mode.',
          );
        }
        queue.push({
          entryType: 'participant',
          projectId: Number(project.id),
          participantId: Number(spv.id),
          participantType: 'spv',
          projectName: this.normalizeOptionalText(project.name) ?? `Project ${project.id}`,
          participantName: spv.name,
          entityName: spv.legalEntityName ?? null,
          custodyMode: spv.custodyModel,
          walletAddress: null,
          walletStatus: spv.custodyModel ? 'configured' : 'missing',
          custodySetupStatus:
            spvBlockingReasons.length > 0 ? 'incomplete' : 'complete',
          custodyChangeRequestStatus: 'none',
          issuanceReadinessImpact:
            spvBlockingReasons.length > 0 ? 'blocks_issuance' : 'supports_project',
          lastUpdated: new Date(String(spv.updatedAt ?? new Date())).toISOString(),
          readiness: {
            custodyMode: spv.custodyModel,
            setupStatus: spvBlockingReasons.length > 0 ? 'incomplete' : 'complete',
            readinessStatus:
              spvBlockingReasons.length > 0 ? 'blocked' : 'ready',
            blockingReasons: spvBlockingReasons,
            warnings: [],
            requestedChangeStatus: 'none',
          },
          requestId: null,
        });
      }

      const projectOwnerships = ownershipsByProjectId.get(Number(project.id)) ?? [];
      const investorRowsByUserId = new Map<number, OwnershipEntity[]>();
      for (const ownership of projectOwnerships) {
        const investorId = Number(ownership.userId ?? 0);
        if (!Number.isFinite(investorId) || investorId <= 0) continue;
        const bucket = investorRowsByUserId.get(investorId) ?? [];
        bucket.push(ownership);
        investorRowsByUserId.set(investorId, bucket);
      }

      for (const [investorId, investorRows] of investorRowsByUserId.entries()) {
        const investor = investorById.get(investorId);
        const latestOwnership = investorRows.sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )[0];
        const custodyMode = latestOwnership?.custodyType ?? 'self_custody';
        const walletAddress =
          this.normalizeWalletAddress(
            latestOwnership?.walletAddress ?? investor?.walletAddress ?? null,
          ) ?? null;
        const walletValid = !walletAddress || this.isValidStellarPublicKey(walletAddress);
        const blockingReasons: string[] = [];
        if (custodyMode === 'self_custody' && !walletAddress) {
          blockingReasons.push('Investor self custody requires a wallet address.');
        }
        if (walletAddress && !walletValid) {
          blockingReasons.push('Investor wallet is not a valid Stellar public key.');
        }
        queue.push({
          entryType: 'participant',
          projectId: Number(project.id),
          participantId: investorId,
          participantType: 'investor',
          projectName: this.normalizeOptionalText(project.name) ?? `Project ${project.id}`,
          participantName:
            this.normalizeOptionalText(investor?.fullname) ??
            this.normalizeOptionalText(investor?.email) ??
            `Investor ${investorId}`,
          entityName: this.normalizeOptionalText(investor?.email) ?? null,
          custodyMode,
          walletAddress,
          walletStatus: this.getWalletStatusLabel({
            custodyMode,
            walletAddress,
            walletValid,
          }),
          custodySetupStatus:
            blockingReasons.length > 0 ? 'incomplete' : 'complete',
          custodyChangeRequestStatus: 'none',
          issuanceReadinessImpact: 'no_direct_issuance_impact',
          lastUpdated: new Date(
            String(latestOwnership?.updatedAt ?? new Date()),
          ).toISOString(),
          readiness: {
            custodyMode,
            setupStatus: blockingReasons.length > 0 ? 'incomplete' : 'complete',
            readinessStatus:
              blockingReasons.length > 0 ? 'blocked' : 'ready',
            blockingReasons,
            warnings: [],
            requestedChangeStatus: 'none',
          },
          requestId: null,
        });
      }
    }

    return queue;
  }

  async getAdminCustodyDetail(params: {
    projectId: string;
    participantType: CustodyParticipantType;
    participantId: string;
  }) {
    const project = await this.findProjectOrThrow(params.projectId);
    const { profile, spv, legalEntity, lastUpdatedBy } =
      await this.getProjectWalletContext(project);
    const participantId = Number(params.participantId);

    const requests = await this.custodyChangeRequestRepo.find({
      where:
        params.participantType === 'project'
          ? ({ projectId: Number(project.id), participantType: 'project' } as any)
          : params.participantType === 'developer'
            ? ({
                participantType: 'developer',
                participantUserId: participantId,
              } as any)
            : ({ participantType: params.participantType, participantEntityId: participantId } as any),
      relations: ['requestedByUser', 'decidedByUser'],
      order: { requestedAt: 'DESC' as any, id: 'DESC' as any },
    });
    const latestRequest = requests[0] ?? null;

    if (params.participantType === 'project') {
      const readiness = this.buildProjectCustodyReadiness({
        project,
        profile,
        spv,
        legalEntity,
        pendingRequest:
          latestRequest?.status === 'pending' || latestRequest?.status === 'more_info_required'
            ? latestRequest
            : null,
      });
      return {
        projectId: Number(project.id),
        linkedProject: {
          id: Number(project.id),
          name: project.name ?? `Project ${project.id}`,
          issuanceStatus: project.issuanceStatus ?? 'not_started',
        },
        participantType: 'project',
        participantId: Number(project.id),
        participantName: project.name ?? `Project ${project.id}`,
        currentCustodyMode: readiness.custodyMode,
        requestedCustodyMode: latestRequest?.requestedCustodyMode ?? null,
        relatedWalletAddresses: {
          developerWalletAddress:
            readiness.walletReadiness.wallets.developerWalletAddress?.value ?? null,
          issuerWalletAddress:
            readiness.walletReadiness.wallets.issuerWalletAddress?.value ?? null,
          distributionWalletAddress:
            readiness.walletReadiness.wallets.distributionWalletAddress?.value ?? null,
          proceedsWalletAddress:
            readiness.walletReadiness.wallets.proceedsWalletAddress?.value ?? null,
        },
        linkedLegalEntity: legalEntity
          ? {
              id: Number(legalEntity.id),
              name: legalEntity.entityName,
            }
          : null,
        linkedSpv: spv
          ? {
              id: Number(spv.id),
              name: spv.name,
            }
          : null,
        walletVerificationState: readiness.walletVerificationState,
        custodySetupCompleteness: readiness.setupStatus,
        issuanceReadinessImpact:
          readiness.readinessStatus === 'blocked'
            ? 'blocks_issuance'
            : readiness.readinessStatus === 'warning'
              ? 'review_before_issuance'
              : 'ready',
        blockingReasons: readiness.blockingReasons,
        warnings: readiness.warnings,
        requestedChangeStatus: readiness.requestedChangeStatus,
        reasonForCustodyChangeRequest: latestRequest?.reason ?? null,
        whoRequestedChange:
          this.normalizeOptionalText(latestRequest?.requestedByUser?.fullname) ??
          this.normalizeOptionalText(latestRequest?.requestedByUser?.email) ??
          null,
        timestamps: {
          requestedAt: latestRequest?.requestedAt
            ? new Date(latestRequest.requestedAt).toISOString()
            : null,
          decidedAt: latestRequest?.decidedAt
            ? new Date(latestRequest.decidedAt).toISOString()
            : null,
          reviewedAt: readiness.reviewedAt,
          walletLastUpdatedAt: project.walletLastUpdatedAt
            ? new Date(project.walletLastUpdatedAt).toISOString()
            : null,
        },
        relatedNotes: {
          adminNotes: latestRequest?.adminNotes ?? project.adminNotes ?? null,
          custodyBlockReason: project.custodyBlockReason ?? null,
          walletLastUpdatedBy:
            this.normalizeOptionalText(lastUpdatedBy?.fullname) ??
            this.normalizeOptionalText(lastUpdatedBy?.email) ??
            null,
        },
        linkedIssuanceStatus: {
          issuanceStatus: project.issuanceStatus ?? 'not_started',
          issuanceTxHash: project.issuanceTxHash ?? null,
          issuanceBlockedByCustody: Boolean(project.issuanceBlockedByCustody),
        },
        requests: requests.map((request) => ({
          id: Number(request.id),
          status: request.status,
          currentCustodyMode: request.currentCustodyMode,
          requestedCustodyMode: request.requestedCustodyMode,
          reason: request.reason,
          adminNotes: request.adminNotes ?? null,
          requestedAt: new Date(request.requestedAt).toISOString(),
          decidedAt: request.decidedAt ? new Date(request.decidedAt).toISOString() : null,
        })),
      };
    }

    if (params.participantType === 'developer' && profile) {
      const walletAddress =
        this.normalizeWalletAddress(
          profile.primaryWalletAddress ?? profile.walletAddress ?? null,
        ) ?? null;
      const walletValid = !walletAddress || this.isValidStellarPublicKey(walletAddress);
      const blockingReasons =
        profile.custodyMode === 'self_custody' && !walletAddress
          ? ['Developer self custody requires a valid participant-controlled wallet.']
          : walletAddress && !walletValid
            ? ['Developer wallet is not a valid Stellar public key.']
            : [];
      return {
        projectId: Number(project.id),
        linkedProject: {
          id: Number(project.id),
          name: project.name ?? `Project ${project.id}`,
          issuanceStatus: project.issuanceStatus ?? 'not_started',
        },
        participantType: 'developer',
        participantId: Number(profile.user?.id ?? profile.id),
        participantName:
          profile.tradingName ??
          profile.legalEntityName ??
          profile.businessName ??
          project.user?.fullname ??
          project.user?.email ??
          `Developer ${profile.id}`,
        currentCustodyMode: profile.custodyMode,
        requestedCustodyMode: latestRequest?.requestedCustodyMode ?? null,
        relatedWalletAddresses: {
          primaryWalletAddress: walletAddress,
        },
        linkedLegalEntity: profile.legalEntityName
          ? {
              id: Number(legalEntity?.id ?? 0) || null,
              name: profile.legalEntityName,
            }
          : null,
        linkedSpv: spv ? { id: Number(spv.id), name: spv.name } : null,
        walletVerificationState: walletAddress ? (walletValid ? 'verified' : 'invalid') : 'missing',
        custodySetupCompleteness:
          latestRequest?.status === 'pending' ||
          latestRequest?.status === 'more_info_required'
            ? 'pending_review'
            : blockingReasons.length > 0
              ? 'incomplete'
              : 'complete',
        issuanceReadinessImpact:
          blockingReasons.length > 0 ? 'blocks_issuance' : 'supports_project',
        blockingReasons,
        warnings: [],
        requestedChangeStatus: latestRequest?.status ?? 'none',
        reasonForCustodyChangeRequest: latestRequest?.reason ?? null,
        whoRequestedChange:
          this.normalizeOptionalText(latestRequest?.requestedByUser?.fullname) ??
          this.normalizeOptionalText(latestRequest?.requestedByUser?.email) ??
          null,
        timestamps: {
          requestedAt: latestRequest?.requestedAt
            ? new Date(latestRequest.requestedAt).toISOString()
            : null,
          decidedAt: latestRequest?.decidedAt
            ? new Date(latestRequest.decidedAt).toISOString()
            : null,
          reviewedAt: null,
          walletLastUpdatedAt: profile.walletLastUpdatedAt
            ? new Date(profile.walletLastUpdatedAt).toISOString()
            : null,
        },
        relatedNotes: {
          adminNotes: latestRequest?.adminNotes ?? profile.adminNotes ?? null,
          custodyBlockReason: project.custodyBlockReason ?? null,
          walletLastUpdatedBy: null,
        },
        linkedIssuanceStatus: {
          issuanceStatus: project.issuanceStatus ?? 'not_started',
          issuanceTxHash: project.issuanceTxHash ?? null,
          issuanceBlockedByCustody: Boolean(project.issuanceBlockedByCustody),
        },
        requests: requests.map((request) => ({
          id: Number(request.id),
          status: request.status,
          currentCustodyMode: request.currentCustodyMode,
          requestedCustodyMode: request.requestedCustodyMode,
          reason: request.reason,
          adminNotes: request.adminNotes ?? null,
          requestedAt: new Date(request.requestedAt).toISOString(),
          decidedAt: request.decidedAt ? new Date(request.decidedAt).toISOString() : null,
        })),
      };
    }

    if (params.participantType === 'spv' && spv && participantId === Number(spv.id)) {
      const blockingReasons = !spv.custodyModel
        ? ['SPV custody model is not set.']
        : spv.custodyModel !== this.resolveProjectCustodyMode(project, profile)
          ? ['SPV custody model does not match the project custody mode.']
          : [];
      return {
        projectId: Number(project.id),
        linkedProject: {
          id: Number(project.id),
          name: project.name ?? `Project ${project.id}`,
          issuanceStatus: project.issuanceStatus ?? 'not_started',
        },
        participantType: 'spv',
        participantId: Number(spv.id),
        participantName: spv.name,
        currentCustodyMode: spv.custodyModel,
        requestedCustodyMode: null,
        relatedWalletAddresses: {},
        linkedLegalEntity: spv.legalEntityName
          ? { id: Number(legalEntity?.id ?? 0) || null, name: spv.legalEntityName }
          : null,
        linkedSpv: { id: Number(spv.id), name: spv.name },
        walletVerificationState: spv.custodyModel ? 'configured' : 'missing',
        custodySetupCompleteness:
          blockingReasons.length > 0 ? 'incomplete' : 'complete',
        issuanceReadinessImpact:
          blockingReasons.length > 0 ? 'blocks_issuance' : 'supports_project',
        blockingReasons,
        warnings: [],
        requestedChangeStatus: 'none',
        reasonForCustodyChangeRequest: null,
        whoRequestedChange: null,
        timestamps: {
          requestedAt: null,
          decidedAt: null,
          reviewedAt: null,
          walletLastUpdatedAt: null,
        },
        relatedNotes: {
          adminNotes: null,
          custodyBlockReason: project.custodyBlockReason ?? null,
          walletLastUpdatedBy: null,
        },
        linkedIssuanceStatus: {
          issuanceStatus: project.issuanceStatus ?? 'not_started',
          issuanceTxHash: project.issuanceTxHash ?? null,
          issuanceBlockedByCustody: Boolean(project.issuanceBlockedByCustody),
        },
        requests: [],
      };
    }

    if (
      params.participantType === 'legal_entity' &&
      legalEntity &&
      participantId === Number(legalEntity.id)
    ) {
      const blockingReasons = !legalEntity.custodyModel
        ? ['Legal entity custody model is not set.']
        : legalEntity.custodyModel !== this.resolveProjectCustodyMode(project, profile)
          ? ['Legal entity custody model does not match the project custody mode.']
          : [];
      return {
        projectId: Number(project.id),
        linkedProject: {
          id: Number(project.id),
          name: project.name ?? `Project ${project.id}`,
          issuanceStatus: project.issuanceStatus ?? 'not_started',
        },
        participantType: 'legal_entity',
        participantId: Number(legalEntity.id),
        participantName: legalEntity.entityName,
        currentCustodyMode: legalEntity.custodyModel,
        requestedCustodyMode: null,
        relatedWalletAddresses: {},
        linkedLegalEntity: {
          id: Number(legalEntity.id),
          name: legalEntity.entityName,
        },
        linkedSpv: spv ? { id: Number(spv.id), name: spv.name } : null,
        walletVerificationState: legalEntity.custodyModel ? 'configured' : 'missing',
        custodySetupCompleteness:
          blockingReasons.length > 0 ? 'incomplete' : 'complete',
        issuanceReadinessImpact:
          blockingReasons.length > 0 ? 'blocks_issuance' : 'supports_project',
        blockingReasons,
        warnings: [],
        requestedChangeStatus: 'none',
        reasonForCustodyChangeRequest: null,
        whoRequestedChange: null,
        timestamps: {
          requestedAt: null,
          decidedAt: null,
          reviewedAt: null,
          walletLastUpdatedAt: null,
        },
        relatedNotes: {
          adminNotes: null,
          custodyBlockReason: project.custodyBlockReason ?? null,
          walletLastUpdatedBy: null,
        },
        linkedIssuanceStatus: {
          issuanceStatus: project.issuanceStatus ?? 'not_started',
          issuanceTxHash: project.issuanceTxHash ?? null,
          issuanceBlockedByCustody: Boolean(project.issuanceBlockedByCustody),
        },
        requests: [],
      };
    }

    const ownershipRows = await this.ownershipRepo.find({
      where: {
        projectId: Number(project.id),
        userId: participantId,
      } as any,
    });
    const investor = await this.userRepo.findOne({ where: { id: participantId } });
    if (params.participantType === 'investor' && ownershipRows.length > 0 && investor) {
      const latestOwnership = ownershipRows.sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )[0];
      const walletAddress =
        this.normalizeWalletAddress(
          latestOwnership.walletAddress ?? investor.walletAddress ?? null,
        ) ?? null;
      const walletValid = !walletAddress || this.isValidStellarPublicKey(walletAddress);
      const blockingReasons =
        latestOwnership.custodyType === 'self_custody' && !walletAddress
          ? ['Investor self custody requires a wallet address.']
          : walletAddress && !walletValid
            ? ['Investor wallet is not a valid Stellar public key.']
            : [];
      return {
        projectId: Number(project.id),
        linkedProject: {
          id: Number(project.id),
          name: project.name ?? `Project ${project.id}`,
          issuanceStatus: project.issuanceStatus ?? 'not_started',
        },
        participantType: 'investor',
        participantId: Number(investor.id),
        participantName: investor.fullname ?? investor.email ?? `Investor ${investor.id}`,
        currentCustodyMode: latestOwnership.custodyType,
        requestedCustodyMode: null,
        relatedWalletAddresses: {
          investorWalletAddress: walletAddress,
        },
        linkedLegalEntity: null,
        linkedSpv: spv ? { id: Number(spv.id), name: spv.name } : null,
        walletVerificationState: walletAddress ? (walletValid ? 'verified' : 'invalid') : 'missing',
        custodySetupCompleteness:
          blockingReasons.length > 0 ? 'incomplete' : 'complete',
        issuanceReadinessImpact: 'no_direct_issuance_impact',
        blockingReasons,
        warnings: [],
        requestedChangeStatus: 'none',
        reasonForCustodyChangeRequest: null,
        whoRequestedChange: null,
        timestamps: {
          requestedAt: null,
          decidedAt: null,
          reviewedAt: null,
          walletLastUpdatedAt:
            latestOwnership.updatedAt instanceof Date
              ? latestOwnership.updatedAt.toISOString()
              : new Date(latestOwnership.updatedAt).toISOString(),
        },
        relatedNotes: {
          adminNotes: null,
          custodyBlockReason: project.custodyBlockReason ?? null,
          walletLastUpdatedBy: null,
        },
        linkedIssuanceStatus: {
          issuanceStatus: project.issuanceStatus ?? 'not_started',
          issuanceTxHash: project.issuanceTxHash ?? null,
          issuanceBlockedByCustody: Boolean(project.issuanceBlockedByCustody),
        },
        requests: [],
      };
    }

    throw new NotFoundException('Custody detail not found');
  }

  async reviewCustodyChangeRequest(
    requestId: string,
    payload: {
      status: 'approved' | 'rejected' | 'more_info_required';
      adminNotes: string;
      reason?: string;
    },
    decidedByUserId?: number,
  ) {
    const request = await this.custodyChangeRequestRepo.findOne({
      where: { id: Number(requestId) },
      relations: ['participantDeveloperProfile', 'project'],
    });

    if (!request) {
      throw new NotFoundException('Custody change request not found');
    }

    if (request.status !== 'pending' && request.status !== 'more_info_required') {
      throw new BadRequestException('This custody change request has already been decided.');
    }

    request.status = payload.status;
    request.adminDecision = payload.status;
    request.adminNotes = this.normalizeOptionalText(payload.adminNotes) ?? payload.adminNotes;
    request.decidedBy = decidedByUserId ?? null;
    request.decidedAt = new Date();

    if (payload.status === 'approved') {
      if (request.participantType === 'developer' && request.participantDeveloperProfileId) {
        const profile = await this.developerProfileRepo.findOne({
          where: { id: Number(request.participantDeveloperProfileId) },
          relations: ['user'],
        });
        if (profile) {
          profile.custodyMode = request.requestedCustodyMode;
          profile.custodyChangeStatus = 'approved';
          profile.custodyChangeRequestedMode = null as any;
          profile.custodyChangeRequestedAt = null as any;
          profile.walletLastUpdatedAt = new Date();
          await this.developerProfileRepo.save(profile);
        }
      }

      if (request.participantType === 'project' && request.projectId) {
        const project = await this.findProjectOrThrow(String(request.projectId));
        const payloadJson = (request.requestPayloadJson ?? {}) as Record<string, any>;
        const changes = Array.isArray(payloadJson.changes) ? payloadJson.changes : [];
        if (this.isWalletConfigLocked(project)) {
          request.requestPayloadJson = {
            ...payloadJson,
            approvedForOperationalExecution: true,
            approvedAt: new Date().toISOString(),
            approvedBy: decidedByUserId ?? null,
            approvedChanges: changes,
          };
        } else {
          const updatePayload: Partial<UpdateProjectWalletConfigDto> = {
            reason:
              this.normalizeOptionalText(payload.reason) ??
              this.normalizeOptionalText(payload.adminNotes) ??
              'Approved custody change request',
          };

          for (const change of changes) {
            if (change.fieldName && change.newValue !== undefined) {
              (updatePayload as any)[change.fieldName] = change.newValue;
            }
          }

          if (request.requestedCustodyMode) {
            updatePayload.custodyMode = request.requestedCustodyMode;
          }

          if (project.issuanceBlockedByCustody) {
            project.issuanceBlockedByCustody = false;
            project.custodyBlockReason = null as any;
          }

          await this.updateProjectWalletConfig(
            String(project.id),
            updatePayload as UpdateProjectWalletConfigDto,
            decidedByUserId,
          );
        }
      }
    }

    if (payload.status === 'rejected' && request.participantType === 'developer') {
      const profile = await this.developerProfileRepo.findOne({
        where: { id: Number(request.participantDeveloperProfileId ?? 0) },
      });
      if (profile) {
        profile.custodyChangeStatus = 'rejected';
        await this.developerProfileRepo.save(profile);
      }
    }

    if (payload.status === 'more_info_required' && request.participantType === 'developer') {
      const profile = await this.developerProfileRepo.findOne({
        where: { id: Number(request.participantDeveloperProfileId ?? 0) },
      });
      if (profile) {
        profile.custodyChangeStatus = 'pending_review';
        await this.developerProfileRepo.save(profile);
      }
    }

    const saved = await this.custodyChangeRequestRepo.save(request);
    await this.writeAdminAuditLog({
      actorUserId: decidedByUserId,
      entityId: Number(saved.projectId ?? saved.id),
      action:
        payload.status === 'approved'
          ? 'custody_change_approved'
          : payload.status === 'rejected'
            ? 'custody_change_rejected'
            : 'custody_change_more_info_required',
      detailsJson: {
        requestId: Number(saved.id),
        participantType: saved.participantType,
        participantLabel: saved.participantLabel ?? null,
        oldValue: saved.currentCustodyMode,
        newValue: saved.requestedCustodyMode,
        reason: saved.reason,
        adminNotes: saved.adminNotes ?? null,
      },
    });

    return {
      id: Number(saved.id),
      status: saved.status,
      adminNotes: saved.adminNotes ?? null,
      decidedAt: saved.decidedAt ? new Date(saved.decidedAt).toISOString() : null,
    };
  }

  async markProjectCustodyReviewed(
    projectId: string,
    adminNotes?: string,
    reviewedByUserId?: number,
  ) {
    const project = await this.findProjectOrThrow(projectId);
    const { profile, spv, legalEntity } = await this.getProjectWalletContext(project);
    const pendingRequest = await this.custodyChangeRequestRepo.findOne({
      where: {
        projectId: Number(project.id),
        participantType: 'project',
        status: In(['pending', 'more_info_required']) as any,
      },
      order: { requestedAt: 'DESC' as any },
    });
    const readiness = this.buildProjectCustodyReadiness({
      project,
      profile,
      spv,
      legalEntity,
      pendingRequest,
    });

    project.custodyReviewedAt = new Date();
    project.custodyReviewedBy = reviewedByUserId ?? null;
    project.custodySetupStatus =
      readiness.readinessStatus === 'blocked' ? 'incomplete' : 'reviewed';
    if (this.normalizeOptionalText(adminNotes)) {
      project.adminNotes = adminNotes;
    }

    const saved = await this.projectRepo.save(project);
    await this.writeAdminAuditLog({
      actorUserId: reviewedByUserId,
      entityId: Number(saved.id),
      action: 'custody_setup_marked_reviewed',
      detailsJson: {
        setupStatus: saved.custodySetupStatus ?? null,
        readinessStatus: readiness.readinessStatus,
        reason: adminNotes ?? null,
      },
    });

    return this.getProjectWalletConfig(String(saved.id));
  }

  async blockProjectIssuanceForCustody(
    projectId: string,
    reason: string | undefined,
    adminNotes: string | undefined,
    changedByUserId?: number,
  ) {
    const project = await this.findProjectOrThrow(projectId);
    const normalizedReason =
      this.normalizeOptionalText(reason) ??
      this.normalizeOptionalText(adminNotes) ??
      'Custody prerequisites are not satisfied.';

    project.issuanceBlockedByCustody = true;
    project.custodyBlockReason = normalizedReason;
    project.custodySetupStatus = 'blocked';
    if (this.normalizeOptionalText(adminNotes)) {
      project.adminNotes = adminNotes;
    }

    const saved = await this.projectRepo.save(project);
    await this.writeAdminAuditLog({
      actorUserId: changedByUserId,
      entityId: Number(saved.id),
      action: 'issuance_blocked_due_to_custody',
      detailsJson: {
        oldValue: false,
        newValue: true,
        reason: normalizedReason,
      },
    });

    return this.getProjectWalletConfig(String(saved.id));
  }

  async clearProjectCustodyIssuanceBlock(
    projectId: string,
    adminNotes: string | undefined,
    changedByUserId?: number,
  ) {
    const project = await this.findProjectOrThrow(projectId);
    const { profile, spv, legalEntity } = await this.getProjectWalletContext(project);
    const pendingRequest = await this.custodyChangeRequestRepo.findOne({
      where: {
        projectId: Number(project.id),
        participantType: 'project',
        status: In(['pending', 'more_info_required']) as any,
      },
      order: { requestedAt: 'DESC' as any },
    });
    const readiness = this.buildProjectCustodyReadiness({
      project: {
        ...project,
        issuanceBlockedByCustody: false,
        custodyBlockReason: null as any,
      } as ProjectEntity,
      profile,
      spv,
      legalEntity,
      pendingRequest,
    });

    if (readiness.readinessStatus === 'blocked') {
      throw new BadRequestException({
        title: 'Custody setup still incomplete',
        message: readiness.blockingReasons.join(' '),
        details: readiness,
      });
    }

    project.issuanceBlockedByCustody = false;
    project.custodyBlockReason = null as any;
    project.custodySetupStatus = project.custodyReviewedAt ? 'reviewed' : 'complete';
    if (this.normalizeOptionalText(adminNotes)) {
      project.adminNotes = adminNotes;
    }

    const saved = await this.projectRepo.save(project);
    await this.writeAdminAuditLog({
      actorUserId: changedByUserId,
      entityId: Number(saved.id),
      action: 'custody_issuance_block_cleared',
      detailsJson: {
        oldValue: true,
        newValue: false,
        reason: adminNotes ?? null,
      },
    });

    return this.getProjectWalletConfig(String(saved.id));
  }

  async lockProject(id: string, reason?: string) {
    const project = await this.getProjectEntity(id);
    if (!project) throw new Error('Project not found');

    if (project.status === 'locked') {
      throw new Error('Project is already locked');
    }

    this.transitionProject(project, 'locked', reason);

    const saved = await this.projectRepo.save(project);
    return await this.serializeProject(saved);
  }

  async softDeleteProject(id: string, userId: number, isAdmin = false) {
    const project = await this.getProjectEntity(id);

    if (!project) {
      throw new Error('Project not found');
    }

    this.assertCanEditProject(project, userId, isAdmin);

    if (project.status !== 'draft') {
      throw new Error('Only draft projects can be deleted');
    }

    project.deletedAt = new Date().toISOString() as any;

    const saved = await this.projectRepo.save(project);
    return await this.serializeProject(saved);
  }
}
