import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import {
  CustodyProviderType,
  CustodyTransactionStatus,
  CustodyTransactionType,
} from './custody.enums';

@Entity('custody_transactions')
@Index('idx_custody_transactions_investor_id', ['investorId'])
@Index('idx_custody_transactions_project_id', ['projectId'])
@Index('idx_custody_transactions_provider_transaction_id', ['providerTransactionId'])
@Index('idx_custody_transactions_status', ['status'])
export class CustodyTransactionEntity extends BaseEntity {
  @Column({ name: 'investor_id', type: 'integer', nullable: true })
  investorId?: number | null;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId?: number | null;

  @Column({ name: 'project_id', type: 'integer', nullable: true })
  projectId?: number | null;

  @Column({ name: 'fund_id', type: 'integer', nullable: true })
  fundId?: number | null;

  @Column({ name: 'source_custody_account_id', type: 'varchar', length: 160, nullable: true })
  sourceCustodyAccountId?: string | null;

  @Column({ name: 'destination_custody_account_id', type: 'varchar', length: 160, nullable: true })
  destinationCustodyAccountId?: string | null;

  @Column({ name: 'custody_provider', type: 'varchar', length: 32 })
  custodyProvider: CustodyProviderType | string;

  @Column({ name: 'provider_transaction_id', type: 'varchar', length: 160, nullable: true })
  providerTransactionId?: string | null;

  @Column({ name: 'tx_hash', type: 'varchar', length: 160, nullable: true })
  txHash?: string | null;

  @Column({ name: 'asset_code', type: 'varchar', length: 32, nullable: true })
  assetCode?: string | null;

  @Column({ name: 'issuer', type: 'varchar', length: 160, nullable: true })
  issuer?: string | null;

  @Column({ name: 'amount', type: 'numeric', precision: 28, scale: 7, nullable: true })
  amount?: string | null;

  @Column({ name: 'transaction_type', type: 'varchar', length: 64 })
  transactionType: CustodyTransactionType | string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 32,
    default: CustodyTransactionStatus.PENDING,
  })
  status: CustodyTransactionStatus | string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ name: 'metadata_json', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadataJson: Record<string, any>;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date | null;
}
