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
} from '@nestjs/common';
import { SpvService } from '../application/spv.service';
import { AppRole } from '../../iam/authorization/domain/app-role.enum';
import { UpsertSpvRoleDto } from '../application/dto/upsert-spv-role.dto';
import { UpsertSpvDto } from '../application/dto/upsert-spv.dto';

@Controller('spv')
export class SpvController {
  constructor(private readonly spvService: SpvService) {}

  private assertAdmin(req: any) {
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('admin')
  listSpvs(@Req() req: any) {
    this.assertAdmin(req);
    return this.spvService.listSpvs();
  }

  @Get('admin/issuance-pipeline')
  listIssuancePipeline(@Req() req: any) {
    this.assertAdmin(req);
    return this.spvService.listIssuancePipeline();
  }

  @Get('admin/issuance-pipeline/summary')
  getIssuancePipelineSummary(@Req() req: any) {
    this.assertAdmin(req);
    return this.spvService.getIssuancePipelineSummary();
  }

  @Get('admin/issuance-pipeline/project/:projectId')
  getIssuancePipelineDetailByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.spvService.getIssuancePipelineDetailByProject(projectId);
  }

  @Get('admin/issuance-pipeline/spv/:spvId')
  getIssuancePipelineDetailBySpv(
    @Param('spvId', ParseIntPipe) spvId: number,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.spvService.getIssuancePipelineDetailBySpv(spvId);
  }

  @Post('admin/issuance-pipeline/project/:projectId/prepare')
  prepareDraftSpvForPipelineProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.spvService.prepareDraftSpvForProject(
      projectId,
      Number(req?.user?.id),
      body?.reason,
    );
  }

  @Get('admin/:id')
  getSpvDetail(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    this.assertAdmin(req);
    return this.spvService.getSpvDetail(id);
  }

  @Post('admin')
  createSpv(@Body() body: UpsertSpvDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.spvService.createSpv(body as any, Number(req?.user?.id));
  }

  @Patch('admin/:id')
  updateSpv(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpsertSpvDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.spvService.updateSpv(id, body as any, Number(req?.user?.id));
  }

  @Post('admin/:id/linked-parties')
  upsertSpvRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpsertSpvRoleDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.spvService.upsertSpvRole(id, body, Number(req?.user?.id));
  }

  @Post('admin/:id/linked-parties/:roleLinkId/reject')
  rejectSpvRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('roleLinkId', ParseIntPipe) roleLinkId: number,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.spvService.rejectSpvRole(id, roleLinkId, body?.reason, Number(req?.user?.id));
  }

  @Post('project/:projectId/create-series')
  async createSeriesForProject(
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.spvService.createSeriesForProject(projectId);
  }
}
