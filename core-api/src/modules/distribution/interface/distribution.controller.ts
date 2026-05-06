import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';

import { AppRole } from '../../iam/authorization/domain/app-role.enum';
import { DistributionService } from '../application/service/distribution.service';

@Controller(['distribution', 'distributions'])
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  private assertAuthenticated(req: any) {
    if (!req?.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
  }

  private assertAdmin(req: any) {
    this.assertAuthenticated(req);
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  private isAdmin(req: any) {
    return String(req?.user?.role ?? '') === AppRole.Admin;
  }

  @Get('me')
  getMyDistributions(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.distributionService.getUserDistributions(Number(req.user.id));
  }

  @Get('project/:projectId')
  getProjectDistributions(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
  ) {
    this.assertAuthenticated(req);
    return this.distributionService.getProjectDistributions(
      projectId,
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Get('summary/me')
  getMyDistributionSummary(@Req() req: any) {
    this.assertAuthenticated(req);
    return this.distributionService.getUserSummary(Number(req.user.id));
  }

  @Get('admin/project/:projectId/events')
  listProjectEvents(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.distributionService.listProjectEvents(projectId);
  }

  @Post('admin/project/:projectId/events')
  createDraftEvent(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertAdmin(req);
    return this.distributionService.createDraftEvent(
      projectId,
      Number(req?.user?.id ?? 0) || 0,
      body ?? {},
    );
  }

  @Get('admin/events/:eventId')
  getEventDetail(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.distributionService.getEventDetail(eventId);
  }

  @Post('admin/events/:eventId/calculate')
  calculateEntitlements(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.distributionService.calculateEntitlements(eventId);
  }
}
