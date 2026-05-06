import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import { CustodyAccountStatus, CustodyProviderType } from './custody.enums';

@Entity('investor_custody_accounts')
@Index('idx_investor_custody_accounts_investor_id', ['investorId'])
@Index('idx_investor_custody_accounts_user_id', ['userId'])
@Index('idx_investor_custody_accounts_provider', ['custodyProvider'])
@Index('idx_investor_custody_accounts_account_id', ['custodyAccountId'])
export class InvestorCustodyAccountEntity extends BaseEntity {
  @Column({ name: 'investor_id', type: 'integer' })
  investorId: number;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId?: number | null;

  @Column({ name: 'fund_id', type: 'integer', nullable: true })
  fundId?: number | null;

  @Column({ name: 'custody_provider', type: 'varchar', length: 32 })
  custodyProvider: CustodyProviderType | string;

  @Column({
    name: 'setup_type',
    type: 'varchar',
    length: 32,
    default: 'custody_account',
  })
  setupType: string;

  @Column({ name: 'custody_account_id', type: 'varchar', length: 160 })
  custodyAccountId: string;

  @Column({
    name: 'public_address',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  publicAddress?: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 32,
    default: CustodyAccountStatus.CREATED,
  })
  status: CustodyAccountStatus | string;

  @Column({ name: 'whitelisted', type: 'boolean', default: false })
  whitelisted: boolean;

  @Column({ name: 'operational', type: 'boolean', default: false })
  operational: boolean;

  @Column({
    name: 'metadata_json',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  metadataJson: Record<string, any>;
}
