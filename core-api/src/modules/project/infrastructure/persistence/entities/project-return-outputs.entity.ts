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

@Entity('project_return_outputs')
export class ProjectReturnOutputsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', unique: true })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'projected_yield_pct', type: 'numeric', nullable: true })
  projectedYieldPct?: string | null;

  @Column({ name: 'implied_irr_pct', type: 'numeric', nullable: true })
  impliedIrrPct?: string | null;

  @Column({ name: 'implied_return_multiple', type: 'numeric', nullable: true })
  impliedReturnMultiple?: string | null;

  @Column({ name: 'estimated_payback_years', type: 'numeric', nullable: true })
  estimatedPaybackYears?: string | null;

  @Column({ name: 'total_distributions_required', type: 'numeric', nullable: true })
  totalDistributionsRequired?: string | null;

  @Column({ name: 'annual_net_cashflow', type: 'numeric', nullable: true })
  annualNetCashflow?: string | null;

  @Column({ name: 'estimated_periodic_distribution', type: 'numeric', nullable: true })
  estimatedPeriodicDistribution?: string | null;

  @Column({ name: 'generated_at', type: 'timestamptz' })
  generatedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
