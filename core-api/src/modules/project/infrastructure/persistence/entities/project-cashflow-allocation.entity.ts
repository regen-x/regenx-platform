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

@Entity('project_cashflow_allocation')
export class ProjectCashflowAllocationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', unique: true })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'spv_pct', type: 'numeric', nullable: true })
  spvPct?: string | null;

  @Column({ name: 'host_pct', type: 'numeric', nullable: true })
  hostPct?: string | null;

  @Column({ name: 'operator_aggregator_pct', type: 'numeric', nullable: true })
  operatorAggregatorPct?: string | null;

  @Column({ name: 'platform_fee_pct', type: 'numeric', nullable: true })
  platformFeePct?: string | null;

  @Column({ name: 'operator_fee_pct', type: 'numeric', nullable: true })
  operatorFeePct?: string | null;

  @Column({ name: 'other_fee_pct', type: 'numeric', nullable: true })
  otherFeePct?: string | null;

  @Column({ name: 'annual_opex', type: 'numeric', nullable: true })
  annualOpex?: string | null;

  @Column({ name: 'maintenance_costs', type: 'numeric', nullable: true })
  maintenanceCosts?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
