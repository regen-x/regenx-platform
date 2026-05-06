import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { DistributionPayoutRail } from './distribution-event.entity';

export type DistributionPayoutStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED';

@Entity('distribution_payout')
export class DistributionPayoutEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id', type: 'integer' })
  eventId: number;

  @Column({ name: 'entitlement_id', type: 'integer' })
  entitlementId: number;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number | null;

  @Column({ name: 'custody_type', type: 'varchar', length: 30 })
  custodyType: 'self_custody' | 'regenx_custody';

  @Column({ name: 'payout_rail', type: 'varchar', length: 30 })
  payoutRail: DistributionPayoutRail;

  @Column({ name: 'destination_wallet_address', type: 'text', nullable: true })
  destinationWalletAddress: string | null;

  @Column({ name: 'destination_account_ref', type: 'text', nullable: true })
  destinationAccountRef: string | null;

  @Column({ name: 'gross_amount', type: 'numeric', default: 0 })
  grossAmount: number;

  @Column({ name: 'fee_amount', type: 'numeric', default: 0 })
  feeAmount: number;

  @Column({ name: 'net_amount', type: 'numeric', default: 0 })
  netAmount: number;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: DistributionPayoutStatus;

  @Column({ name: 'external_reference', type: 'text', nullable: true })
  externalReference: string | null;

  @Column({ name: 'tx_hash', type: 'text', nullable: true })
  txHash: string | null;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;
}
