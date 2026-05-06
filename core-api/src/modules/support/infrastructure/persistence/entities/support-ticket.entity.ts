import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';

export enum SupportTicketCategory {
  BUG = 'BUG',
  PAYMENT = 'PAYMENT',
  ACCOUNT = 'ACCOUNT',
  KYC = 'KYC',
  WALLET = 'WALLET',
  DISTRIBUTION = 'DISTRIBUTION',
  OTHER = 'OTHER',
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_ON_USER = 'WAITING_ON_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export type SupportTicketRole =
  | 'admin'
  | 'climateDeveloper'
  | 'wholesaleInvestor'
  | 'wealthManager';

@Entity('support_tickets')
export class SupportTicketEntity extends BaseEntity {
  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ type: 'varchar', length: 40 })
  role: SupportTicketRole;

  @Column({ type: 'varchar', length: 30 })
  category: SupportTicketCategory;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 30, default: SupportTicketStatus.OPEN })
  status: SupportTicketStatus;

  @Column({ type: 'varchar', length: 20, default: SupportTicketPriority.MEDIUM })
  priority: SupportTicketPriority;

  @Column({ name: 'attachment_url', type: 'text', nullable: true })
  attachmentUrl?: string | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date | null;

  @Column({ name: 'assigned_to_user_id', type: 'integer', nullable: true })
  assignedToUserId?: number | null;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes?: string | null;
}
