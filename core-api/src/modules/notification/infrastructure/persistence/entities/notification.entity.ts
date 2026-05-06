import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../../../common/infrastructure/persistence/entities/base.entity';

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_SUBMITTED = 'ORDER_SUBMITTED',
  ORDER_SETTLING = 'ORDER_SETTLING',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_FAILED = 'ORDER_FAILED',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  DISTRIBUTION_PAID = 'DISTRIBUTION_PAID',
  SELL_ORDER_CREATED = 'SELL_ORDER_CREATED',
  SELL_ORDER_FILLED = 'SELL_ORDER_FILLED',
  SELL_ORDER_CANCELLED = 'SELL_ORDER_CANCELLED',
  ACCOUNT_APPROVED = 'ACCOUNT_APPROVED',
  PROJECT_APPROVED = 'PROJECT_APPROVED',
  SUPPORT_TICKET_UPDATED = 'SUPPORT_TICKET_UPDATED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 60 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'related_entity_type', type: 'varchar', length: 60, nullable: true })
  relatedEntityType?: string | null;

  @Column({ name: 'related_entity_id', type: 'integer', nullable: true })
  relatedEntityId?: number | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date | null;
}
