import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type DistributionEventStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'APPROVED'
  | 'READY_FOR_PAYOUT'
  | 'COMPLETED'
  | 'CANCELLED';

export type DistributionCustodyScope =
  | 'ALL'
  | 'SELF_CUSTODY'
  | 'REGENX_CUSTODY';

export type DistributionPayoutRail = 'AUD' | 'AUDD' | 'OFF_CHAIN';

@Entity('distribution_event')
export class DistributionEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer' })
  projectId: number;

  @Column({ name: 'series_id', type: 'integer', nullable: true })
  seriesId: number | null;

  @Column({ name: 'spv_id', type: 'integer', nullable: true })
  spvId: number | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'DRAFT',
  })
  status: DistributionEventStatus;

  @Column({
    name: 'custody_scope',
    type: 'varchar',
    length: 30,
    default: 'ALL',
  })
  custodyScope: DistributionCustodyScope;

  @Column({
    name: 'payout_rail',
    type: 'varchar',
    length: 30,
    default: 'OFF_CHAIN',
  })
  payoutRail: DistributionPayoutRail;

  @Column({ name: 'record_date', type: 'date' })
  recordDate: string;

  @Column({ name: 'payable_date', type: 'date', nullable: true })
  payableDate: string | null;

  @Column({ name: 'cash_inflow_amount', type: 'numeric', nullable: true })
  cashInflowAmount: number | null;

  @Column({ name: 'gross_amount', type: 'numeric', nullable: true })
  grossAmount: number | null;

  @Column({ name: 'fee_amount', type: 'numeric', nullable: true })
  feeAmount: number | null;

  @Column({ name: 'net_amount', type: 'numeric', nullable: true })
  netAmount: number | null;

  @Column({ name: 'source_reference', type: 'text', nullable: true })
  sourceReference: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdBy: number | null;

  @Column({ name: 'approved_by', type: 'integer', nullable: true })
  approvedBy: number | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;
}
