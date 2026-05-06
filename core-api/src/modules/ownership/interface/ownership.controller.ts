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
import { OwnershipService } from '../application/service/ownership.service';
import { AppRole } from '../../iam/authorization/domain/app-role.enum';

@Controller('ownership')
export class OwnershipController {
  constructor(private readonly ownershipService: OwnershipService) {}

  private assertAdmin(req: any) {
    if (String(req?.user?.role ?? '') !== AppRole.Admin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('me')
  getMyOwnership(@Req() req: any) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.ownershipService.getOwnershipByUser(userId);
  }

  @Get('project/:projectId')
  getProjectOwnership(@Param('projectId', ParseIntPipe) projectId: number, @Req() req: any) {
    this.assertAdmin(req);
    return this.ownershipService.getProjectOwnership(projectId);
  }

  @Get('project/:projectId/series/:seriesId')
  getSeriesOwnership(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('seriesId', ParseIntPipe) seriesId: number,
    @Req() req: any,
  ) {
    this.assertAdmin(req);
    return this.ownershipService.getProjectOwnership(projectId, seriesId);
  }

  @Post('buy')
  buyPosition(
    @Req() req: any,
    @Body()
    body: {
      projectId: number;
      seriesId: number;
      tokenSymbol: string;
      amount: number;
      cashAmount?: number;
      feeAmount?: number;
      custodyType?: 'self_custody' | 'regenx_custody';
      walletAddress?: string | null;
      custodyAccountRef?: string | null;
      sellerWalletAddress?: string | null;
    },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.ownershipService.buyPosition({
      ...body,
      buyerUserId: userId,
    });
  }

  @Post('buy/build-transaction')
  buildBuyTransaction(
    @Req() req: any,
    @Body()
    body: {
      projectId: number;
      seriesId: number;
      tokenSymbol: string;
      amount: number;
      cashAmount?: number;
      feeAmount?: number;
      orderId?: number;
      custodyType?: 'self_custody' | 'regenx_custody';
      walletAddress?: string | null;
      sellerWalletAddress?: string | null;
    },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.ownershipService.buildBuyTransaction({
      ...body,
      buyerUserId: userId,
    });
  }

  @Post('buy/submit-transaction')
  submitBuyTransaction(
    @Req() req: any,
    @Body()
    body: {
      projectId: number;
      seriesId: number;
      tokenSymbol: string;
      amount: number;
      cashAmount?: number;
      feeAmount?: number;
      orderId?: number;
      custodyType?: 'self_custody' | 'regenx_custody';
      walletAddress?: string | null;
      sellerWalletAddress?: string | null;
      signedXdr: string;
    },
  ) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.ownershipService.submitBuyTransaction({
      ...body,
      buyerUserId: userId,
    });
  }
}
