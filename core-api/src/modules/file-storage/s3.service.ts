import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly bucket = process.env.AWS_S3_BUCKET!;
  private readonly region = process.env.AWS_REGION!;
  private readonly client = new S3Client({
    region: this.region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  async createPresignedUpload(params: {
    userId: string;
    category: 'wholesale' | 'support';
    fileName: string;
    contentType: string;
  }) {
    const ext = path.extname(params.fileName).toLowerCase();
    const safeName = `${Date.now()}${ext}`;
    const key = `kyc/users/${params.userId}/${params.category}/${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 60 });

    return {
      key,
      uploadUrl,
      bucket: this.bucket,
      region: this.region,
    };
  }

  async uploadBuffer(params: {
    userId: string;
    category: 'support';
    fileName: string;
    contentType: string;
    buffer: Buffer;
  }) {
    const ext = path.extname(params.fileName).toLowerCase();
    const safeName = `${Date.now()}${ext}`;
    const key = `${params.category}/users/${params.userId}/${safeName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: params.contentType,
        Body: params.buffer,
      }),
    );

    return {
      key,
      bucket: this.bucket,
      region: this.region,
    };
  }

  async createPresignedDownload(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(this.client, command, { expiresIn: 60 });
    return { downloadUrl };
  }
}
