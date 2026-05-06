import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { S3StorageService } from '../../../../common/infrastructure/storage/s3.storage.service';
import { UploadInvestorCertificateDto } from '../dto/upload-investor-certificate.dto';

@Injectable()
export class InvestorCertificateService {
  constructor(
    private readonly s3StorageService: S3StorageService,
    private readonly configService: ConfigService,
  ) {}

  async uploadCertificate(params: {
    userId: string;
    file: Express.Multer.File;
    dto: UploadInvestorCertificateDto;
  }) {
    const { userId, file, dto } = params;

    if (!file) {
      throw new BadRequestException('Certificate file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files allowed');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File exceeds 10MB');
    }

    const certificateId = randomUUID();
    const prefix = this.configService.get<string>(
      'AWS_S3_CERTIFICATES_PREFIX',
      'investor-certificates',
    );

    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${prefix}/${userId}/${certificateId}/${safeFileName}`;

    await this.s3StorageService.uploadFile({
      key,
      body: file.buffer,
      contentType: file.mimetype,
      metadata: {
        userId,
        certificateId,
        investorCategory: dto.investorCategory,
        qualificationMethod: dto.qualificationMethod,
      },
    });

    const uploadedAt = new Date();

    let expiresAt: Date | null = null;
    if (dto.issuedAt) {
      const issued = new Date(dto.issuedAt);
      expiresAt = new Date(issued);
      expiresAt.setFullYear(issued.getFullYear() + 2);
    }

    return {
      id: certificateId,
      userId,
      investorCategory: dto.investorCategory,
      qualificationMethod: dto.qualificationMethod,
      fileKey: key,
      fileName: file.originalname,
      uploadedAt,
      issuedAt: dto.issuedAt ?? null,
      expiresAt,
      status: 'pending_review',
    };
  }

  async getDownloadUrl(fileKey: string) {
    return this.s3StorageService.getSignedDownloadUrl(fileKey);
  }
}
