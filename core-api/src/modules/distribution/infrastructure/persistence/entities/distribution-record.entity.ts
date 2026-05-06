import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';

export type DistributionRecordType =
  | 'DISTRIBUTION'
  | 'INTEREST'
  | 'RETURN_OF_CAPITAL'
  | 'FEE_ADJUSTMENT';

export type DistributionRecordStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'PAID'
  | 'FAILED';

@Entity('distributions')
export class DistributionRecordEntity extends BaseEntity {
  @Column({ name: 'project_id', type: 'integer' })
  projectId: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'ownership_id', type: 'integer', nullable: true })
  ownershipId?: number | null;

  @Column({ name: 'event_id', type: 'integer', nullable: true })
  eventId?: number | null;

  @Column({ name: 'payout_id', type: 'integer', nullable: true })
  payoutId?: number | null;

  @Column({ type: 'varchar', length: 40, default: 'DISTRIBUTION' })
  type: DistributionRecordType;

  @Column({ name: 'gross_amount', type: 'numeric' })
  grossAmount: number;

  @Column({ name: 'fee_amount', type: 'numeric', nullable: true })
  feeAmount?: number | null;

  @Column({ name: 'net_amount', type: 'numeric' })
  netAmount: number;

  @Column({ type: 'varchar', length: 20, default: 'AUD' })
  currency: string;

  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart?: string | null;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd?: string | null;

  @Column({ name: 'distribution_date', type: 'date', nullable: true })
  distributionDate?: string | null;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: DistributionRecordStatus;

  @Column({ type: 'text', nullable: true })
  reference?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
