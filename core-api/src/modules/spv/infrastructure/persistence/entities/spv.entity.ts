import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SeriesEntity } from './series.entity';
import { SpvEntityRoleEntity } from './spv-entity-role.entity';

@Entity('spv')
export class SpvEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'legal_entity_name', type: 'varchar', length: 255, nullable: true })
  legalEntityName: string | null;

  @Column({ name: 'jurisdiction', type: 'varchar', length: 100, nullable: true })
  jurisdiction: string | null;

  @Column({ name: 'structure_type', type: 'varchar', length: 100, nullable: true })
  structureType: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'draft' })
  status: 'draft' | 'ready' | 'active' | 'inactive' | 'archived';

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'sponsor_entity_id', type: 'integer', nullable: true })
  sponsorEntityId: number | null;

  @Column({ name: 'custody_model', type: 'varchar', length: 30, nullable: true })
  custodyModel: 'self_custody' | 'regenx_custody' | null;

  @Column({ name: 'project_id', type: 'integer', nullable: true })
  projectId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @OneToMany(() => SeriesEntity, (series) => series.spv)
  series: SeriesEntity[];

  @OneToMany(() => SpvEntityRoleEntity, (role) => role.spv)
  linkedRoles: SpvEntityRoleEntity[];
}
