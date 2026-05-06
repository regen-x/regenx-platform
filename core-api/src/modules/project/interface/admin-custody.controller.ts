import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';

import { AppRole } from '../../iam/authorization/domain/app-role.enum';
import { ProjectService } from '../application/service/project.service';
import { ReviewCustodyChangeRequestDto } from '../application/dto/review-custody-change-request.dto';
import { MarkProjectCustodyReviewedDto } from '../application/dto/mark-project-custody-reviewed.dto';
import { UpdateProjectCustodyBlockDto } from '../application/dto/update-project-custody-block.dto';
import { CustodyParticipantType } from '../infrastructure/persistence/entities/custody-change-request.entity';

@Controller('admin/custody')
export class AdminCustodyController {
  constructor(private readonly service: ProjectService) {}

  private assertAdmin(req: any) {
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get()
  getQueue(@Req() req: any) {
    this.assertAdmin(req);
    return this.service.getAdminCustodyQueue();
  }

  @Get('detail')
  getDetail(
    @Req() req: any,
    @Query('projectId') projectId: string,
    @Query('participantType') participantType: CustodyParticipantType,
    @Query('participantId') participantId: string,
  ) {
    this.assertAdmin(req);
    return this.service.getAdminCustodyDetail({
      projectId,
      participantType,
      participantId,
    });
  }

  @Post('requests/:id/review')
  reviewRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: ReviewCustodyChangeRequestDto,
  ) {
    this.assertAdmin(req);
    return this.service.reviewCustodyChangeRequest(id, body, Number(req?.user?.id));
  }

  @Post('projects/:id/review')
  markReviewed(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: MarkProjectCustodyReviewedDto,
  ) {
    this.assertAdmin(req);
    return this.service.markProjectCustodyReviewed(
      id,
      body.adminNotes,
      Number(req?.user?.id),
    );
  }

  @Post('projects/:id/block-issuance')
  blockIssuance(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: UpdateProjectCustodyBlockDto,
  ) {
    this.assertAdmin(req);
    return this.service.blockProjectIssuanceForCustody(
      id,
      body.reason,
      body.adminNotes,
      Number(req?.user?.id),
    );
  }

  @Post('projects/:id/clear-issuance-block')
  clearIssuanceBlock(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: UpdateProjectCustodyBlockDto,
  ) {
    this.assertAdmin(req);
    return this.service.clearProjectCustodyIssuanceBlock(
      id,
      body.adminNotes,
      Number(req?.user?.id),
    );
  }
}
