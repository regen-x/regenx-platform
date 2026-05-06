import { Controller, ForbiddenException, Get, Req } from '@nestjs/common';

import { AuddService } from './audd.service';
import { AppRole } from '../iam/authorization/domain/app-role.enum';

@Controller()
export class AuddController {
  constructor(private readonly auddService: AuddService) {}

  private assertAdmin(req: any) {
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('internal/audd/health')
  async health(@Req() req: any) {
    this.assertAdmin(req);

    const lastCheckedAt = new Date().toISOString();

    try {
      const data = await this.auddService.request<any>('GET', '/users');
      const tokenState = this.auddService.getTokenState();
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : null;

      return {
        status: 'ok',
        auddReachable: true,
        authenticated: true,
        tokenCached: tokenState.tokenCached,
        tokenExpiresAt: tokenState.tokenExpiresAt,
        lastCheckedAt,
        ...(items ? { sampleUserCount: items.length } : {}),
      };
    } catch (error) {
      const tokenState = this.auddService.getTokenState();

      return {
        status: 'error',
        auddReachable: false,
        authenticated: false,
        tokenCached: tokenState.tokenCached,
        tokenExpiresAt: tokenState.tokenExpiresAt,
        lastCheckedAt,
        error:
          error instanceof Error ? error.message : 'AUDD health check failed',
      };
    }
  }

  @Get('audd/test')
  async test() {
    const data = await this.auddService.request('GET', '/users');

    return {
      success: true,
      data,
    };
  }
}
