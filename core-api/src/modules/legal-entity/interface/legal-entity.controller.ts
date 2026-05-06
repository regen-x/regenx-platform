import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';

import { AppRole } from '../../iam/authorization/domain/app-role.enum';
import { LegalEntityService } from '../application/service/legal-entity.service';
import { UpsertLegalEntityDto } from '../application/dto/upsert-legal-entity.dto';

@Controller('legal-entity')
export class LegalEntityController {
  constructor(private readonly legalEntityService: LegalEntityService) {}

  private assertAdmin(req: any) {
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('admin')
  listEntities(@Req() req: any) {
    this.assertAdmin(req);
    return this.legalEntityService.listEntities();
  }

  @Get('admin/:id')
  getEntityDetail(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    this.assertAdmin(req);
    return this.legalEntityService.getEntityDetail(id);
  }

  @Post('admin')
  createEntity(@Body() body: UpsertLegalEntityDto, @Req() req: any) {
    this.assertAdmin(req);
    return this.legalEntityService.createEntity(body, Number(req?.user?.id));
  }

  @Patch('admin/:id')
  updateEntity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpsertLegalEntityDto,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.legalEntityService.updateEntity(id, body, Number(req?.user?.id));
  }
}
