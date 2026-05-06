import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { S3Service } from '../../../file-storage/s3.service';
import { AppRole } from '../../../iam/authorization/domain/app-role.enum';
import { UserEntity } from '../../../iam/user/infrastructure/persistence/entities/user.entity';
import { NotificationService } from '../../../notification/application/service/notification.service';
import { NotificationType } from '../../../notification/infrastructure/persistence/entities/notification.entity';
import {
  SupportTicketCategory,
  SupportTicketEntity,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../../infrastructure/persistence/entities/support-ticket.entity';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketRepo: Repository<SupportTicketEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
  ) {}

  private async uploadAttachment(params: {
    userId: number;
    file?: Express.Multer.File | null;
  }) {
    if (!params.file) return null;

    const uploaded = await this.s3Service.uploadBuffer({
      userId: String(params.userId),
      category: 'support',
      fileName: params.file.originalname,
      contentType: params.file.mimetype,
      buffer: params.file.buffer,
    });

    return uploaded.key;
  }

  private async getAttachmentDownloadUrl(key?: string | null) {
    if (!key) return null;

    try {
      const { downloadUrl } = await this.s3Service.createPresignedDownload(key);
      return downloadUrl;
    } catch (error) {
      return key;
    }
  }

  private async getUsersByIds(userIds: number[]) {
    const uniqueIds = Array.from(
      new Set(userIds.filter((value) => Number.isFinite(Number(value)) && Number(value) > 0)),
    );

    if (!uniqueIds.length) {
      return new Map<number, UserEntity>();
    }

    const users = await this.userRepo.find({
      where: { id: In(uniqueIds) } as any,
    });
    return new Map(users.map((user) => [Number(user.id), user]));
  }

  private async mapTicket(
    ticket: SupportTicketEntity,
    usersById?: Map<number, UserEntity>,
  ) {
    const users =
      usersById ??
      (await this.getUsersByIds([
        Number(ticket.userId),
        Number(ticket.assignedToUserId ?? 0),
      ]));

    const createdBy = users.get(Number(ticket.userId));
    const assignedTo = ticket.assignedToUserId
      ? users.get(Number(ticket.assignedToUserId))
      : null;

    return {
      id: Number(ticket.id),
      uuid: ticket.uuid,
      userId: Number(ticket.userId),
      role: ticket.role,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      attachmentUrl: await this.getAttachmentDownloadUrl(ticket.attachmentUrl ?? null),
      attachmentKey: ticket.attachmentUrl ?? null,
      createdAt: String(ticket.createdAt ?? ''),
      updatedAt: String(ticket.updatedAt ?? ''),
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt).toISOString() : null,
      assignedToUserId: ticket.assignedToUserId ? Number(ticket.assignedToUserId) : null,
      adminNotes: ticket.adminNotes ?? null,
      user: createdBy
        ? {
            id: Number(createdBy.id),
            fullName: createdBy.fullname,
            email: createdBy.email,
            type: createdBy.type,
            role: createdBy.role,
          }
        : null,
      assignedToUser: assignedTo
        ? {
            id: Number(assignedTo.id),
            fullName: assignedTo.fullname,
            email: assignedTo.email,
            type: assignedTo.type,
            role: assignedTo.role,
          }
        : null,
    };
  }

  private async getTicketOrFail(ticketId: number) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId } as any,
    });

    if (!ticket || ticket.deletedAt) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  private isResolvedStatus(status: SupportTicketStatus) {
    return status === SupportTicketStatus.RESOLVED || status === SupportTicketStatus.CLOSED;
  }

  async createTicket(input: {
    userId: number;
    role: string;
    category: string;
    subject: string;
    description: string;
    priority?: string | null;
    file?: Express.Multer.File | null;
  }) {
    if (!input.subject?.trim()) {
      throw new BadRequestException('Subject is required');
    }

    if (!input.description?.trim()) {
      throw new BadRequestException('Description is required');
    }

    if (!Object.values(SupportTicketCategory).includes(input.category as any)) {
      throw new BadRequestException('Invalid category');
    }

    if (
      input.priority &&
      !Object.values(SupportTicketPriority).includes(input.priority as any)
    ) {
      throw new BadRequestException('Invalid priority');
    }

    const attachmentUrl = await this.uploadAttachment({
      userId: input.userId,
      file: input.file,
    });

    const row = this.ticketRepo.create({
      userId: input.userId,
      role: input.role as any,
      category: input.category as any,
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: SupportTicketStatus.OPEN,
      priority: (input.priority as SupportTicketPriority) || SupportTicketPriority.MEDIUM,
      attachmentUrl,
      assignedToUserId: null,
      adminNotes: null,
      resolvedAt: null,
    });

    const saved = await this.ticketRepo.save(row);
    return this.mapTicket(saved);
  }

  async getUserTickets(userId: number) {
    const rows = await this.ticketRepo.find({
      where: { userId } as any,
      order: { updatedAt: 'DESC' as any, createdAt: 'DESC' as any },
    });

    const users = await this.getUsersByIds(
      rows.flatMap((ticket) => [Number(ticket.userId), Number(ticket.assignedToUserId ?? 0)]),
    );

    return Promise.all(rows.map((row) => this.mapTicket(row, users)));
  }

  async getTicket(ticketId: number, userId: number, isAdmin: boolean) {
    const ticket = await this.getTicketOrFail(ticketId);

    if (!isAdmin && Number(ticket.userId) !== Number(userId)) {
      throw new NotFoundException('Support ticket not found');
    }

    return this.mapTicket(ticket);
  }

  async getAdminTickets() {
    const rows = await this.ticketRepo.find({
      order: { updatedAt: 'DESC' as any, createdAt: 'DESC' as any },
    });

    const users = await this.getUsersByIds(
      rows.flatMap((ticket) => [Number(ticket.userId), Number(ticket.assignedToUserId ?? 0)]),
    );

    return Promise.all(rows.map((row) => this.mapTicket(row, users)));
  }

  async updateStatus(ticketId: number, status: SupportTicketStatus) {
    if (!Object.values(SupportTicketStatus).includes(status as any)) {
      throw new BadRequestException('Invalid status');
    }

    const ticket = await this.getTicketOrFail(ticketId);
    ticket.status = status;
    ticket.resolvedAt = this.isResolvedStatus(status) ? new Date() : null;
    const saved = await this.ticketRepo.save(ticket);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.SUPPORT_TICKET_UPDATED,
      'Support ticket updated',
      `Your support ticket "${saved.subject}" is now ${String(saved.status).replace(/_/g, ' ').toLowerCase()}.`,
      'support_ticket',
      Number(saved.id),
    );

    return this.mapTicket(saved);
  }

  async assignTicket(ticketId: number, assignedToUserId?: number | null) {
    const ticket = await this.getTicketOrFail(ticketId);

    if (assignedToUserId != null) {
      const assignee = await this.userRepo.findOne({
        where: { id: Number(assignedToUserId) } as any,
      });

      if (!assignee || assignee.deletedAt) {
        throw new NotFoundException('Assignee not found');
      }
    }

    ticket.assignedToUserId =
      assignedToUserId == null ? null : Number(assignedToUserId);
    const saved = await this.ticketRepo.save(ticket);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.SUPPORT_TICKET_UPDATED,
      'Support ticket assigned',
      `Your support ticket "${saved.subject}" has been assigned to a support team member.`,
      'support_ticket',
      Number(saved.id),
    );

    return this.mapTicket(saved);
  }

  async updateAdminNote(ticketId: number, adminNotes?: string | null) {
    const ticket = await this.getTicketOrFail(ticketId);
    ticket.adminNotes = adminNotes?.trim() ? adminNotes.trim() : null;
    const saved = await this.ticketRepo.save(ticket);

    await this.notificationService.createNotification(
      Number(saved.userId),
      NotificationType.SUPPORT_TICKET_UPDATED,
      'Support ticket updated',
      `Your support ticket "${saved.subject}" has a new support update.`,
      'support_ticket',
      Number(saved.id),
    );

    return this.mapTicket(saved);
  }

  resolveRole(input: { role?: string | null; type?: string | null }) {
    if (String(input.role ?? '') === AppRole.Admin) {
      return AppRole.Admin;
    }

    return String(input.type ?? 'wholesaleInvestor');
  }
}
