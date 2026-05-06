import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadInvestorCertificateDto } from '../application/dto/upload-investor-certificate.dto';
import { InvestorCertificateService } from '../application/service/investor-certificate.service';

@Controller('investor-certificates')
export class InvestorCertificateController {
  constructor(
    private readonly investorCertificateService: InvestorCertificateService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadInvestorCertificateDto,
  ) {
    const userId = 'replace-with-auth-user-id';

    return this.investorCertificateService.uploadCertificate({
      userId,
      file,
      dto,
    });
  }
}
