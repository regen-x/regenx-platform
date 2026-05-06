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

@Entity('project_investment_structure')
export class ProjectInvestmentStructureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', unique: true })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'structure_type', type: 'text', nullable: true })
  structureType?: string | null;

  @Column({ name: 'investor_allocation_pct', type: 'numeric', nullable: true })
  investorAllocationPct?: string | null;

  @Column({ name: 'repayment_structure', type: 'text', nullable: true })
  repaymentStructure?: string | null;

  @Column({ name: 'investment_term_years', type: 'numeric', nullable: true })
  investmentTermYears?: string | null;

  @Column({ name: 'target_return_multiple', type: 'numeric', nullable: true })
  targetReturnMultiple?: string | null;

  @Column({ name: 'minimum_term_years', type: 'numeric', nullable: true })
  minimumTermYears?: string | null;

  @Column({ name: 'distribution_frequency', type: 'text', nullable: true })
  distributionFrequency?: string | null;

  @Column({ name: 'return_type', type: 'text', nullable: true })
  returnType?: string | null;

  @Column({ name: 'cashflow_basis', type: 'text', nullable: true })
  cashflowBasis?: string | null;

  @Column({ name: 'investor_priority', type: 'text', nullable: true })
  investorPriority?: string | null;

  @Column({ name: 'payment_timing', type: 'text', nullable: true })
  paymentTiming?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
