import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  NotificationEntity,
  NotificationType,
} from '../../infrastructure/persistence/entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  private mapNotification(row: NotificationEntity) {
    return {
      id: Number(row.id),
      uuid: row.uuid,
      userId: Number(row.userId),
      type: row.type,
      title: row.title,
      message: row.message,
      relatedEntityType: row.relatedEntityType ?? null,
      relatedEntityId:
        row.relatedEntityId == null ? null : Number(row.relatedEntityId),
      isRead: Boolean(row.isRead),
      createdAt: String(row.createdAt ?? ''),
      readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
    };
  }

  async createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    relatedEntityType?: string | null,
    relatedEntityId?: number | null,
  ) {
    const row = this.notificationRepo.create({
      userId: Number(userId),
      type,
      title: String(title ?? '').trim(),
      message: String(message ?? '').trim(),
      relatedEntityType: relatedEntityType?.trim() || null,
      relatedEntityId:
        relatedEntityId == null ? null : Number(relatedEntityId),
      isRead: false,
      readAt: null,
    });

    const saved = await this.notificationRepo.save(row);
    return this.mapNotification(saved);
  }

  async getUserNotifications(userId: number) {
    const rows = await this.notificationRepo.find({
      where: { userId: Number(userId) } as any,
      order: { createdAt: 'DESC' as any, id: 'DESC' as any },
      take: 50,
    });

    return rows.map((row) => this.mapNotification(row));
  }

  async getUnreadCount(userId: number) {
    const unreadCount = await this.notificationRepo.count({
      where: { userId: Number(userId), isRead: false } as any,
    });

    return { unreadCount };
  }

  async markRead(notificationId: number, userId: number) {
    const row = await this.notificationRepo.findOne({
      where: { id: Number(notificationId), userId: Number(userId) } as any,
    });

    if (!row || row.deletedAt) {
      throw new NotFoundException('Notification not found');
    }

    row.isRead = true;
    row.readAt = row.readAt ?? new Date();
    const saved = await this.notificationRepo.save(row);
    return this.mapNotification(saved);
  }

  async markAllRead(userId: number) {
    const rows = await this.notificationRepo.find({
      where: { userId: Number(userId), isRead: false } as any,
    });

    if (rows.length === 0) {
      return { updatedCount: 0 };
    }

    const readAt = new Date();
    for (const row of rows) {
      row.isRead = true;
      row.readAt = readAt;
    }

    await this.notificationRepo.save(rows);
    return { updatedCount: rows.length };
  }
}
