import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DeveloperProfileEntity } from '../../infrastructure/persistence/entities/developer-profile.entity';
import { UserEntity } from '../../../iam/user/infrastructure/persistence/entities/user.entity';
import { NotificationService } from '../../../notification/application/service/notification.service';
import { NotificationType } from '../../../notification/infrastructure/persistence/entities/notification.entity';
import { UpdateDeveloperCompanyDetailsDto } from '../dto/update-developer-company-details.dto';
import { UpdateDeveloperWalletSettingsDto } from '../dto/update-developer-wallet-settings.dto';
import { RequestCustodyModeChangeDto } from '../dto/request-custody-mode-change.dto';
import { ProjectEntity } from '../../../project/infrastructure/persistence/entities/project.entity';
import { SpvEntity } from '../../../spv/infrastructure/persistence/entities/spv.entity';
import { SeriesEntity } from '../../../spv/infrastructure/persistence/entities/series.entity';
import { CustodyChangeRequestEntity } from '../../../project/infrastructure/persistence/entities/custody-change-request.entity';
import { AuditLogEntity } from '../../../project/infrastructure/persistence/entities/audit-log.entity';

@Injectable()
export class DeveloperProfileService {
  constructor(
    @InjectRepository(DeveloperProfileEntity)
    private readonly repo: Repository<DeveloperProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(SpvEntity)
    private readonly spvRepo: Repository<SpvEntity>,
    @InjectRepository(SeriesEntity)
    private readonly seriesRepo: Repository<SeriesEntity>,
    @InjectRepository(CustodyChangeRequestEntity)
    private readonly custodyChangeRequestRepo: Repository<CustodyChangeRequestEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,

    private readonly notificationService: NotificationService,
  ) {}

  private normalizeOptionalText(value: unknown) {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private async writeAuditLog(params: {
    actorUserId?: number | null;
    entityType: string;
    entityId: number;
    action: string;
    detailsJson?: Record<string, unknown> | null;
  }) {
    const row = this.auditLogRepo.create({
      actor: params.actorUserId ? ({ id: params.actorUserId } as any) : null,
      actorRole: 'developer',
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      detailsJson: params.detailsJson ?? null,
    } as any);

    await this.auditLogRepo.save(row);
  }

  private async getOrCreateProfile(userId: number) {
    let profile = await this.repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (profile) {
      return profile;
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    profile = this.repo.create({
      user,
      custodyMode: 'self_custody',
      custodyChangeStatus: 'none',
    });

    return this.repo.save(profile);
  }

  private buildCompanyDetails(profile: DeveloperProfileEntity) {
    const payload = profile.payloadJson ?? {};

    return {
      legalEntityName:
        profile.legalEntityName ?? profile.businessName ?? payload.businessName ?? null,
      tradingName:
        profile.tradingName ?? profile.businessName ?? payload.businessName ?? null,
      abn: profile.abn ?? null,
      acn: profile.acn ?? null,
      contactName:
        profile.contactName ??
        profile.representativeFullName ??
        payload.representativeFullName ??
        null,
      contactEmail:
        profile.contactEmail ??
        profile.representativeEmail ??
        payload.representativeEmail ??
        null,
      phone:
        profile.phone ??
        profile.representativePhone ??
        payload.representativePhone ??
        null,
      website: profile.website ?? null,
      registeredAddress:
        profile.registeredAddress ??
        profile.registeredOfficeAddress ??
        payload.registeredOfficeAddress ??
        null,
      businessDescription:
        profile.businessDescription ??
        (typeof payload.businessDescription === 'string'
          ? payload.businessDescription
          : null),
      verificationStatus: profile.status ?? 'draft',
      submittedAt: profile.submittedAt ?? null,
      approvedAt: profile.approvedAt ?? null,
      rejectedAt: profile.rejectedAt ?? null,
      adminNotes: profile.adminNotes ?? null,
    };
  }

  private buildWalletSettings(
    profile: DeveloperProfileEntity,
    hasLiveProjects: boolean,
    liveProjectCount: number,
  ) {
    const effectiveWallet =
      profile.primaryWalletAddress ?? profile.walletAddress ?? null;

    return {
      custodyMode: profile.custodyMode ?? 'self_custody',
      primaryWalletAddress: effectiveWallet,
      walletStatus: effectiveWallet ? 'configured' : 'not_configured',
      walletConnectionState: effectiveWallet ? 'connected' : 'disconnected',
      walletLabel: profile.walletLabel ?? null,
      lastUpdatedAt:
        profile.walletLastUpdatedAt ??
        profile.walletConnectedAt ??
        profile.updatedAt ??
        null,
      walletConnectedAt: profile.walletConnectedAt ?? null,
      custodyChangeStatus: profile.custodyChangeStatus ?? 'none',
      custodyChangeRequestedAt: profile.custodyChangeRequestedAt ?? null,
      requestedCustodyMode: profile.custodyChangeRequestedMode ?? null,
      requiresComplianceReview: true,
      hasExistingLiveProjects: hasLiveProjects,
      liveProjectCount,
      explanatoryCopy: {
        selfCustody:
          'Self custody means assets are held in the developer-controlled wallet.',
        regenxCustody:
          'RegenX custody means assets are managed under RegenX custody arrangements.',
        warning:
          'Changing wallet or custody may affect issuance or settlement and may require review.',
      },
    };
  }

  async getMine(userId: number) {
    return this.repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  private keepExistingIfBlank(nextValue: unknown, currentValue?: string) {
    if (typeof nextValue !== 'string') return currentValue ?? '';
    const trimmed = nextValue.trim();
    return trimmed.length > 0 ? trimmed : currentValue ?? '';
  }

  async createOrUpdate(userId: number, payload: any) {
    let profile = await this.getOrCreateProfile(userId);

    profile.businessName = this.keepExistingIfBlank(
      payload.businessName,
      profile.businessName,
    );

    profile.abn = this.keepExistingIfBlank(
      payload.abn,
      profile.abn,
    );

    profile.representativeFullName = this.keepExistingIfBlank(
      payload.representativeFullName,
      profile.representativeFullName,
    );

    profile.representativeEmail = this.keepExistingIfBlank(
      payload.representativeEmail,
      profile.representativeEmail,
    );

    profile.complianceContactName = this.keepExistingIfBlank(
      payload.complianceContactName,
      profile.complianceContactName,
    );

    // notes can legitimately be blank, so allow explicit empty string here
    if (typeof payload.complianceNotes === 'string') {
      profile.complianceNotes = payload.complianceNotes;
    }

    profile.walletAddress = this.keepExistingIfBlank(
      payload.walletAddress,
      profile.walletAddress,
    );

    if (typeof payload.platformAgreementAccepted === 'boolean') {
      profile.platformAgreementAccepted = payload.platformAgreementAccepted;
    }

    profile.payloadJson = {
      ...(profile.payloadJson ?? {}),
      ...(payload ?? {}),
    };

    return this.repo.save(profile);
  }

  async getSettingsSummary(userId: number) {
    const profile = await this.getOrCreateProfile(userId);
    const projects = await this.projectRepo.find({
      where: { user: { id: userId } },
      order: { updatedAt: 'DESC' as any },
    });
    const liveStatuses = new Set(['approved', 'issued', 'live']);
    const relevantProjects = projects.filter((project) =>
      liveStatuses.has(project.status ?? ''),
    );

    return {
      companyDetails: this.buildCompanyDetails(profile),
      wallet: this.buildWalletSettings(
        profile,
        relevantProjects.length > 0,
        relevantProjects.length,
      ),
      entityLinkage: await this.getEntityLinkageSummary(userId, projects),
    };
  }

  async updateCompanyDetails(
    userId: number,
    payload: UpdateDeveloperCompanyDetailsDto,
  ) {
    const profile = await this.getOrCreateProfile(userId);

    profile.legalEntityName = this.normalizeOptionalText(payload.legalEntityName);
    profile.tradingName = this.normalizeOptionalText(payload.tradingName);
    profile.abn = this.normalizeOptionalText(payload.abn);
    profile.acn = this.normalizeOptionalText(payload.acn);
    profile.contactName = this.normalizeOptionalText(payload.contactName);
    profile.contactEmail = this.normalizeOptionalText(payload.contactEmail);
    profile.phone = this.normalizeOptionalText(payload.phone);
    profile.website = this.normalizeOptionalText(payload.website);
    profile.registeredAddress = this.normalizeOptionalText(payload.registeredAddress);
    profile.businessDescription = this.normalizeOptionalText(
      payload.businessDescription,
    );

    profile.businessName = profile.tradingName ?? profile.legalEntityName;
    profile.representativeFullName = profile.contactName;
    profile.representativeEmail = profile.contactEmail;
    profile.representativePhone = profile.phone;
    profile.registeredOfficeAddress = profile.registeredAddress;

    profile.payloadJson = {
      ...(profile.payloadJson ?? {}),
      legalEntityName: profile.legalEntityName,
      tradingName: profile.tradingName,
      acn: profile.acn,
      website: profile.website,
      registeredAddress: profile.registeredAddress,
      businessDescription: profile.businessDescription,
      contactName: profile.contactName,
      contactEmail: profile.contactEmail,
      phone: profile.phone,
    };

    const saved = await this.repo.save(profile);
    return this.buildCompanyDetails(saved);
  }

  async getWalletSettings(userId: number) {
    const profile = await this.getOrCreateProfile(userId);
    const projects = await this.projectRepo.find({
      where: { user: { id: userId } },
    });
    const liveProjectCount = projects.filter((project) =>
      ['approved', 'issued', 'live'].includes(project.status ?? ''),
    ).length;

    return this.buildWalletSettings(profile, liveProjectCount > 0, liveProjectCount);
  }

  async updateWalletSettings(
    userId: number,
    payload: UpdateDeveloperWalletSettingsDto,
  ) {
    const profile = await this.getOrCreateProfile(userId);
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const normalizedWallet = payload.walletAddress.trim();

    const existingUser = await this.userRepo.findOne({
      where: { walletAddress: normalizedWallet },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error(`Wallet ${normalizedWallet} is already connected to another user`);
    }

    profile.primaryWalletAddress = normalizedWallet;
    profile.walletAddress = normalizedWallet;
    profile.walletLabel = this.normalizeOptionalText(payload.walletLabel);

    const now = new Date();
    profile.walletConnectedAt = profile.walletConnectedAt ?? now;
    profile.walletLastUpdatedAt = now;

    user.walletAddress = normalizedWallet;

    await this.userRepo.save(user);
    const saved = await this.repo.save(profile);

    const projects = await this.projectRepo.find({
      where: { user: { id: userId } },
    });
    const liveProjectCount = projects.filter((project) =>
      ['approved', 'issued', 'live'].includes(project.status ?? ''),
    ).length;

    return this.buildWalletSettings(saved, liveProjectCount > 0, liveProjectCount);
  }

  async requestCustodyModeChange(
    userId: number,
    payload: RequestCustodyModeChangeDto,
  ) {
    const profile = await this.getOrCreateProfile(userId);
    const reason =
      this.normalizeOptionalText(payload.reason) ??
      'Requested from developer settings.';

    if (profile.custodyMode === payload.requestedMode) {
      return {
        currentMode: profile.custodyMode,
        requestedMode: profile.custodyMode,
        status: profile.custodyChangeStatus ?? 'none',
        requestedAt: profile.custodyChangeRequestedAt ?? null,
        requiresReview: true,
      };
    }

    profile.custodyChangeStatus = 'pending_review';
    profile.custodyChangeRequestedAt = new Date();
    profile.custodyChangeRequestedMode = payload.requestedMode;
    const saved = await this.repo.save(profile);

    const request = this.custodyChangeRequestRepo.create({
      projectId: null,
      participantType: 'developer',
      participantUserId: Number(profile.user.id),
      participantDeveloperProfileId: Number(profile.id),
      participantLabel:
        saved.tradingName ??
        saved.legalEntityName ??
        saved.businessName ??
        saved.user?.fullname ??
        saved.user?.email ??
        `Developer ${saved.id}`,
      currentCustodyMode: saved.custodyMode,
      requestedCustodyMode: payload.requestedMode,
      walletAddress: saved.primaryWalletAddress ?? saved.walletAddress ?? null,
      requestedWalletAddress: saved.primaryWalletAddress ?? saved.walletAddress ?? null,
      reason,
      status: 'pending',
      requestedBy: userId,
      requestPayloadJson: {
        source: 'developer_settings',
      },
    });

    const persistedRequest = await this.custodyChangeRequestRepo.save(request);
    await this.writeAuditLog({
      actorUserId: userId,
      entityType: 'CustodyChangeRequest',
      entityId: Number(persistedRequest.id),
      action: 'custody_change_requested',
      detailsJson: {
        participantType: 'developer',
        developerProfileId: Number(saved.id),
        currentMode: saved.custodyMode,
        requestedMode: payload.requestedMode,
        walletAddress: saved.primaryWalletAddress ?? saved.walletAddress ?? null,
        reason,
      },
    });

    return {
      currentMode: saved.custodyMode,
      requestedMode: saved.custodyChangeRequestedMode,
      status: saved.custodyChangeStatus,
      requestedAt: saved.custodyChangeRequestedAt,
      requiresReview: true,
      requestId: persistedRequest.id,
    };
  }

  async getEntityLinkageSummary(
    userId: number,
    existingProjects?: ProjectEntity[],
  ) {
    const profile = await this.getOrCreateProfile(userId);
    const projects =
      existingProjects ??
      (await this.projectRepo.find({
        where: { user: { id: userId } },
        order: { updatedAt: 'DESC' as any },
      }));

    const spvIds = Array.from(
      new Set(projects.map((project) => project.spvId).filter(Boolean) as number[]),
    );
    const seriesIds = Array.from(
      new Set(
        projects.map((project) => project.seriesId).filter(Boolean) as number[],
      ),
    );

    const spvs = spvIds.length
      ? await this.spvRepo.findBy(spvIds.map((id) => ({ id })))
      : [];
    const series = seriesIds.length
      ? await this.seriesRepo.findBy(seriesIds.map((id) => ({ id })))
      : [];

    const spvById = new Map(spvs.map((item) => [item.id, item]));
    const seriesById = new Map(series.map((item) => [item.id, item]));

    const relatedProjects = projects.map((project) => {
      const linkedSpv = project.spvId ? spvById.get(project.spvId) : null;
      const linkedSeries = project.seriesId ? seriesById.get(project.seriesId) : null;

      return {
        projectId: project.id,
        projectName: project.name ?? `Project ${project.id}`,
        projectStatus: project.status ?? 'draft',
        entityRole: project.entityType ?? 'Operating entity',
        linkedEntityName:
          profile.legalEntityName ??
          profile.businessName ??
          project.entityType ??
          'Not yet linked',
        linkedSpvName:
          linkedSpv?.name ?? project.spvName ?? project.spvId ?? 'Not yet linked',
        linkedSpvStatus: linkedSeries?.status ?? 'Not yet linked',
      };
    });

    const firstProjectWithSpv = projects.find((project) => project.spvId || project.spvName);
    const linkedSpv = firstProjectWithSpv?.spvId
      ? spvById.get(firstProjectWithSpv.spvId)
      : null;
    const linkedSeries = firstProjectWithSpv?.seriesId
      ? seriesById.get(firstProjectWithSpv.seriesId)
      : null;

    return {
      primaryLegalEntity:
        profile.legalEntityName ?? profile.businessName ?? 'Not yet linked',
      operatingEntity:
        profile.tradingName ??
        profile.businessName ??
        profile.legalEntityName ??
        'Not yet linked',
      linkedSpvName:
        linkedSpv?.name ?? firstProjectWithSpv?.spvName ?? 'Not yet linked',
      linkedSpvStatus: linkedSeries?.status ?? 'Not yet linked',
      offeringRole: firstProjectWithSpv?.entityType ?? 'Not yet linked',
      relatedProjects,
    };
  }

  async submit(userId: number) {
    const profile = await this.repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      throw new Error('Developer profile not found');
    }

    profile.status = 'completed';
    profile.submittedAt = new Date();

    return this.repo.save(profile);
  }

  async getAllForAdmin() {
    return this.repo.find({
      order: { updatedAt: 'DESC' as any },
    });
  }

  async updateStatus(id: number, status: string, adminNotes?: string) {
    const profile = await this.repo.findOne({
      where: { id } as any,
      relations: ['user'],
    });

    if (!profile) {
      throw new Error('Developer profile not found');
    }

    (profile as any).status = status;

    if ('adminNotes' in (profile as any)) {
      (profile as any).adminNotes = adminNotes ?? (profile as any).adminNotes;
    }

    if (status === 'approved' && 'approvedAt' in (profile as any)) {
      (profile as any).approvedAt = new Date();
    }

    if (status === 'changes_requested' && 'rejectedAt' in (profile as any)) {
      (profile as any).rejectedAt = new Date();
    }

    if ('lastReviewedAt' in (profile as any)) {
      (profile as any).lastReviewedAt = new Date();
    }

    const saved = await this.repo.save(profile);

    if (status === 'approved' && saved.user?.id) {
      await this.notificationService.createNotification(
        Number(saved.user.id),
        NotificationType.ACCOUNT_APPROVED,
        'Developer account approved',
        'Your climate developer profile has been approved.',
        'developer_profile',
        Number(saved.id),
      );
    }

    return saved;
  }
}
