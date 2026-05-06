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

@Entity('project_issuance')
export class ProjectIssuanceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', unique: true })
  projectId: number;

  @ManyToOne(() => ProjectEntity, { nullable: false })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'price_per_unit', type: 'numeric', default: 1 })
  pricePerUnit: string;

  @Column({ name: 'token_symbol', type: 'varchar', length: 5, unique: true })
  tokenSymbol: string;

  @Column({ name: 'total_units_issued', type: 'numeric', nullable: true })
  totalUnitsIssued?: string | null;

  @Column({ name: 'units_available_to_investors', type: 'numeric', nullable: true })
  unitsAvailableToInvestors?: string | null;

  @Column({ name: 'minimum_investment', type: 'numeric', nullable: true })
  minimumInvestment?: string | null;

  @Column({ name: 'units_per_minimum', type: 'numeric', nullable: true })
  unitsPerMinimum?: string | null;

  @Column({ name: 'distribution_method', type: 'text', default: 'on_chain_payout' })
  distributionMethod: string;

  @Column({ name: 'secondary_trading_enabled', type: 'boolean', default: false })
  secondaryTradingEnabled: boolean;

  @Column({ name: 'lockup_period_months', type: 'integer', nullable: true })
  lockupPeriodMonths?: number | null;

  @Column({ name: 'transfer_restrictions', type: 'text', nullable: true })
  transferRestrictions?: string | null;

  @Column({ name: 'wallet_required', type: 'boolean', default: true })
  walletRequired: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
