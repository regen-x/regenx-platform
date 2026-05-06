import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';

import { DeveloperProfileEntity } from '../../developer-profile/infrastructure/persistence/entities/developer-profile.entity';
import { LegalEntityEntity } from '../../legal-entity/infrastructure/persistence/entities/legal-entity.entity';
import { AuditLogEntity } from '../../project/infrastructure/persistence/entities/audit-log.entity';
import { ProjectEntity } from '../../project/infrastructure/persistence/entities/project.entity';
import { SeriesEntity } from '../infrastructure/persistence/entities/series.entity';
import { SpvEntityRoleEntity } from '../infrastructure/persistence/entities/spv-entity-role.entity';
import { SpvEntity } from '../infrastructure/persistence/entities/spv.entity';
import { UpsertSpvRoleDto } from './dto/upsert-spv-role.dto';
import { UpsertSpvDto } from './dto/upsert-spv.dto';

type SpvRoleKey =
  | 'developer'
  | 'sponsor'
  | 'trustee'
  | 'responsible_entity'
  | 'operator'
  | 'issuer'
  | 'custodian'
  | 'custody_provider'
  | 'proceeds_recipient';

type SpvRoleStatus = 'suggested' | 'linked' | 'approved' | 'rejected';
type SpvRoleSource = 'auto' | 'manual';
type SpvReadinessStatus = 'ready' | 'blocked';

type RoleRequirementGroup = {
  key: string;
  label: string;
  acceptedRoles: SpvRoleKey[];
};

type IssuancePipelineState = 'not_prepared' | 'in_progress' | 'blocked' | 'ready';

type IssuancePipelineRow = {
  projectId: number;
  projectName: string | null;
  projectStatus: string | null;
  projectStage: string | null;
  jurisdiction: string | null;
  spvId: number | null;
  spvName: string | null;
  spvStatus: string | null;
  structureType: string | null;
  linkedPartyProgress: {
    linkedRequiredRoles: number;
    totalRequiredRoles: number;
  };
  custodyComplete: boolean;
  issuanceReady: boolean;
  blockerCount: number;
  blockers: string[];
  sponsorEntityName: string | null;
  readinessState: IssuancePipelineState;
};

const KNOWN_ROLE_LABELS: Record<SpvRoleKey, string> = {
  developer: 'Developer',
  sponsor: 'Sponsor',
  trustee: 'Trustee',
  responsible_entity: 'Responsible Entity',
  operator: 'Operator',
  issuer: 'Issuer',
  custodian: 'Custodian',
  custody_provider: 'Custody Provider',
  proceeds_recipient: 'Proceeds Recipient',
};

const DEFAULT_SPV_ROLES: SpvRoleKey[] = ['sponsor', 'issuer', 'trustee', 'custodian'];

@Injectable()
export class SpvService {
  constructor(
    @InjectRepository(SpvEntity)
    private readonly spvRepo: Repository<SpvEntity>,

    @InjectRepository(SeriesEntity)
    private readonly seriesRepo: Repository<SeriesEntity>,

    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,

    @InjectRepository(LegalEntityEntity)
    private readonly legalEntityRepo: Repository<LegalEntityEntity>,

    @InjectRepository(DeveloperProfileEntity)
    private readonly developerProfileRepo: Repository<DeveloperProfileEntity>,

    @InjectRepository(SpvEntityRoleEntity)
    private readonly spvRoleRepo: Repository<SpvEntityRoleEntity>,

    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,
  ) {}

  private normalizeOptionalText(value?: string | null) {
    const normalized = String(value ?? '').trim();
    return normalized || null;
  }

  private normalizeOptionalId(value?: number | string | null) {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  private normalizeRole(value?: string | null): SpvRoleKey {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (normalized in KNOWN_ROLE_LABELS) {
      return normalized as SpvRoleKey;
    }

    throw new BadRequestException(`Unsupported SPV role: ${value}`);
  }

  private normalizeConfidenceScore(value?: number | string | null) {
    const numeric = Number(value ?? NaN);
    if (!Number.isFinite(numeric)) return null;
    return Math.max(0, Math.min(1, numeric)).toFixed(2);
  }

  private async writeAuditLog(params: {
    actorUserId?: number | null;
    entityId: number;
    action: string;
    detailsJson?: Record<string, unknown>;
  }) {
    const row = this.auditLogRepo.create({
      actor: params.actorUserId ? ({ id: params.actorUserId } as any) : null,
      actorRole: 'admin',
      entityType: 'Spv',
      entityId: params.entityId,
      action: params.action,
      detailsJson: params.detailsJson ?? null,
    } as any);

    await this.auditLogRepo.save(row);
  }

  private async assertSponsorEntityExists(id?: number | null) {
    if (!id) return null;
    const entity = await this.legalEntityRepo.findOne({ where: { id } });
    if (!entity) {
      throw new BadRequestException('Linked sponsor entity could not be found');
    }

    return entity;
  }

  private async findSpvOrThrow(id: number) {
    const spv = await this.spvRepo.findOne({ where: { id } });
    if (!spv) {
      throw new NotFoundException('SPV not found');
    }
    return spv;
  }

  private async findProjectOrThrow(projectId: number) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['user'],
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private getStructureType(project?: ProjectEntity | null, spv?: SpvEntity | null) {
    return (
      this.normalizeOptionalText(spv?.structureType) ??
      this.normalizeOptionalText((project?.payloadJson as any)?.structureType) ??
      this.normalizeOptionalText(project?.dseType) ??
      'MIS'
    );
  }

  private getRequiredRoleGroups(
    structureType?: string | null,
    custodyModel?: 'self_custody' | 'regenx_custody' | null,
  ): RoleRequirementGroup[] {
    const normalized = String(structureType ?? '').trim().toLowerCase();
    const groups: RoleRequirementGroup[] = normalized.includes('mis')
      ? [
          {
            key: 'legal_controller',
            label: 'Trustee / Responsible Entity',
            acceptedRoles: ['trustee', 'responsible_entity'],
          },
          {
            key: 'originator',
            label: 'Developer / Sponsor',
            acceptedRoles: ['developer', 'sponsor'],
          },
          {
            key: 'issuer',
            label: 'Issuer',
            acceptedRoles: ['issuer'],
          },
          {
            key: 'proceeds',
            label: 'Proceeds Recipient',
            acceptedRoles: ['proceeds_recipient'],
          },
        ]
      : [
          {
            key: 'developer',
            label: 'Developer',
            acceptedRoles: ['developer'],
          },
          {
            key: 'sponsor',
            label: 'Sponsor',
            acceptedRoles: ['sponsor'],
          },
          {
            key: 'issuer',
            label: 'Issuer',
            acceptedRoles: ['issuer'],
          },
          {
            key: 'proceeds',
            label: 'Proceeds Recipient',
            acceptedRoles: ['proceeds_recipient'],
          },
        ];

    if (custodyModel === 'regenx_custody') {
      groups.push({
        key: 'custody_provider',
        label: 'Custody Provider',
        acceptedRoles: ['custody_provider', 'custodian'],
      });
    }

    return groups;
  }

  private isPipelineRelevantProject(project: ProjectEntity) {
    const status = String(project.status ?? '').trim().toLowerCase();
    const issuanceStatus = String(project.issuanceStatus ?? '').trim().toLowerCase();

    return (
      ['approved', 'issued', 'live'].includes(status) ||
      Boolean(this.normalizeOptionalId(project.spvId)) ||
      ['pending', 'completed', 'failed'].includes(issuanceStatus)
    );
  }

  private async getRoleRows(spvId: number) {
    return this.spvRoleRepo.find({
      where: { spvId } as any,
      relations: ['entity'],
      order: {
        isPrimary: 'DESC' as any,
        updatedAt: 'DESC' as any,
        id: 'DESC' as any,
      },
    });
  }

  private async ensureDefaultRoleRows(params: {
    spvId: number;
    sponsorEntityId?: number | null;
    actorUserId?: number | null;
  }) {
    const existingRows = await this.spvRoleRepo.find({
      where: { spvId: params.spvId } as any,
      order: { updatedAt: 'DESC' as any, id: 'DESC' as any },
    });
    const existingRoles = new Set(
      existingRows.map((row) => this.normalizeRole(row.role)),
    );

    const rowsToInsert = DEFAULT_SPV_ROLES.filter((role) => !existingRoles.has(role)).map(
      (role) =>
        this.spvRoleRepo.create({
          spvId: params.spvId,
          entityId: role === 'sponsor' ? params.sponsorEntityId ?? null : null,
          role,
          status:
            role === 'sponsor' && params.sponsorEntityId ? 'linked' : 'suggested',
          source: 'auto',
          isRequired: true,
          isPrimary: true,
          approvedAt: null,
          approvedBy: null,
          notes:
            role === 'sponsor' && params.sponsorEntityId
              ? 'Auto-linked from project sponsor entity.'
              : 'Default SPV role created during SPV setup.',
        }),
    );

    if (rowsToInsert.length === 0) {
      return existingRows;
    }

    for (const row of rowsToInsert) {
      await this.spvRoleRepo.save(row);
    }

    await this.writeAuditLog({
      actorUserId: params.actorUserId,
      entityId: params.spvId,
      action: 'spv_default_roles_created',
      detailsJson: {
        roles: rowsToInsert.map((row) => row.role),
      },
    });

    return this.getRoleRows(params.spvId);
  }

  private getCurrentAssignments(rows: SpvEntityRoleEntity[]) {
    const assignments = new Map<SpvRoleKey, SpvEntityRoleEntity>();
    for (const row of rows) {
      const role = row.role as SpvRoleKey;
      if (!assignments.has(role) && row.isPrimary && row.status !== 'rejected') {
        assignments.set(role, row);
      }
    }
    return assignments;
  }

  private getEntityCompletenessIssues(entity?: LegalEntityEntity | null) {
    if (!entity) return ['No legal entity linked.'];

    const issues: string[] = [];
    if (!this.normalizeOptionalText(entity.entityName)) {
      issues.push('Legal entity name is missing.');
    }
    if (!this.normalizeOptionalText(entity.jurisdiction)) {
      issues.push('Legal entity jurisdiction is missing.');
    }
    if (entity.status === 'draft' || entity.status === 'inactive' || entity.status === 'archived') {
      issues.push(`Legal entity status is ${entity.status}.`);
    }
    return issues;
  }

  private getMatchingAssignment(
    group: RoleRequirementGroup,
    assignments: Map<SpvRoleKey, SpvEntityRoleEntity>,
  ) {
    return group.acceptedRoles
      .map((role) => assignments.get(role))
      .find(Boolean);
  }

  private buildPipelineLinkedParties(params: {
    project: ProjectEntity;
    spv: SpvEntity | null;
    roleRows: SpvEntityRoleEntity[];
  }) {
    const structureType = params.spv?.structureType ?? this.getStructureType(params.project, null);
    const custodyModel =
      params.spv?.custodyModel ?? ((params.project.custodyMode as any) ?? null);
    const groups = this.getRequiredRoleGroups(structureType, custodyModel);
    const assignments = this.getCurrentAssignments(params.roleRows);

    return groups.map((group) => {
      const row = this.getMatchingAssignment(group, assignments);
      const roleKey = row?.role ? this.normalizeRole(row.role) : group.acceptedRoles[0];

      return {
        key: group.key,
        label: group.label,
        role: roleKey,
        acceptedRoles: group.acceptedRoles,
        isRequired: true,
        entityId: row?.entityId ?? null,
        entityName: row?.entity?.entityName ?? null,
        entityStatus: row?.entity?.status ?? null,
        roleLinkId: row?.id ?? null,
        status: row?.status ?? 'missing',
        source: row?.source ?? null,
        confidenceScore: row?.confidenceScore != null ? Number(row.confidenceScore) : null,
        notes: row?.notes ?? null,
        approvedAt: row?.approvedAt ? new Date(row.approvedAt).toISOString() : null,
      };
    });
  }

  private analyzeIssuancePipeline(params: {
    project: ProjectEntity;
    spv: SpvEntity | null;
    sponsorEntity: LegalEntityEntity | null;
    roleRows: SpvEntityRoleEntity[];
  }) {
    const { project, spv, sponsorEntity, roleRows } = params;
    const structureType = spv?.structureType ?? this.getStructureType(project, null);
    const custodyModel = spv?.custodyModel ?? ((project.custodyMode as any) ?? null);
    const groups = this.getRequiredRoleGroups(structureType, custodyModel);
    const assignments = this.getCurrentAssignments(roleRows);
    const blockers: string[] = [];
    let linkedRequiredRoles = 0;

    if (!spv) {
      blockers.push('SPV not prepared.');
    } else if (!['ready', 'active'].includes(String(spv.status ?? '').toLowerCase())) {
      blockers.push(`SPV status is ${spv.status ?? 'draft'}.`);
    }

    if (!sponsorEntity) {
      blockers.push('Sponsor entity not linked.');
    }

    for (const group of groups) {
      const row = this.getMatchingAssignment(group, assignments);

      if (!row) {
        blockers.push(`Missing required linked party role: ${group.label}.`);
        continue;
      }

      if (row.status !== 'approved') {
        blockers.push(`Unapproved linked party suggestion for ${group.label}.`);
        continue;
      }

      const completenessIssues = this.getEntityCompletenessIssues(row.entity);
      if (completenessIssues.length > 0) {
        blockers.push(`${group.label}: ${completenessIssues.join(' ')}`);
        continue;
      }

      linkedRequiredRoles += 1;
    }

    if (!project.custodyMode) {
      blockers.push('Custody incomplete: custody mode is not configured.');
    }

    if (
      project.custodySetupStatus &&
      ['not_started', 'incomplete', 'pending_review', 'blocked'].includes(
        String(project.custodySetupStatus),
      )
    ) {
      blockers.push(
        project.custodyBlockReason
          ? `Custody incomplete: ${project.custodyBlockReason}`
          : 'Custody incomplete.',
      );
    }

    if (project.issuanceBlockedByCustody) {
      blockers.push(
        project.custodyBlockReason
          ? `Issuance blocked by custody: ${project.custodyBlockReason}`
          : 'Issuance blocked by custody.',
      );
    }

    const uniqueBlockers = Array.from(new Set(blockers));
    const isCustodyConfigurationBlocker = (blocker: string) => {
      const normalized = blocker.toLowerCase();
      return (
        normalized.startsWith('custody incomplete') ||
        normalized.startsWith('issuance blocked by custody')
      );
    };
    const issuanceReady = uniqueBlockers.length === 0;
    const custodyComplete = !uniqueBlockers.some(isCustodyConfigurationBlocker);
    const hasHardBlocker = uniqueBlockers.some((blocker) => {
      const normalized = blocker.toLowerCase();
      return (
        isCustodyConfigurationBlocker(blocker) ||
        normalized.includes('sponsor entity not linked') ||
        normalized.includes('unapproved linked party suggestion')
      );
    });

    const readinessState: IssuancePipelineState = !spv
      ? 'not_prepared'
      : issuanceReady
        ? 'ready'
        : hasHardBlocker
          ? 'blocked'
          : 'in_progress';

    return {
      structureType,
      groups,
      linkedRequiredRoles,
      custodyComplete,
      issuanceReady,
      blockers: uniqueBlockers,
      readinessState,
    };
  }

  private async findLinkedSpvForProject(project: ProjectEntity) {
    const projectSpvId = this.normalizeOptionalId(project.spvId);

    if (projectSpvId) {
      return this.spvRepo.findOne({ where: { id: projectSpvId } });
    }

    return this.spvRepo.findOne({
      where: { projectId: Number(project.id) },
      order: { updatedAt: 'DESC' as any, id: 'DESC' as any },
    });
  }

  private async buildIssuancePipelineDetail(project: ProjectEntity) {
    const spv = await this.findLinkedSpvForProject(project);
    const [sponsorEntity, roleRows] = await Promise.all([
      project.sponsorEntityId
        ? this.legalEntityRepo.findOne({ where: { id: Number(project.sponsorEntityId) } })
        : spv?.sponsorEntityId
          ? this.legalEntityRepo.findOne({ where: { id: Number(spv.sponsorEntityId) } })
          : Promise.resolve(null),
      spv ? this.getRoleRows(spv.id) : Promise.resolve([]),
    ]);

    const analysis = this.analyzeIssuancePipeline({
      project,
      spv,
      sponsorEntity,
      roleRows,
    });

    const row: IssuancePipelineRow = {
      projectId: Number(project.id),
      projectName: this.normalizeOptionalText(project.name),
      projectStatus: this.normalizeOptionalText(project.status),
      projectStage: this.normalizeOptionalText(project.stage) ?? this.normalizeOptionalText(project.status),
      jurisdiction:
        this.normalizeOptionalText(project.jurisdiction) ??
        this.normalizeOptionalText(spv?.jurisdiction),
      spvId: spv?.id ?? null,
      spvName: this.normalizeOptionalText(spv?.name),
      spvStatus: this.normalizeOptionalText(spv?.status),
      structureType: analysis.structureType,
      linkedPartyProgress: {
        linkedRequiredRoles: analysis.linkedRequiredRoles,
        totalRequiredRoles: analysis.groups.length,
      },
      custodyComplete: analysis.custodyComplete,
      issuanceReady: analysis.issuanceReady,
      blockerCount: analysis.blockers.length,
      blockers: analysis.blockers,
      sponsorEntityName:
        this.normalizeOptionalText(sponsorEntity?.entityName) ??
        this.normalizeOptionalText(spv?.legalEntityName),
      readinessState: analysis.readinessState,
    };

    return {
      ...row,
      project: {
        id: Number(project.id),
        name: this.normalizeOptionalText(project.name),
        status: this.normalizeOptionalText(project.status),
        stage: this.normalizeOptionalText(project.stage),
        jurisdiction: this.normalizeOptionalText(project.jurisdiction),
        custodyMode: project.custodyMode ?? null,
        issuanceStatus: this.normalizeOptionalText(project.issuanceStatus) ?? 'not_started',
        sponsorEntityId: this.normalizeOptionalId(project.sponsorEntityId),
      },
      spv: spv
        ? {
            id: spv.id,
            name: spv.name,
            status: spv.status,
            jurisdiction: spv.jurisdiction ?? null,
            structureType: spv.structureType ?? null,
            sponsorEntityId: spv.sponsorEntityId ?? null,
            custodyModel: spv.custodyModel ?? null,
            projectId: spv.projectId ?? null,
          }
        : null,
      linkedParties: this.buildPipelineLinkedParties({
        project,
        spv,
        roleRows,
      }),
      readiness: {
        linkedRequiredRoles: analysis.linkedRequiredRoles,
        totalRequiredRoles: analysis.groups.length,
        requiredRolesComplete:
          analysis.linkedRequiredRoles === analysis.groups.length && analysis.groups.length > 0,
        custodyComplete: analysis.custodyComplete,
        issuanceReady: analysis.issuanceReady,
        blockers: analysis.blockers,
        readinessState: analysis.readinessState,
      },
    };
  }

  private buildReadiness(params: {
    spv: SpvEntity;
    project: ProjectEntity | null;
    roleRows: SpvEntityRoleEntity[];
  }) {
    const { spv, project, roleRows } = params;
    const currentAssignments = this.getCurrentAssignments(roleRows);
    const groups = this.getRequiredRoleGroups(spv.structureType, spv.custodyModel);
    const blockers: string[] = [];

    for (const group of groups) {
      const matchingRow = group.acceptedRoles
        .map((role) => currentAssignments.get(role))
        .find(Boolean);

      if (!matchingRow || matchingRow.status !== 'approved') {
        blockers.push(`${group.label} must be linked and approved.`);
        continue;
      }

      const completenessIssues = this.getEntityCompletenessIssues(matchingRow.entity);
      if (completenessIssues.length > 0) {
        blockers.push(`${group.label}: ${completenessIssues.join(' ')}`);
      }
    }

    if (project) {
      if (!project.custodyMode) {
        blockers.push('Custody mode is not configured for the linked project.');
      }

      if (
        project.custodySetupStatus &&
        ['not_started', 'incomplete', 'pending_review', 'blocked'].includes(
          String(project.custodySetupStatus),
        )
      ) {
        blockers.push(
          project.custodyBlockReason
            ? `Custody incomplete: ${project.custodyBlockReason}`
            : 'Custody setup is incomplete.',
        );
      }

      if (project.issuanceBlockedByCustody) {
        blockers.push(
          project.custodyBlockReason
            ? `Issuance blocked by custody: ${project.custodyBlockReason}`
            : 'Issuance is blocked by custody controls.',
        );
      }
    } else {
      blockers.push('SPV is not linked to a project.');
    }

    return {
      status: (blockers.length === 0 ? 'ready' : 'blocked') as SpvReadinessStatus,
      requiredRolesComplete: blockers.every(
        (blocker) =>
          !blocker.includes('must be linked and approved') &&
          !blocker.includes('Legal entity'),
      ),
      custodyComplete: !blockers.some((blocker) => blocker.toLowerCase().includes('custody')),
      issuanceReady: blockers.length === 0,
      blockingIssues: blockers,
      requiredRoleGroups: groups.map((group) => ({
        key: group.key,
        label: group.label,
        acceptedRoles: group.acceptedRoles,
      })),
    };
  }

  private buildLinkedParties(params: {
    spv: SpvEntity;
    roleRows: SpvEntityRoleEntity[];
    project: ProjectEntity | null;
  }) {
    const groups = this.getRequiredRoleGroups(params.spv.structureType, params.spv.custodyModel);
    const currentAssignments = this.getCurrentAssignments(params.roleRows);

    return groups.map((group) => {
      const row = group.acceptedRoles
        .map((role) => currentAssignments.get(role))
        .find(Boolean);
      const roleKey = row?.role ? this.normalizeRole(row.role) : group.acceptedRoles[0];
      const status = row?.status ?? 'missing';

      return {
        key: group.key,
        label: group.label,
        role: roleKey,
        acceptedRoles: group.acceptedRoles,
        isRequired: true,
        entityId: row?.entityId ?? null,
        entityName: row?.entity?.entityName ?? null,
        entityStatus: row?.entity?.status ?? null,
        roleLinkId: row?.id ?? null,
        status,
        source: row?.source ?? null,
        confidenceScore:
          row?.confidenceScore != null ? Number(row.confidenceScore) : null,
        notes: row?.notes ?? null,
        approvedAt: row?.approvedAt ? new Date(row.approvedAt).toISOString() : null,
      };
    });
  }

  private async buildSpvPayload(spv: SpvEntity) {
    const [project, sponsorEntity, roleRows] = await Promise.all([
      spv.projectId ? this.projectRepo.findOne({ where: { id: spv.projectId } }) : Promise.resolve(null),
      spv.sponsorEntityId
        ? this.legalEntityRepo.findOne({ where: { id: spv.sponsorEntityId } })
        : Promise.resolve(null),
      this.getRoleRows(spv.id),
    ]);

    const readiness = this.buildReadiness({ spv, project, roleRows });

    return {
      id: spv.id,
      name: spv.name,
      legalEntityName: spv.legalEntityName ?? null,
      jurisdiction: spv.jurisdiction ?? null,
      structureType: spv.structureType ?? null,
      status: spv.status ?? 'draft',
      notes: spv.notes ?? null,
      sponsorEntityId: spv.sponsorEntityId ?? null,
      sponsorEntityName: sponsorEntity?.entityName ?? null,
      custodyModel: spv.custodyModel ?? null,
      projectId: spv.projectId ?? null,
      linkedProjectName: project?.name ?? null,
      createdAt: spv.createdAt,
      updatedAt: spv.updatedAt ?? null,
      readiness,
      linkedParties: this.buildLinkedParties({ spv, roleRows, project }),
      roleCoverage: {
        approved: roleRows.filter((row) => row.isPrimary && row.status === 'approved').length,
        suggested: roleRows.filter((row) => row.isPrimary && row.status === 'suggested').length,
        missing: readiness.requiredRoleGroups.filter((group) =>
          readiness.blockingIssues.some((issue) => issue.includes(group.label)),
        ).length,
      },
    };
  }

  private pickBestRoleMatch(params: {
    role: SpvRoleKey;
    entities: LegalEntityEntity[];
    project: ProjectEntity;
    profile: DeveloperProfileEntity | null;
    sponsorEntity: LegalEntityEntity | null;
  }) {
    const { role, entities, project, profile, sponsorEntity } = params;
    const jurisdiction = this.normalizeOptionalText(project.jurisdiction)?.toLowerCase();
    const projectName = this.normalizeOptionalText(project.name)?.toLowerCase() ?? '';
    const profileNames = [
      this.normalizeOptionalText(profile?.legalEntityName)?.toLowerCase(),
      this.normalizeOptionalText((profile as any)?.businessName)?.toLowerCase(),
      this.normalizeOptionalText(profile?.tradingName)?.toLowerCase(),
    ].filter(Boolean) as string[];

    const scoreEntity = (entity: LegalEntityEntity) => {
      let score = 0;
      const entityName = this.normalizeOptionalText(entity.entityName)?.toLowerCase() ?? '';
      const operationalRole =
        this.normalizeOptionalText(entity.operationalRole)?.toLowerCase() ?? '';
      const entityType = this.normalizeOptionalText(entity.entityType)?.toLowerCase() ?? '';
      const entityJurisdiction =
        this.normalizeOptionalText(entity.jurisdiction)?.toLowerCase() ?? '';

      if (jurisdiction && entityJurisdiction && jurisdiction === entityJurisdiction) score += 0.15;
      if (entity.status === 'active') score += 0.15;

      if (role === 'sponsor' && sponsorEntity && sponsorEntity.id === entity.id) score += 0.7;
      if (role === 'developer' && profileNames.some((name) => entityName.includes(name))) score += 0.7;
      if (role === 'developer' && operationalRole.includes('developer')) score += 0.45;
      if (role === 'sponsor' && operationalRole.includes('sponsor')) score += 0.45;
      if (role === 'trustee' && (operationalRole.includes('trustee') || entityType.includes('trust'))) score += 0.6;
      if (role === 'responsible_entity' && operationalRole.includes('responsible')) score += 0.6;
      if (role === 'operator' && operationalRole.includes('operator')) score += 0.55;
      if (role === 'issuer' && operationalRole.includes('issuer')) score += 0.55;
      if (role === 'custody_provider' && operationalRole.includes('custody')) score += 0.7;
      if (role === 'custody_provider' && entityName.includes('regenx')) score += 0.45;
      if (role === 'proceeds_recipient' && (operationalRole.includes('proceeds') || operationalRole.includes('treasury'))) score += 0.6;

      if ((role === 'issuer' || role === 'proceeds_recipient') && sponsorEntity?.id === entity.id) {
        score += 0.35;
      }
      if ((role === 'operator' || role === 'proceeds_recipient') && profileNames.some((name) => entityName.includes(name))) {
        score += 0.35;
      }
      if (projectName && entityName && projectName.includes(entityName)) score += 0.1;

      return score;
    };

    const ranked = entities
      .map((entity) => ({ entity, score: scoreEntity(entity) }))
      .filter((row) => row.score >= 0.4)
      .sort((left, right) => right.score - left.score);

    return ranked[0] ?? null;
  }

  private async ensureRoleSuggestions(params: {
    spv: SpvEntity;
    project: ProjectEntity;
    actorUserId?: number | null;
  }) {
    const [rows, profile, entities, sponsorEntity] = await Promise.all([
      this.getRoleRows(params.spv.id),
      params.project.user?.id
        ? this.developerProfileRepo.findOne({
            where: { user: { id: Number(params.project.user.id) } } as any,
            relations: ['user'],
          })
        : Promise.resolve(null),
      this.legalEntityRepo.find({
        order: { updatedAt: 'DESC' as any, id: 'DESC' as any },
      }),
      params.project.sponsorEntityId
        ? this.legalEntityRepo.findOne({ where: { id: Number(params.project.sponsorEntityId) } })
        : Promise.resolve(null),
    ]);

    const currentAssignments = this.getCurrentAssignments(rows);
    const groups = this.getRequiredRoleGroups(params.spv.structureType, params.spv.custodyModel);

    for (const group of groups) {
      const fulfilled = group.acceptedRoles.some((role) => {
        const row = currentAssignments.get(role);
        return Boolean(row && row.status !== 'rejected');
      });
      if (fulfilled) continue;

      for (const role of group.acceptedRoles) {
        const match = this.pickBestRoleMatch({
          role,
          entities,
          project: params.project,
          profile,
          sponsorEntity,
        });
        if (!match) continue;

        const entity = match.entity;
        const row = this.spvRoleRepo.create({
          spvId: params.spv.id,
          entityId: entity.id,
          role,
          status: 'suggested',
          source: 'auto',
          isRequired: true,
          isPrimary: true,
          confidenceScore: this.normalizeConfidenceScore(match.score),
          notes: `Suggested from project owner, structure, jurisdiction, and existing project linkage.`,
        });

        await this.spvRoleRepo.save(row);
        break;
      }
    }

    const currentSponsor = currentAssignments.get('sponsor');
    if (!currentSponsor && sponsorEntity) {
      await this.spvRoleRepo.save(
        this.spvRoleRepo.create({
          spvId: params.spv.id,
          entityId: sponsorEntity.id,
          role: 'sponsor',
          status: 'suggested',
          source: 'auto',
          isRequired: true,
          isPrimary: true,
          confidenceScore: '0.95',
          notes: 'Suggested from project sponsor linkage.',
        }),
      );
    }

    await this.writeAuditLog({
      actorUserId: params.actorUserId,
      entityId: params.spv.id,
      action: 'spv_role_suggestions_generated',
      detailsJson: {
        projectId: params.project.id,
      },
    });
  }

  async listSpvs() {
    const rows = await this.spvRepo.find({
      order: { updatedAt: 'DESC' as any, id: 'DESC' as any },
    });

    return Promise.all(rows.map((row) => this.buildSpvPayload(row)));
  }

  async getSpvDetail(id: number) {
    const spv = await this.findSpvOrThrow(id);
    return this.buildSpvPayload(spv);
  }

  async listIssuancePipeline() {
    const projects = await this.projectRepo.find({
      order: { updatedAt: 'DESC' as any, id: 'DESC' as any },
    });

    const relevantProjects = projects.filter((project) =>
      this.isPipelineRelevantProject(project),
    );
    const rows = await Promise.all(
      relevantProjects.map((project) => this.buildIssuancePipelineDetail(project)),
    );

    return rows.map(({ project, spv, linkedParties, readiness, ...row }) => row);
  }

  async getIssuancePipelineSummary() {
    const rows = await this.listIssuancePipeline();

    return {
      total: rows.length,
      notPrepared: rows.filter((row) => row.readinessState === 'not_prepared').length,
      inProgress: rows.filter((row) => row.readinessState === 'in_progress').length,
      blocked: rows.filter((row) => row.readinessState === 'blocked').length,
      ready: rows.filter((row) => row.readinessState === 'ready').length,
    };
  }

  async getIssuancePipelineDetailByProject(projectId: number) {
    const project = await this.findProjectOrThrow(projectId);
    return this.buildIssuancePipelineDetail(project);
  }

  async getIssuancePipelineDetailBySpv(spvId: number) {
    const spv = await this.findSpvOrThrow(spvId);
    const project = spv.projectId
      ? await this.findProjectOrThrow(spv.projectId)
      : null;

    if (!project) {
      throw new BadRequestException('SPV is not linked to a project.');
    }

    return this.buildIssuancePipelineDetail(project);
  }

  async createSpv(payload: UpsertSpvDto & { projectId?: number | null }, actorUserId?: number) {
    const name = this.normalizeOptionalText(payload.name);
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const sponsor = await this.assertSponsorEntityExists(payload.sponsorEntityId);
    const projectId = this.normalizeOptionalId((payload as any).projectId);
    const spv = this.spvRepo.create({
      name,
      legalEntityName:
        this.normalizeOptionalText(payload.legalEntityName) ??
        sponsor?.entityName ??
        null,
      jurisdiction: this.normalizeOptionalText(payload.jurisdiction),
      structureType: this.normalizeOptionalText(payload.structureType) ?? 'MIS',
      status: payload.status ?? 'draft',
      notes: this.normalizeOptionalText(payload.notes),
      sponsorEntityId: payload.sponsorEntityId ?? null,
      custodyModel: payload.custodyModel ?? null,
      projectId,
    });

    const saved = await this.spvRepo.save(spv);
    await this.ensureDefaultRoleRows({
      spvId: saved.id,
      sponsorEntityId: saved.sponsorEntityId,
      actorUserId,
    });
    if (projectId) {
      const project = await this.findProjectOrThrow(projectId);
      project.spvId = saved.id as any;
      if (saved.sponsorEntityId) {
        project.sponsorEntityId = saved.sponsorEntityId as any;
      }
      await this.projectRepo.save(project);
      await this.ensureRoleSuggestions({ spv: saved, project, actorUserId });
    }

    await this.writeAuditLog({
      actorUserId,
      entityId: saved.id,
      action: 'spv_created',
      detailsJson: {
        reason: this.normalizeOptionalText(payload.reason),
        name: saved.name,
        sponsorEntityId: saved.sponsorEntityId,
        projectId: saved.projectId,
      },
    });

    return this.buildSpvPayload(saved);
  }

  async updateSpv(id: number, payload: UpsertSpvDto & { projectId?: number | null }, actorUserId?: number) {
    const spv = await this.findSpvOrThrow(id);
    const before = await this.buildSpvPayload(spv);
    const sponsor =
      payload.sponsorEntityId !== undefined
        ? await this.assertSponsorEntityExists(payload.sponsorEntityId)
        : spv.sponsorEntityId
          ? await this.legalEntityRepo.findOne({ where: { id: spv.sponsorEntityId } })
          : null;

    spv.name = this.normalizeOptionalText(payload.name) ?? spv.name;
    spv.legalEntityName =
      this.normalizeOptionalText(payload.legalEntityName) ??
      sponsor?.entityName ??
      spv.legalEntityName ??
      null;
    spv.jurisdiction = this.normalizeOptionalText(payload.jurisdiction);
    spv.structureType = this.normalizeOptionalText(payload.structureType) ?? spv.structureType;
    spv.notes = this.normalizeOptionalText(payload.notes);
    spv.sponsorEntityId =
      payload.sponsorEntityId !== undefined ? payload.sponsorEntityId ?? null : spv.sponsorEntityId;
    spv.custodyModel = payload.custodyModel ?? null;
    spv.projectId =
      (payload as any).projectId !== undefined
        ? this.normalizeOptionalId((payload as any).projectId)
        : spv.projectId;

    if (payload.status === 'ready') {
      const project = spv.projectId ? await this.findProjectOrThrow(spv.projectId) : null;
      const readiness = this.buildReadiness({
        spv,
        project,
        roleRows: await this.getRoleRows(spv.id),
      });
      if (!readiness.issuanceReady) {
        throw new BadRequestException(
          `SPV cannot move to Ready until blockers are resolved: ${readiness.blockingIssues.join(' ')}`,
        );
      }
    }

    spv.status = payload.status ?? spv.status;
    const saved = await this.spvRepo.save(spv);

    if (saved.projectId) {
      const project = await this.findProjectOrThrow(saved.projectId);
      project.spvId = saved.id as any;
      if (saved.sponsorEntityId) {
        project.sponsorEntityId = saved.sponsorEntityId as any;
      }
      await this.projectRepo.save(project);
    }

    await this.writeAuditLog({
      actorUserId,
      entityId: saved.id,
      action: 'spv_updated',
      detailsJson: {
        reason: this.normalizeOptionalText(payload.reason),
        before,
        after: await this.buildSpvPayload(saved),
      },
    });

    return this.buildSpvPayload(saved);
  }

  async prepareDraftSpvForProject(
    projectId: number,
    actorUserId?: number,
    reason?: string | null,
  ) {
    const project = await this.findProjectOrThrow(projectId);
    if (String(project.status ?? 'draft') === 'draft') {
      throw new BadRequestException(
        'Draft projects cannot enter issuance preparation. Approve the project or move it into issuance prep first.',
      );
    }

    const existingSpv = project.spvId
      ? await this.spvRepo.findOne({ where: { id: Number(project.spvId) } })
      : await this.spvRepo.findOne({ where: { projectId: Number(project.id) } });

    const sponsorEntity = project.sponsorEntityId
      ? await this.legalEntityRepo.findOne({ where: { id: Number(project.sponsorEntityId) } })
      : null;

    const spv =
      existingSpv ??
      this.spvRepo.create({
        name: `${this.normalizeOptionalText(project.name) ?? `Project ${project.id}`} SPV`,
        legalEntityName:
          sponsorEntity?.entityName ??
          `${this.normalizeOptionalText(project.name) ?? `Project ${project.id}`} SPV`,
        jurisdiction: this.normalizeOptionalText(project.jurisdiction) ?? 'Australia',
        structureType: this.getStructureType(project, null),
        status: 'draft',
        notes: null,
        sponsorEntityId: sponsorEntity?.id ?? null,
        custodyModel: (project.custodyMode as any) ?? null,
        projectId: Number(project.id),
      });

    const savedSpv = await this.spvRepo.save(spv);
    await this.ensureDefaultRoleRows({
      spvId: savedSpv.id,
      sponsorEntityId: savedSpv.sponsorEntityId,
      actorUserId,
    });
    project.spvId = savedSpv.id as any;
    if (savedSpv.sponsorEntityId) {
      project.sponsorEntityId = savedSpv.sponsorEntityId as any;
    }
    await this.projectRepo.save(project);

    await this.ensureRoleSuggestions({
      spv: savedSpv,
      project,
      actorUserId,
    });

    await this.writeAuditLog({
      actorUserId,
      entityId: savedSpv.id,
      action: existingSpv ? 'spv_issuance_prep_refreshed' : 'spv_issuance_prep_created',
      detailsJson: {
        projectId,
        reason: this.normalizeOptionalText(reason) ?? 'Prepare for issuance',
      },
    });

    return this.buildSpvPayload(savedSpv);
  }

  async upsertSpvRole(spvId: number, payload: UpsertSpvRoleDto, actorUserId?: number) {
    const spv = await this.findSpvOrThrow(spvId);
    const role = this.normalizeRole(payload.role);
    const entityId = this.normalizeOptionalId(payload.entityId);
    const entity = entityId
      ? await this.legalEntityRepo.findOne({ where: { id: entityId } })
      : null;

    if (entityId && !entity) {
      throw new BadRequestException('Linked entity could not be found.');
    }

    const existingRows = await this.spvRoleRepo.find({
      where: { spvId, role } as any,
      order: { updatedAt: 'DESC' as any, id: 'DESC' as any },
    });
    for (const row of existingRows) {
      if (row.isPrimary) {
        row.isPrimary = false;
        await this.spvRoleRepo.save(row);
      }
    }

    const row = this.spvRoleRepo.create({
      spvId,
      entityId,
      role,
      status: payload.status ?? (payload.source === 'manual' ? 'approved' : 'linked'),
      source: payload.source ?? 'manual',
      isRequired: payload.isRequired ?? true,
      isPrimary: payload.isPrimary ?? true,
      confidenceScore: this.normalizeConfidenceScore(payload.confidenceScore),
      approvedAt:
        (payload.status ?? (payload.source === 'manual' ? 'approved' : 'linked')) === 'approved'
          ? new Date()
          : null,
      approvedBy:
        (payload.status ?? (payload.source === 'manual' ? 'approved' : 'linked')) === 'approved'
          ? actorUserId ?? null
          : null,
      notes: this.normalizeOptionalText(payload.notes),
    });

    const saved = await this.spvRoleRepo.save(row);

    if (role === 'sponsor' && entityId) {
      spv.sponsorEntityId = entityId;
      spv.legalEntityName = entity?.entityName ?? spv.legalEntityName;
      await this.spvRepo.save(spv);
      if (spv.projectId) {
        const project = await this.findProjectOrThrow(spv.projectId);
        project.sponsorEntityId = entityId as any;
        await this.projectRepo.save(project);
      }
    }

    await this.writeAuditLog({
      actorUserId,
      entityId: spvId,
      action: 'spv_role_link_updated',
      detailsJson: {
        reason: this.normalizeOptionalText(payload.reason),
        role,
        entityId,
        status: saved.status,
        source: saved.source,
      },
    });

    return this.getSpvDetail(spvId);
  }

  async rejectSpvRole(spvId: number, roleLinkId: number, reason?: string, actorUserId?: number) {
    const spv = await this.findSpvOrThrow(spvId);
    const row = await this.spvRoleRepo.findOne({
      where: { id: roleLinkId, spvId } as any,
    });
    if (!row) {
      throw new NotFoundException('SPV role link not found');
    }

    row.status = 'rejected';
    row.isPrimary = false;
    row.notes = this.normalizeOptionalText(reason) ?? row.notes;
    row.approvedAt = null;
    row.approvedBy = null;
    await this.spvRoleRepo.save(row);

    await this.writeAuditLog({
      actorUserId,
      entityId: spv.id,
      action: 'spv_role_link_rejected',
      detailsJson: {
        reason: this.normalizeOptionalText(reason),
        role: row.role,
        roleLinkId: row.id,
      },
    });

    return this.getSpvDetail(spvId);
  }

  async assertSpvReadyForIssuance(projectId: number) {
    const project = await this.findProjectOrThrow(projectId);
    const spv = project.spvId
      ? await this.spvRepo.findOne({ where: { id: Number(project.spvId) } })
      : null;

    if (!spv) {
      throw new BadRequestException(
        'Issuance preparation is incomplete. No draft SPV is linked to this project.',
      );
    }

    const readiness = this.buildReadiness({
      spv,
      project,
      roleRows: await this.getRoleRows(spv.id),
    });

    if (!readiness.issuanceReady) {
      throw new BadRequestException(
        `SPV readiness is blocked: ${readiness.blockingIssues.join(' ')}`,
      );
    }

    if (spv.status !== 'ready') {
      spv.status = 'ready';
      await this.spvRepo.save(spv);
    }

    return readiness;
  }

  private getTokenPrefix(project: ProjectEntity): string {
    const raw =
      ((project as any).projectType as string) ||
      ((project as any).dseType as string) ||
      '';

    const value = raw.toLowerCase();

    if (value.includes('battery') || value.includes('bess')) return 'BAT';
    if (value.includes('solar')) return 'SOL';
    if (value.includes('wind')) return 'WND';
    if (value.includes('hydrogen')) return 'HYD';
    if (value.includes('ev') || value.includes('charging')) return 'EVC';

    return 'AST';
  }

  private async generateTokenSymbol(prefix: string): Promise<string> {
    const existing = await this.seriesRepo.find({
      where: {
        tokenSymbol: Like(`${prefix}%`),
      } as any,
      select: ['tokenSymbol'] as any,
    });

    let max = 0;

    for (const row of existing as any[]) {
      const symbol = String(row.tokenSymbol ?? '').toUpperCase();
      const match = symbol.match(new RegExp(`^${prefix}(\\d+)$`));
      if (!match) continue;

      const n = Number(match[1]);
      if (Number.isFinite(n) && n > max) max = n;
    }

    return `${prefix}${String(max + 1).padStart(2, '0')}`;
  }

  async createSeriesForProject(projectId: number) {
    const project = await this.findProjectOrThrow(projectId);

    const existingSeries = await this.seriesRepo.findOne({
      where: {
        project: { id: projectId },
      } as any,
      relations: ['spv', 'project'],
    });

    if (existingSeries) {
      return {
        spv: existingSeries.spv,
        series: existingSeries,
      };
    }

    const preparedSpv = await this.prepareDraftSpvForProject(projectId);
    const savedSpv = await this.spvRepo.findOne({
      where: { id: Number(preparedSpv.id) },
    });
    if (!savedSpv) {
      throw new NotFoundException('Prepared SPV could not be found');
    }

    const prefix = this.getTokenPrefix(project);

    const maxRetries = 5;
    let savedSeries: SeriesEntity | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const tokenSymbol = await this.generateTokenSymbol(prefix);

      try {
        const series = new SeriesEntity();
        series.name = `${project.name || 'Project'} Series A`;
        series.tokenSymbol = tokenSymbol;
        series.totalSupply = Number((project as any).tokenSupply ?? 1000000);
        series.pricePerToken = Number((project as any).tokenPrice ?? 1);
        series.targetIrr = (project as any).targetIrr ?? null;
        series.termYears = (project as any).investmentTermYears ?? null;
        series.status = 'draft';
        series.spv = savedSpv;
        series.project = project;

        savedSeries = await this.seriesRepo.save(series);
        break;
      } catch (err: any) {
        const message = String(err?.message || '').toLowerCase();

        if (message.includes('duplicate') || message.includes('unique')) {
          continue;
        }

        throw err;
      }
    }

    if (!savedSeries) {
      throw new Error('Failed to generate unique token symbol after retries');
    }

    return {
      spv: savedSpv,
      series: savedSeries,
    };
  }
}
