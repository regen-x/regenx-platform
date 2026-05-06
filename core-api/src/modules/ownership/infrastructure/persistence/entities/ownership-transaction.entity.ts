import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  OwnershipSettlementStatus,
  OwnershipSource,
} from './ownership.entity';

@Entity('ownership_transaction')
export class OwnershipTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'project_id', type: 'integer' })
  projectId: number;

  @Column({ name: 'series_id', type: 'integer' })
  seriesId: number;

  @Column({ name: 'token_symbol', type: 'varchar', length: 20 })
  tokenSymbol: string;

  @Column({ name: 'amount', type: 'numeric' })
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

  @Column({ name: 'buyer_wallet_address', type: 'text', nullable: true })
  buyerWalletAddress: string | null;

  @Column({ name: 'seller_wallet_address', type: 'text', nullable: true })
  sellerWalletAddress: string | null;

  @Column({ name: 'signed_xdr', type: 'text', nullable: true })
  signedXdr: string | null;

  @Column({ name: 'tx_hash', type: 'text', nullable: true })
  txHash: string | null;

  @Column({
    name: 'settlement_status',
    type: 'varchar',
    length: 30,
    default: 'PENDING',
  })
  settlementStatus: OwnershipSettlementStatus;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'built' })
  status: 'built' | 'submitted' | 'confirmed' | 'failed' | 'cancelled';

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'NOW()' })
  updatedAt: Date;
}
