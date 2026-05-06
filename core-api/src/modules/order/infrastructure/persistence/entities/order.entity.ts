import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';

export type OrderType = 'BUY' | 'SELL';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'SUBMITTED'
  | 'SETTLING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'project_id', type: 'integer' })
  projectId: number;

  @Column({ name: 'project_name', type: 'varchar', length: 255 })
  projectName: string;

  @Column({ name: 'token_symbol', type: 'varchar', length: 80 })
  tokenSymbol: string;

  @Column({ name: 'order_type', type: 'varchar', length: 20, default: 'BUY' })
  orderType: OrderType;

  @Column({ name: 'currency_amount', type: 'numeric', default: 0 })
  currencyAmount: number;

  @Column({ name: 'token_amount', type: 'numeric', default: 0 })
  tokenAmount: number;

  @Column({ type: 'varchar', length: 40, default: 'DRAFT' })
  status: OrderStatus;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string | null;

  @Column({ name: 'tx_hash', type: 'text', nullable: true })
  txHash?: string | null;

  @Column({ type: 'text', nullable: true })
  reference?: string | null;

  @Column({ name: 'resulting_transaction_id', type: 'integer', nullable: true })
  resultingTransactionId?: number | null;

  @Column({ name: 'investor_custody_account_id', type: 'integer', nullable: true })
  investorCustodyAccountId?: number | null;

  @Column({ name: 'custody_provider', type: 'varchar', length: 32, nullable: true })
  custodyProvider?: string | null;

  @Column({ name: 'provider_transaction_id', type: 'varchar', length: 160, nullable: true })
  providerTransactionId?: string | null;

  @Column({ name: 'token_transfer_tx_hash', type: 'varchar', length: 160, nullable: true })
  tokenTransferTxHash?: string | null;

  @Column({ name: 'onchain_status', type: 'varchar', length: 40, default: 'not_started' })
  onchainStatus?:
    | 'not_started'
    | 'pending'
    | 'submitted'
    | 'policy_pending'
    | 'confirmed'
    | 'failed'
    | 'pending_custody_account';

  @Column({ name: 'onchain_error', type: 'text', nullable: true })
  onchainError?: string | null;

  @Column({ name: 'settled_at', type: 'timestamp', nullable: true })
  settledAt?: Date | null;

  @Column({ name: 'draft_at', type: 'timestamp', nullable: true })
  draftAt?: Date | null;

  @Column({ name: 'pending_signature_at', type: 'timestamp', nullable: true })
  pendingSignatureAt?: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt?: Date | null;

  @Column({ name: 'settling_at', type: 'timestamp', nullable: true })
  settlingAt?: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt?: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date | null;
}
