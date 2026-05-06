import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';

@Entity('legal_entity')
export class LegalEntityEntity extends BaseEntity {
  @Column({ name: 'entity_name', type: 'varchar', length: 255 })
  entityName: string;

  @Column({ name: 'trading_name', type: 'varchar', length: 255, nullable: true })
  tradingName: string | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 100, nullable: true })
  entityType: string | null;

  @Column({ name: 'abn', type: 'varchar', length: 50, nullable: true })
  abn: string | null;

  @Column({ name: 'acn', type: 'varchar', length: 50, nullable: true })
  acn: string | null;

  @Column({ name: 'jurisdiction', type: 'varchar', length: 100, nullable: true })
  jurisdiction: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'draft' })
  status: 'draft' | 'active' | 'inactive' | 'archived';

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'operational_role', type: 'varchar', length: 100, nullable: true })
  operationalRole: string | null;

  @Column({ name: 'custody_model', type: 'varchar', length: 30, nullable: true })
  custodyModel: 'self_custody' | 'regenx_custody' | null;
}
