import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type OwnershipSource = 'ON_CHAIN' | 'INTERNAL_LEDGER';
export type OwnershipSettlementStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED';

@Entity('ownership')
export class OwnershipEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number | null;

  @Column({ name: 'project_id', type: 'integer' })
  projectId: number;

  @Column({ name: 'series_id', type: 'integer' })
  seriesId: number;

  @Column({ name: 'token_symbol', type: 'varchar', length: 20 })
  tokenSymbol: string;

  @Column({ name: 'amount', type: 'numeric', default: 0 })
  amount: number;

  @Column({ name: 'custody_type', type: 'varchar', length: 30 })
  custodyType: 'self_custody' | 'regenx_custody';

  @Column({
    name: 'ownership_source',
    type: 'varchar',
    length: 30,
    default: 'ON_CHAIN',
  })
  ownershipSource: OwnershipSource;

  @Column({
    name: 'settlement_status',
    type: 'varchar',
    length: 30,
    default: 'SETTLED',
  })
  settlementStatus: OwnershipSettlementStatus;

  @Column({ name: 'wallet_address', type: 'text', nullable: true })
  walletAddress: string | null;

  @Column({ name: 'custody_account_ref', type: 'text', nullable: true })
  custodyAccountRef: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'active' })
  status: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;
}
