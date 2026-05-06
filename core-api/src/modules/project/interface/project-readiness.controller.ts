import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';

import { AppRole } from '../../iam/authorization/domain/app-role.enum';
import { ProjectReadinessService } from '../application/service/project-readiness.service';

@Controller('project/:projectId/readiness')
export class ProjectReadinessController {
  constructor(private readonly service: ProjectReadinessService) {}

  private isAdmin(req: any) {
    return String(req?.user?.role ?? '') === AppRole.Admin;
  }

  @Get()
  getReadiness(@Param('projectId') projectId: string, @Req() req: any) {
    return this.service.getReadiness(projectId, Number(req.user.id), this.isAdmin(req));
  }

  @Get(':section')
  getSection(
    @Param('projectId') projectId: string,
    @Param('section') section: any,
    @Req() req: any,
  ) {
    return this.service.getSection(
      projectId,
      section,
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch('energy-configuration')
  saveEnergyConfiguration(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.service.saveEnergyConfiguration(
      projectId,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch('revenue-profile')
  saveRevenueProfile(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.service.saveRevenueProfile(
      projectId,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch('revenue')
  saveRevenue(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.service.saveRevenueProfile(
      projectId,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch('cashflow-allocation')
  saveCashflowAllocation(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.service.saveCashflowAllocation(
      projectId,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch('risk-inputs')
  saveRiskInputs(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.service.saveRiskInputs(
      projectId,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch('investment-structure')
  saveInvestmentStructure(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.service.saveInvestmentStructure(
      projectId,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Patch('issuance')
  saveIssuance(
    @Param('projectId') projectId: string,
    @Body() body: Record<string, any>,
    @Req() req: any,
  ) {
    return this.service.saveIssuance(
      projectId,
      body ?? {},
      Number(req.user.id),
      this.isAdmin(req),
    );
  }

  @Post('return-outputs/calculate')
  calculateReturns(@Param('projectId') projectId: string, @Req() req: any) {
    return this.service.calculateReturns(
      projectId,
      Number(req.user.id),
      this.isAdmin(req),
    );
  }
}
