import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';
import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';

@Entity('developer_profile')
export class DeveloperProfileEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ nullable: true, name: 'business_name', type: 'text' })
  businessName?: string;

  @Column({ nullable: true, type: 'text' })
  abn?: string;

  @Column({ nullable: true, name: 'country_of_incorporation', type: 'text' })
  countryOfIncorporation?: string;

  @Column({ nullable: true, name: 'registered_office_address', type: 'text' })
  registeredOfficeAddress?: string;

  @Column({ nullable: true, name: 'postal_code', type: 'text' })
  postalCode?: string;

  @Column({ nullable: true, name: 'representative_full_name', type: 'text' })
  representativeFullName?: string;

  @Column({ nullable: true, name: 'representative_role', type: 'text' })
  representativeRole?: string;

  @Column({ nullable: true, name: 'representative_email', type: 'text' })
  representativeEmail?: string;

  @Column({ nullable: true, name: 'representative_phone', type: 'text' })
  representativePhone?: string;

  @Column({ nullable: true, name: 'representative_authority', type: 'text' })
  representativeAuthority?: string;

  @Column({ nullable: true, name: 'compliance_contact_name', type: 'text' })
  complianceContactName?: string;

  @Column({ nullable: true, name: 'compliance_notes', type: 'text' })
  complianceNotes?: string;

  @Column({ nullable: true, name: 'compliance_entity_type', type: 'text' })
  complianceEntityType?: string;

  @Column({ nullable: true, name: 'compliance_tax_status', type: 'text' })
  complianceTaxStatus?: string;

  @Column({ nullable: true, name: 'compliance_director_name', type: 'text' })
  complianceDirectorName?: string;

  @Column({ nullable: true, name: 'compliance_beneficial_owner', type: 'text' })
  complianceBeneficialOwner?: string;

  @Column({ nullable: true, name: 'compliance_bank_account_name', type: 'text' })
  complianceBankAccountName?: string;

  @Column({ nullable: true, name: 'compliance_bank_details', type: 'text' })
  complianceBankDetails?: string;

  @Column({ nullable: true, name: 'wallet_address', type: 'text' })
  walletAddress?: string;

  @Column({ nullable: true, name: 'legal_entity_name', type: 'text' })
  legalEntityName?: string;

  @Column({ nullable: true, name: 'trading_name', type: 'text' })
  tradingName?: string;

  @Column({ nullable: true, name: 'acn', type: 'text' })
  acn?: string;

  @Column({ nullable: true, name: 'contact_name', type: 'text' })
  contactName?: string;

  @Column({ nullable: true, name: 'contact_email', type: 'text' })
  contactEmail?: string;

  @Column({ nullable: true, name: 'phone', type: 'text' })
  phone?: string;

  @Column({ nullable: true, name: 'website', type: 'text' })
  website?: string;

  @Column({ nullable: true, name: 'registered_address', type: 'text' })
  registeredAddress?: string;

  @Column({ nullable: true, name: 'business_description', type: 'text' })
  businessDescription?: string;

  @Column({
    nullable: false,
    name: 'custody_mode',
    type: 'varchar',
    length: 30,
    default: 'self_custody',
  })
  custodyMode: 'self_custody' | 'regenx_custody';

  @Column({ nullable: true, name: 'primary_wallet_address', type: 'text' })
  primaryWalletAddress?: string;

  @Column({ nullable: true, name: 'wallet_label', type: 'text' })
  walletLabel?: string;

  @Column({ nullable: true, name: 'wallet_connected_at' })
  walletConnectedAt?: Date;

  @Column({ nullable: true, name: 'wallet_last_updated_at' })
  walletLastUpdatedAt?: Date;

  @Column({
    nullable: false,
    name: 'custody_change_status',
    type: 'varchar',
    length: 30,
    default: 'none',
  })
  custodyChangeStatus: 'none' | 'pending_review' | 'approved' | 'rejected';

  @Column({ nullable: true, name: 'custody_change_requested_at' })
  custodyChangeRequestedAt?: Date;

  @Column({
    nullable: true,
    name: 'custody_change_requested_mode',
    type: 'varchar',
    length: 30,
  })
  custodyChangeRequestedMode?: 'self_custody' | 'regenx_custody';

  @Column({
    nullable: false,
    default: false,
    name: 'platform_agreement_accepted',
    type: 'boolean',
  })
  platformAgreementAccepted: boolean;

  @Column({
    type: 'jsonb',
    default: () => "'{}'::jsonb",
    name: 'payload_json',
  })
  payloadJson: Record<string, unknown>;

  @Column({ type: 'text', default: 'draft' })
  status: string;

  @Column({ nullable: true, name: 'submitted_at' })
  submittedAt?: Date;

  @Column({ nullable: true, name: 'approved_at' })
  approvedAt?: Date;

  @Column({ nullable: true, name: 'rejected_at' })
  rejectedAt?: Date;

  @Column({ nullable: true, type: 'text', name: 'admin_notes' })
  adminNotes?: string;
}
