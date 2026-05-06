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

@Entity('project_revenue_profile')
export class ProjectRevenueProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', unique: true })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'revenue_strategy', type: 'text', nullable: true })
  revenueStrategy?: string | null;

  @Column({ name: 'revenue_drivers', type: 'jsonb', nullable: true })
  revenueDrivers?: string[] | null;

  @Column({ name: 'market_revenue_pct', type: 'numeric', nullable: true })
  marketRevenuePct?: string | null;

  @Column({ name: 'contracted_revenue_pct', type: 'numeric', nullable: true })
  contractedRevenuePct?: string | null;

  @Column({ name: 'annual_contracted_revenue', type: 'numeric', nullable: true })
  annualContractedRevenue?: string | null;

  @Column({ name: 'annual_merchant_revenue', type: 'numeric', nullable: true })
  annualMerchantRevenue?: string | null;

  @Column({ name: 'market_participation', type: 'text', nullable: true })
  marketParticipation?: string | null;

  @Column({ name: 'optimisation_responsibility', type: 'text', nullable: true })
  optimisationResponsibility?: string | null;

  @Column({ name: 'revenue_risk_management', type: 'jsonb', nullable: true })
  revenueRiskManagement?: string[] | null;

  @Column({ name: 'market_exposure', type: 'text', nullable: true })
  marketExposure?: string | null;

  @Column({ name: 'market_grid_drivers', type: 'jsonb', nullable: true })
  marketGridDrivers?: string[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
