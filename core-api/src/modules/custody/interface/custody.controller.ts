import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

import { AppRole } from '../../iam/authorization/domain/app-role.enum';
import { CustodyAccountService } from '../application/service/custody-account.service';

@Controller('custody')
export class CustodyController {
  constructor(private readonly custodyAccountService: CustodyAccountService) {}

  private assertAdmin(req: any) {
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('investors/:investorId')
  async getInvestorCustody(
    @Param('investorId') investorId: string,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.custodyAccountService.getInvestorCustodySummary(investorId);
  }

  @Post('investors/:investorId/create-or-retry')
  async createOrRetryInvestorCustody(
    @Param('investorId') investorId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertAdmin(req);
    return this.custodyAccountService.getOrCreateInvestorCustodyAccount({
      investorId,
      userId: body?.userId ?? investorId,
      fundId: body?.fundId,
      provider: body?.provider,
      mode: body?.mode,
      forceRetry: true,
      metadata: {
        triggeredBy: req?.user?.id ?? null,
        trigger: 'admin_retry',
      },
      requireExplicitProvider: true,
    });
  }

  @Post('investors/:investorId/asset-wallet')
  async createAssetWallet(
    @Param('investorId') investorId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertAdmin(req);
    return this.custodyAccountService.createAssetWallet({
      investorId,
      assetCode: body.assetCode,
      issuer: body.issuer,
    });
  }

  @Post('transfers')
  async transfer(@Req() req: any, @Body() body: any) {
    this.assertAdmin(req);
    return this.custodyAccountService.transferAsset({
      sourceAccountId: body.sourceAccountId,
      toInvestorId: body.toInvestorId ?? body.investorId,
      projectId: body.projectId,
      orderId: body.orderId,
      assetCode: body.assetCode,
      issuer: body.issuer,
      amount: String(body.amount),
      reference: body.reference,
      metadata: {
        manualAdminTransfer: true,
        triggeredBy: req?.user?.id ?? null,
        ...(body.metadata ?? {}),
      },
    });
  }

  @Post('webhooks/fireblocks')
  async fireblocksWebhook(
    @Headers('x-fireblocks-signature') signature: string | undefined,
    @Body() body: any,
  ) {
    /*
     * TODO: replace this placeholder HMAC check with the exact Fireblocks
     * tenant webhook verification method when production credentials and
     * documentation are finalised.
     */
    const secret = process.env.FIREBLOCKS_WEBHOOK_SECRET;
    if (process.env.NODE_ENV === 'production' && !secret) {
      throw new UnauthorizedException(
        'Fireblocks webhook signature verification is not configured',
      );
    }

    if (secret && signature) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
      if (signature !== expected) {
        throw new UnauthorizedException('Invalid Fireblocks webhook signature');
      }
    }

    return this.custodyAccountService.handleFireblocksWebhook(body);
  }
}
