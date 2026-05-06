import { Controller, Get } from '@nestjs/common';
import { Auth } from '../../iam/authentication/infrastructure/decorator/auth.decorator';
import { AuthType } from '../../iam/authentication/domain/auth-type.enum';

@Controller('health')
@Auth(AuthType.None)
export class HealthController {
  @Get()
  async healthCheck(): Promise<{ status: string; uptime: number }> {
    return { status: 'ok', uptime: process.uptime() };
  }
}
