import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  Headers,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { S3Service } from '../file-storage/s3.service';
import { SumsubService } from '../sumsub/sumsub.service';
import { InvestorVerificationService } from './investor-verification.service';
import { Auth } from '../iam/authentication/infrastructure/decorator/auth.decorator';
import { AuthType } from '../iam/authentication/domain/auth-type.enum';
import { AppRole } from '../iam/authorization/domain/app-role.enum';

@Controller('investor-verification')
export class InvestorVerificationController {
  private readonly logger = new Logger(InvestorVerificationController.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly sumsubService: SumsubService,
    private readonly verificationService: InvestorVerificationService,
  ) {}

  private async withWholesaleCertificateDownloadUrl(row: any) {
    if (!row?.wholesaleCertificateKey) {
      return {
        ...row,
        wholesaleCertificateDownloadUrl: null,
      };
    }

    try {
      const { downloadUrl } = await this.s3Service.createPresignedDownload(
        row.wholesaleCertificateKey,
      );

      return {
        ...row,
        wholesaleCertificateDownloadUrl: downloadUrl,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to create wholesale certificate download URL for investor userId=${String(row.userId ?? 'unknown')} key=${String(row.wholesaleCertificateKey)}`,
      );

      return {
        ...row,
        wholesaleCertificateDownloadUrl: null,
      };
    }
  }

  private isAdmin(req: any) {
    return String(req?.user?.role ?? '') === AppRole.Admin;
  }

  private assertAdmin(req: any) {
    if (!this.isAdmin(req)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  @Get('me')
  async me(@Req() req: any) {
    return this.verificationService.getEligibilitySnapshot(String(req.user.id));
  }

  @Post('aml')
  async saveAml(@Req() req: any, @Body() body: any) {
    return this.verificationService.saveAmlAnswers(String(req.user.id), body);
  }

  @Post('wholesale/upload-url')
  async createWholesaleUploadUrl(@Req() req: any, @Body() body: any) {
    if (body.contentType !== 'application/pdf') {
      throw new UnauthorizedException('Only PDF files allowed');
    }

    return this.s3Service.createPresignedUpload({
      userId: String(req.user.id),
      category: 'wholesale',
      fileName: body.fileName,
      contentType: body.contentType,
    });
  }

  @Post('wholesale/complete')
  async completeWholesaleUpload(@Req() req: any, @Body() body: any) {
    return this.verificationService.attachWholesaleCertificate(String(req.user.id), {
      key: body.key,
      originalName: body.originalName,
      expiryDate: body.expiryDate,
    });
  }

  @Post('sumsub/start')
  async startSumsub(@Req() req: any) {
    const userId = String(req.user.id);
    const email = req.user.email;

    const existing = await this.verificationService.getOrCreate(userId);

    let applicantId = existing.sumsubApplicantId;
    if (!applicantId) {
      const applicant = await this.sumsubService.createApplicant(userId, email);
      applicantId = applicant.id;
      await this.verificationService.setSumsubApplicant(userId, applicantId);
    }

    const token = await this.sumsubService.generateAccessToken(userId, applicantId);

    return {
      applicantId,
      token: token.token,
      userId,
    };
  }

  @Post('sumsub/webhook')
  @Auth(AuthType.None)
  async handleSumsubWebhook(
    @Headers('x-payload-digest') digest: string,
    @Body() body: any,
  ) {
    const secret = process.env.SUMSUB_WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException('Webhook secret missing');

    const raw = JSON.stringify(body);
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');

    if (digest !== expected) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const applicantId = body?.applicantId;
    const reviewStatus = body?.reviewResult?.reviewAnswer;

    if (applicantId && reviewStatus === 'GREEN') {
      await this.verificationService.updateSumsubStatusByApplicant(applicantId, 'approved');
    } else if (applicantId && reviewStatus === 'REVIEW_REQUIRED') {
      await this.verificationService.updateSumsubStatusByApplicant(
        applicantId,
        'review_required',
      );
    } else if (applicantId && reviewStatus === 'RED') {
      await this.verificationService.updateSumsubStatusByApplicant(applicantId, 'rejected');
    }

    return { ok: true };
  }

  @Get('admin')
  async adminQueue(@Req() req: any) {
    this.assertAdmin(req);
    const rows = await this.verificationService.getAdminQueue();

    return Promise.all(rows.map((row: any) => this.withWholesaleCertificateDownloadUrl(row)));
  }

  @Get('admin/:userId')
  async adminDetail(@Param('userId') userId: string, @Req() req: any) {
    this.assertAdmin(req);
    const row = await this.verificationService.getAdminDetail(userId);

    return this.withWholesaleCertificateDownloadUrl(row);
  }

  @Post('admin/:userId/review')
  async adminReview(@Param('userId') userId: string, @Req() req: any, @Body() body: any) {
    this.assertAdmin(req);
    return this.verificationService.adminReview(userId, {
      adminReviewStatus: body.adminReviewStatus,
      wholesaleStatus: body.wholesaleStatus,
      reviewedBy: String(req.user.id),
      reviewNotes: body.reviewNotes,
    });
  }

  @Post('admin/:userId/test-override')
  async enableAdminTestOverride(
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertAdmin(req);
    return this.verificationService.enableAdminTestInvestmentOverride(userId, {
      actorUserId: Number(req.user.id),
      actorRole: String(req.user.role ?? 'admin'),
      actorEmail: String(req.user.email ?? ''),
      note: body.note,
    });
  }

  @Post('admin/:userId/test-override/disable')
  async disableAdminTestOverride(
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertAdmin(req);
    return this.verificationService.disableAdminTestInvestmentOverride(userId, {
      actorUserId: Number(req.user.id),
      actorRole: String(req.user.role ?? 'admin'),
      actorEmail: String(req.user.email ?? ''),
      note: body.note,
    });
  }

  @Post('admin/:userId/override-mode')
  async setVerificationOverrideMode(
    @Param('userId') userId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    this.assertAdmin(req);
    return this.verificationService.setVerificationOverrideMode(userId, {
      actorUserId: Number(req.user.id),
      actorRole: String(req.user.role ?? 'admin'),
      actorEmail: String(req.user.email ?? ''),
      verificationOverrideMode:
        body.verificationOverrideMode === 'testnet' ? 'testnet' : 'none',
      note: body.note,
    });
  }

  @Get(':userId/can-invest')
  async canInvest(@Param('userId') userId: string, @Req() req: any) {
    const requesterId = String(req?.user?.id ?? '');
    if (!this.isAdmin(req) && requesterId !== String(userId)) {
      throw new ForbiddenException('You can only view your own investment eligibility');
    }

    const snapshot = await this.verificationService.getEligibilitySnapshot(userId);
    return {
      isEligible: snapshot.isEligible,
      canInvest: snapshot.canInvest,
      eligibilitySource: snapshot.eligibilitySource,
      testnetOverrideAvailable: snapshot.testnetOverrideAvailable,
      verificationOverrideMode: snapshot.verificationOverrideMode,
      reviewState: snapshot.reviewState,
      sumsubStatus: snapshot.sumsubStatus,
      adminReviewStatus: snapshot.adminReviewStatus,
      investorEligibilityStatus: snapshot.investorEligibilityStatus,
      testOverrideActive: snapshot.testOverrideActive,
      testInvestmentOverride: snapshot.testInvestmentOverride,
      testInvestmentOverrideSetAt: snapshot.testInvestmentOverrideSetAt,
      verificationSource: snapshot.verificationSource,
      wholesaleVerificationSource: snapshot.wholesaleVerificationSource,
      isTestVerification: snapshot.isTestVerification,
      testVerificationActive: snapshot.testVerificationActive,
      testVerificationAppliedAt: snapshot.testVerificationAppliedAt,
    };
  }
}
