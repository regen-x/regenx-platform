import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ProjectService } from '../application/service/project.service';
import { RpaSummaryService } from '../application/service/rpa-summary.service';
import { RequestProjectWalletChangeDto } from '../application/dto/request-project-wallet-change.dto';
import { PrepareProjectIssuanceDto } from '../application/dto/prepare-project-issuance.dto';
import { UpdateProjectEntitySpvLinkageDto } from '../application/dto/update-project-entity-spv-linkage.dto';
import { UpdateProjectWalletConfigDto } from '../application/dto/update-project-wallet-config.dto';
import { ProjectFilePurpose } from '../infrastructure/persistence/entities/project-file.entity';

import { Auth } from '../../iam/authentication/infrastructure/decorator/auth.decorator';
import { AuthType } from '../../iam/authentication/domain/auth-type.enum';
import { AppRole } from '../../iam/authorization/domain/app-role.enum';

@Controller('project')
export class ProjectController {
  constructor(
    private readonly service: ProjectService,
    private readonly rpaSummaryService: RpaSummaryService,
  ) {}

  private isAdmin(req: any) {
    return String(req?.user?.role ?? '') === AppRole.Admin;
  }

  private assertAdmin(req: any) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Auth(AuthType.None)
  @Get()
  getProjects() {
    return this.service.getProjects();
  }

  @Get('my')
  getMyProjects(@Req() req: any) {
    return this.service.getMyProjects(Number(req.user.id));
  }

  @Get('admin')
  getAdminProjects(@Req() req: any) {
    this.assertAdmin(req);
    return this.service.getAdminProjects();
  }

  @Auth(AuthType.None)
  @Get('public/:id')
  getPublicProject(@Param('id') id: string) {
    return this.service.getPublicProject(id);
  }

  @Get(':id/rpa-summary')
  getRpaSummary(@Param('id') id: string) {
    return this.rpaSummaryService.generateRpaSummary(id);
  }

  @Get(':id')
  getProject(@Param('id') id: string, @Req() req: any) {
    return this.service.getProject(id, Number(req.user.id), this.isAdmin(req));
  }

  @Get(':id/investors')
  getProjectInvestors(@Param('id') id: string, @Req() req: any) {
    return this.service.getProjectInvestors(
      id,
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Post()
  createProject(@Body() body: any, @Req() req: any) {
    return this.service.createProject(body ?? {}, Number(req.user.id));
  }

  @Patch(':id')
  updateProject(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.updateProject(
      id,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch(':id/draft')
  saveDraft(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.saveDraft(
      id,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Post(':id/assets')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  uploadProjectFile(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { purpose: ProjectFilePurpose; documentKey?: string },
  ) {
    return this.service.uploadProjectFile({
      projectId: id,
      userId: Number(req?.user?.id ?? 0) || null,
      isAdmin: this.isAdmin(req),
      file,
      purpose: body?.purpose,
      documentKey: body?.documentKey,
      uploadedBy: Number(req?.user?.id ?? 0) || null,
    });
  }

  @Post(':id/submit')
  submitProject(@Param('id') id: string, @Req() req: any) {
    return this.service.submitProject(id, Number(req.user.id));
  }

  @Get(':id/wallet-config')
  getProjectWalletConfig(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.service.getProjectWalletConfig(id);
  }

  @Get(':id/wallet-config/readiness')
  validateProjectWalletReadiness(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.service.validateProjectWalletReadiness(id);
  }

  @Get(':id/wallet-config/history')
  getProjectWalletHistory(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.service.getProjectWalletHistory(id);
  }

  @Get(':id/entity-spv-summary')
  getProjectEntitySpvSummary(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.service.getProjectEntitySpvSummary(id);
  }

  @Patch(':id/entity-spv-linkage')
  updateProjectEntitySpvLinkage(
    @Param('id') id: string,
    @Body() body: UpdateProjectEntitySpvLinkageDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.service.updateProjectEntitySpvLinkage(id, body, Number(req?.user?.id));
  }

  @Post(':id/prepare-issuance')
  prepareProjectForIssuance(
    @Param('id') id: string,
    @Body() body: PrepareProjectIssuanceDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.service.prepareProjectForIssuance(
      id,
      Number(req?.user?.id),
      body?.reason,
    );
  }

  @Patch(':id/wallet-config')
  updateProjectWalletConfig(
    @Param('id') id: string,
    @Body() body: UpdateProjectWalletConfigDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.service.updateProjectWalletConfig(id, body, Number(req?.user?.id));
  }

  @Post(':id/wallet-config/change-request')
  requestProjectWalletChange(
    @Param('id') id: string,
    @Body() body: RequestProjectWalletChangeDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.service.requestPostIssuanceWalletChange(id, body, Number(req?.user?.id));
  }

  @Post(':id/approve')
  approveProject(@Param('id') id: string, @Req() req: any, @Body() body?: { adminNotes?: string }) {
    this.assertAdmin(req);
    return this.service.approveProject(id, body?.adminNotes);
  }

  @Post(':id/issue')
  issueProject(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    this.assertAdmin(req);
    return this.service.issueProject(id, body?.adminNotes, Number(req?.user?.id));
  }

  @Post(':id/live')
  goLive(@Param('id') id: string, @Req() req: any) {
    this.assertAdmin(req);
    return this.service.goLive(id);
  }

  @Post(':id/request-revision')
  requestRevision(@Param('id') id: string, @Req() req: any, @Body() body?: { adminNotes?: string }) {
    this.assertAdmin(req);
    return this.service.requestChanges(id, body?.adminNotes);
  }

  @Post(':id/reject')
  rejectProject(@Param('id') id: string, @Req() req: any, @Body() body?: { adminNotes?: string }) {
    this.assertAdmin(req);
    return this.service.requestChanges(id, body?.adminNotes);
  }

  @Post(':id/delete')
  deleteProject(@Param('id') id: string, @Req() req: any) {
    return this.service.softDeleteProject(
      id,
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Post(':id/lock')
  lockProject(@Param('id') id: string, @Req() req: any, @Body() body?: { reason?: string }) {
    this.assertAdmin(req);
    return this.service.lockProject(id, body?.reason);
  }
}
