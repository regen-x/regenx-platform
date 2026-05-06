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

@Entity('project_risk_inputs')
export class ProjectRiskInputsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', unique: true })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'counterparty_name', type: 'text', nullable: true })
  counterpartyName?: string | null;

  @Column({ name: 'counterparty_type', type: 'text', nullable: true })
  counterpartyType?: string | null;

  @Column({ name: 'counterparty_role', type: 'text', nullable: true })
  counterpartyRole?: string | null;

  @Column({ name: 'contract_status', type: 'text', nullable: true })
  contractStatus?: string | null;

  @Column({ name: 'site_secured', type: 'boolean', nullable: true })
  siteSecured?: boolean | null;

  @Column({ name: 'grid_connection_status', type: 'text', nullable: true })
  gridConnectionStatus?: string | null;

  @Column({ name: 'permits_status', type: 'text', nullable: true })
  permitsStatus?: string | null;

  @Column({ name: 'epc_contractor_status', type: 'text', nullable: true })
  epcContractorStatus?: string | null;

  @Column({ name: 'operational_dependencies', type: 'jsonb', nullable: true })
  operationalDependencies?: string[] | null;

  @Column({ name: 'key_risk_factors', type: 'jsonb', nullable: true })
  keyRiskFactors?: string[] | null;

  @Column({ name: 'data_confidence', type: 'text', nullable: true })
  dataConfidence?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
