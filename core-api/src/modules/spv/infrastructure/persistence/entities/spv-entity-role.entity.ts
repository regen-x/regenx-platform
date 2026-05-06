import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';
import { LegalEntityEntity } from '../../../../legal-entity/infrastructure/persistence/entities/legal-entity.entity';
import { SpvEntity } from './spv.entity';

@Entity('spv_entity_roles')
export class SpvEntityRoleEntity extends BaseEntity {
  @Column({ name: 'spv_id', type: 'integer' })
  spvId: number;

  @ManyToOne(() => SpvEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spv_id' })
  spv: SpvEntity;

  @Column({ name: 'entity_id', type: 'integer', nullable: true })
  entityId: number | null;

  @ManyToOne(() => LegalEntityEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'entity_id' })
  entity: LegalEntityEntity | null;

  @Column({ name: 'role', type: 'varchar', length: 100 })
  role: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'suggested' })
  status: 'suggested' | 'linked' | 'approved' | 'rejected';

  @Column({ name: 'source', type: 'varchar', length: 30, default: 'auto' })
  source: 'auto' | 'manual';

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ name: 'is_primary', type: 'boolean', default: true })
  isPrimary: boolean;

  @Column({ name: 'confidence_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  confidenceScore: string | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approved_by', type: 'integer', nullable: true })
  approvedBy: number | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: UserEntity | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;
}
