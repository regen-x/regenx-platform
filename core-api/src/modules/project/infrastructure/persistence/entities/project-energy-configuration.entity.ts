import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ProjectEntity } from './project.entity';

@Entity('project_energy_configuration')
export class ProjectEnergyConfigurationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', unique: true })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'grid_position', type: 'text', nullable: true })
  gridPosition?: string | null;

  @Column({ name: 'electricity_supply_arrangement', type: 'text', nullable: true })
  electricitySupplyArrangement?: string | null;

  @Column({ name: 'tariff_structure', type: 'jsonb', nullable: true })
  tariffStructure?: string[] | null;

  @Column({ name: 'onsite_generation_type', type: 'text', nullable: true })
  onsiteGenerationType?: string | null;

  @Column({ name: 'demand_charges_status', type: 'text', nullable: true })
  demandChargesStatus?: string | null;

  @Column({ name: 'market_access', type: 'text', nullable: true })
  marketAccess?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
