import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogEntity } from '../../../project/infrastructure/persistence/entities/audit-log.entity';
import { UpsertLegalEntityDto } from '../dto/upsert-legal-entity.dto';
import { LegalEntityEntity } from '../../infrastructure/persistence/entities/legal-entity.entity';

@Injectable()
export class LegalEntityService {
  constructor(
    @InjectRepository(LegalEntityEntity)
    private readonly legalEntityRepo: Repository<LegalEntityEntity>,

    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepo: Repository<AuditLogEntity>,
  ) {}

  private normalizeOptionalText(value?: string | null) {
    const normalized = String(value ?? '').trim();
    return normalized || null;
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
      entityType: 'LegalEntity',
      entityId: params.entityId,
      action: params.action,
      detailsJson: params.detailsJson ?? null,
    } as any);

    await this.auditLogRepo.save(row);
  }

  private mapEntity(entity: LegalEntityEntity) {
    return {
      id: entity.id,
      uuid: entity.uuid,
      entityName: entity.entityName,
      tradingName: entity.tradingName ?? null,
      entityType: entity.entityType ?? null,
      abn: entity.abn ?? null,
      acn: entity.acn ?? null,
      jurisdiction: entity.jurisdiction ?? null,
      status: entity.status,
      contactEmail: entity.contactEmail ?? null,
      notes: entity.notes ?? null,
      operationalRole: entity.operationalRole ?? null,
      custodyModel: entity.custodyModel ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async listEntities() {
    const rows = await this.legalEntityRepo.find({
      order: { updatedAt: 'DESC' as any, id: 'DESC' as any },
    });

    return rows.map((row) => this.mapEntity(row));
  }

  async getEntityDetail(id: number) {
    const entity = await this.legalEntityRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Legal entity not found');
    }

    return this.mapEntity(entity);
  }

  async createEntity(payload: UpsertLegalEntityDto, actorUserId?: number) {
    const entityName = this.normalizeOptionalText(payload.entityName);
    if (!entityName) {
      throw new BadRequestException('entityName is required');
    }

    const entity = this.legalEntityRepo.create({
      entityName,
      tradingName: this.normalizeOptionalText(payload.tradingName),
      entityType: this.normalizeOptionalText(payload.entityType),
      abn: this.normalizeOptionalText(payload.abn),
      acn: this.normalizeOptionalText(payload.acn),
      jurisdiction: this.normalizeOptionalText(payload.jurisdiction),
      status: payload.status ?? 'draft',
      contactEmail: this.normalizeOptionalText(payload.contactEmail),
      notes: this.normalizeOptionalText(payload.notes),
      operationalRole: this.normalizeOptionalText(payload.operationalRole),
      custodyModel: payload.custodyModel ?? null,
    });

    const saved = await this.legalEntityRepo.save(entity);
    await this.writeAuditLog({
      actorUserId,
      entityId: saved.id,
      action: 'legal_entity_created',
      detailsJson: {
        reason: this.normalizeOptionalText(payload.reason),
        entityName: saved.entityName,
        status: saved.status,
      },
    });

    return this.mapEntity(saved);
  }

  async updateEntity(id: number, payload: UpsertLegalEntityDto, actorUserId?: number) {
    const entity = await this.legalEntityRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Legal entity not found');
    }

    const before = this.mapEntity(entity);

    entity.entityName = this.normalizeOptionalText(payload.entityName) ?? entity.entityName;
    entity.tradingName = this.normalizeOptionalText(payload.tradingName);
    entity.entityType = this.normalizeOptionalText(payload.entityType);
    entity.abn = this.normalizeOptionalText(payload.abn);
    entity.acn = this.normalizeOptionalText(payload.acn);
    entity.jurisdiction = this.normalizeOptionalText(payload.jurisdiction);
    entity.status = payload.status ?? entity.status;
    entity.contactEmail = this.normalizeOptionalText(payload.contactEmail);
    entity.notes = this.normalizeOptionalText(payload.notes);
    entity.operationalRole = this.normalizeOptionalText(payload.operationalRole);
    entity.custodyModel = payload.custodyModel ?? null;

    const saved = await this.legalEntityRepo.save(entity);
    await this.writeAuditLog({
      actorUserId,
      entityId: saved.id,
      action: 'legal_entity_updated',
      detailsJson: {
        reason: this.normalizeOptionalText(payload.reason),
        before,
        after: this.mapEntity(saved),
      },
    });

    return this.mapEntity(saved);
  }
}
