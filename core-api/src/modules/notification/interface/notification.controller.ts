import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { NotificationService } from '../application/service/notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private assertAuthenticated(req: any) {
    if (!req?.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
  }

  @Get('me')
  getMyNotifications(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.notificationService.getUserNotifications(Number(req.user.id));
  }

  @Get('me/unread-count')
  getMyUnreadCount(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.notificationService.getUnreadCount(Number(req.user.id));
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.notificationService.markAllRead(Number(req.user.id));
  }

  @Patch(':id/read')
  markRead(
    @Param('id', ParseIntPipe) notificationId: number,
    @Req() req: any,
  ) {
    this.assertAuthenticated(req);
    return this.notificationService.markRead(
      notificationId,
      Number(req.user.id),
    );
  }
}
