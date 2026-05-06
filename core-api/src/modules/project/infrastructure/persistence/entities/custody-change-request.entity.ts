import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { UserEntity } from '../../../../iam/user/infrastructure/persistence/entities/user.entity';
import { DeveloperProfileEntity } from '../../../../developer-profile/infrastructure/persistence/entities/developer-profile.entity';
import { ProjectEntity } from './project.entity';

export type CustodyParticipantType =
  | 'project'
  | 'developer'
  | 'investor'
  | 'legal_entity'
  | 'spv';

export type CustodyChangeRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'more_info_required'
  | 'cancelled';

@Entity('custody_change_request')
export class CustodyChangeRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', type: 'integer', nullable: true })
  projectId?: number | null;

  @ManyToOne(() => ProjectEntity, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: ProjectEntity | null;

  @Column({ name: 'participant_type', type: 'varchar', length: 40 })
  participantType: CustodyParticipantType;

  @Column({ name: 'participant_entity_id', type: 'integer', nullable: true })
  participantEntityId?: number | null;

  @Column({ name: 'participant_user_id', type: 'integer', nullable: true })
  participantUserId?: number | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'participant_user_id' })
  participantUser?: UserEntity | null;

  @Column({ name: 'participant_developer_profile_id', type: 'integer', nullable: true })
  participantDeveloperProfileId?: number | null;

  @ManyToOne(() => DeveloperProfileEntity, { nullable: true })
  @JoinColumn({ name: 'participant_developer_profile_id' })
  participantDeveloperProfile?: DeveloperProfileEntity | null;

  @Column({ name: 'participant_label', type: 'text', nullable: true })
  participantLabel?: string | null;

  @Column({ name: 'current_custody_mode', type: 'varchar', length: 30 })
  currentCustodyMode: 'self_custody' | 'regenx_custody';

  @Column({ name: 'requested_custody_mode', type: 'varchar', length: 30 })
  requestedCustodyMode: 'self_custody' | 'regenx_custody';

  @Column({ name: 'wallet_address', type: 'text', nullable: true })
  walletAddress?: string | null;

  @Column({ name: 'requested_wallet_address', type: 'text', nullable: true })
  requestedWalletAddress?: string | null;

  @Column({ name: 'reason', type: 'text' })
  reason: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'pending' })
  status: CustodyChangeRequestStatus;

  @Column({ name: 'requested_by', type: 'integer', nullable: true })
  requestedBy?: number | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'requested_by' })
  requestedByUser?: UserEntity | null;

  @Column({ name: 'requested_at', type: 'timestamp', default: () => 'NOW()' })
  requestedAt: Date;

  @Column({ name: 'request_payload_json', type: 'jsonb', nullable: true })
  requestPayloadJson?: Record<string, unknown> | null;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes?: string | null;

  @Column({ name: 'admin_decision', type: 'varchar', length: 30, nullable: true })
  adminDecision?: string | null;

  @Column({ name: 'decided_by', type: 'integer', nullable: true })
  decidedBy?: number | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'decided_by' })
  decidedByUser?: UserEntity | null;

  @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
  decidedAt?: Date | null;
}
