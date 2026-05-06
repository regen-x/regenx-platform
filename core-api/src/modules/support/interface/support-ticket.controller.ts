import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AppRole } from '../../iam/authorization/domain/app-role.enum';
import { AssignSupportTicketDto } from '../application/dto/assign-support-ticket.dto';
import { CreateSupportTicketDto } from '../application/dto/create-support-ticket.dto';
import { UpdateSupportTicketAdminNoteDto } from '../application/dto/update-support-ticket-admin-note.dto';
import { UpdateSupportTicketStatusDto } from '../application/dto/update-support-ticket-status.dto';
import { SupportTicketService } from '../application/service/support-ticket.service';

@Controller('support/tickets')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) {}

  private assertAuthenticated(req: any) {
    if (!req?.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
  }

  private isAdmin(req: any) {
    return String(req?.user?.role ?? '') === AppRole.Admin;
  }

  private assertAdmin(req: any) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  createTicket(
    @Body() body: CreateSupportTicketDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    this.assertAuthenticated(req);

    return this.supportTicketService.createTicket({
      userId: Number(req.user.id),
      role: this.supportTicketService.resolveRole({
        role: req?.user?.role,
        type: req?.user?.type,
      }),
      category: body?.category,
      subject: body?.subject,
      description: body?.description,
      priority: body?.priority,
      file,
    });
  }

  @Get('me')
  getMyTickets(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.supportTicketService.getUserTickets(Number(req.user.id));
  }

  @Get('admin')
  getAdminTickets(@Req() req: any) {
    this.assertAdmin(req);
    return this.supportTicketService.getAdminTickets();
  }

  @Get(':id')
  getTicket(@Param('id', ParseIntPipe) ticketId: number, @Req() req: any) {
    this.assertAuthenticated(req);
    return this.supportTicketService.getTicket(
      ticketId,
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() body: UpdateSupportTicketStatusDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.supportTicketService.updateStatus(ticketId, body?.status);
  }

  @Patch(':id/assign')
  assignTicket(
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() body: AssignSupportTicketDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.supportTicketService.assignTicket(
      ticketId,
      body?.assignedToUserId == null ? null : Number(body.assignedToUserId),
    );
  }

  @Patch(':id/admin-note')
  updateAdminNote(
    @Param('id', ParseIntPipe) ticketId: number,
    @Body() body: UpdateSupportTicketAdminNoteDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.supportTicketService.updateAdminNote(ticketId, body?.adminNotes);
  }
}
