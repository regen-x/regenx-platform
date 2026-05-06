import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { DeveloperProfileService } from '../application/service/developer-profile.service';
import { UpdateDeveloperCompanyDetailsDto } from '../application/dto/update-developer-company-details.dto';
import { UpdateDeveloperWalletSettingsDto } from '../application/dto/update-developer-wallet-settings.dto';
import { RequestCustodyModeChangeDto } from '../application/dto/request-custody-mode-change.dto';

@Controller('developer-profile')
export class DeveloperProfileController {
  constructor(private readonly service: DeveloperProfileService) {}

  @Get('me')
  getMine(@Req() req: any) {
    return this.service.getMine(Number(req.user.id));
  }

  @Get('settings')
  getSettingsSummary(@Req() req: any) {
    return this.service.getSettingsSummary(Number(req.user.id));
  }

  @Patch('settings/company')
  updateCompanyDetails(
    @Req() req: any,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: UpdateDeveloperCompanyDetailsDto,
  ) {
    return this.service.updateCompanyDetails(Number(req.user.id), body);
  }

  @Get('settings/wallet')
  getWalletSettings(@Req() req: any) {
    return this.service.getWalletSettings(Number(req.user.id));
  }

  @Patch('settings/wallet')
  updateWalletSettings(
    @Req() req: any,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: UpdateDeveloperWalletSettingsDto,
  ) {
    return this.service.updateWalletSettings(Number(req.user.id), body);
  }

  @Post('settings/custody-change-request')
  requestCustodyModeChange(
    @Req() req: any,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    body: RequestCustodyModeChangeDto,
  ) {
    return this.service.requestCustodyModeChange(Number(req.user.id), body);
  }

  @Get('settings/entity-linkage')
  getEntityLinkageSummary(@Req() req: any) {
    return this.service.getEntityLinkageSummary(Number(req.user.id));
  }

  @Post()
  save(@Req() req: any, @Body() body: any) {
    return this.service.createOrUpdate(Number(req.user.id), body);
  }

  @Post('submit')
  submit(@Req() req: any) {
    return this.service.submit(Number(req.user.id));
  }

  @Get('admin')
  getAllForAdmin() {
    return this.service.getAllForAdmin();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body?: { adminNotes?: string }) {
    return this.service.updateStatus(Number(id), 'approved', body?.adminNotes);
  }

  @Post(':id/request-revision')
  requestRevision(
    @Param('id') id: string,
    @Body() body?: { adminNotes?: string },
  ) {
    return this.service.updateStatus(
      Number(id),
      'changes_requested',
      body?.adminNotes,
    );
  }
}
