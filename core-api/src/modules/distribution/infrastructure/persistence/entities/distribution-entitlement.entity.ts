import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import {
  OwnershipSettlementStatus,
  OwnershipSource,
} from '../../../../ownership/infrastructure/persistence/entities/ownership.entity';

export type DistributionEntitlementStatus =
  | 'PENDING'
  | 'LOCKED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

@Entity('distribution_entitlement')
export class DistributionEntitlementEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'event_id', type: 'integer' })
  eventId: number;

  @Column({ name: 'project_id', type: 'integer' })
  projectId: number;

  @Column({ name: 'series_id', type: 'integer', nullable: true })
  seriesId: number | null;

  @Column({ name: 'ownership_id', type: 'integer', nullable: true })
  ownershipId: number | null;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number | null;

  @Column({ name: 'custody_type', type: 'varchar', length: 30 })
  custodyType: 'self_custody' | 'regenx_custody';

  @Column({ name: 'ownership_source', type: 'varchar', length: 30 })
  ownershipSource: OwnershipSource;

  @Column({ name: 'settlement_status', type: 'varchar', length: 30 })
  settlementStatus: OwnershipSettlementStatus;

  @Column({ name: 'wallet_address', type: 'text', nullable: true })
  walletAddress: string | null;

  @Column({ name: 'custody_account_ref', type: 'text', nullable: true })
  custodyAccountRef: string | null;

  @Column({ name: 'units_held', type: 'numeric', default: 0 })
  unitsHeld: number;

  @Column({ name: 'ownership_fraction', type: 'numeric', default: 0 })
  ownershipFraction: number;

  @Column({ name: 'gross_amount', type: 'numeric', default: 0 })
  grossAmount: number;

  @Column({ name: 'fee_amount', type: 'numeric', default: 0 })
  feeAmount: number;

  @Column({ name: 'net_amount', type: 'numeric', default: 0 })
  netAmount: number;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: DistributionEntitlementStatus;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;
}
