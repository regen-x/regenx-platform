import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import {
  CustodyAccountStatus,
  CustodyProviderType,
  SystemCustodyPurpose,
} from './custody.enums';

@Entity('system_custody_accounts')
@Index('ux_system_custody_accounts_account_key', ['accountKey'], { unique: true })
export class SystemCustodyAccountEntity extends BaseEntity {
  @Column({ name: 'account_key', type: 'varchar', length: 64 })
  accountKey: string;

  @Column({ name: 'custody_provider', type: 'varchar', length: 32 })
  custodyProvider: CustodyProviderType | string;

  @Column({ name: 'custody_account_id', type: 'varchar', length: 160 })
  custodyAccountId: string;

  @Column({ name: 'public_address', type: 'varchar', length: 160, nullable: true })
  publicAddress?: string | null;

  @Column({ name: 'purpose', type: 'varchar', length: 64 })
  purpose: SystemCustodyPurpose | string;

  @Column({ name: 'status', type: 'varchar', length: 32, default: CustodyAccountStatus.ACTIVE })
  status: CustodyAccountStatus | string;

  @Column({ name: 'metadata_json', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadataJson: Record<string, any>;
}
