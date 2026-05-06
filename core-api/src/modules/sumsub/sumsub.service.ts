import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class SumsubService {
  private readonly appToken = process.env.SUMSUB_APP_TOKEN!;
  private readonly secretKey = process.env.SUMSUB_SECRET_KEY!;
  private readonly baseUrl = process.env.SUMSUB_BASE_URL || 'https://api.sumsub.com';
  private readonly levelName = process.env.SUMSUB_LEVEL_NAME!;

  private sign(ts: number, method: string, uri: string, body = '') {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(String(ts) + method.toUpperCase() + uri + body)
      .digest('hex');
  }

  private headers(method: string, uri: string, body = '') {
    const ts = Math.floor(Date.now() / 1000);
    return {
      'X-App-Token': this.appToken,
      'X-App-Access-Sig': this.sign(ts, method, uri, body),
      'X-App-Access-Ts': String(ts),
      'Content-Type': 'application/json',
    };
  }

  async createApplicant(externalUserId: string, email?: string) {
    const uri = '/resources/applicants?levelName=' + encodeURIComponent(this.levelName);
    const body = JSON.stringify({
      externalUserId,
      email,
    });

    const response = await axios.post(this.baseUrl + uri, body, {
      headers: this.headers('POST', uri, body),
    });

    return response.data;
  }

  async generateAccessToken(userId: string, applicantId?: string) {
    const uri =
      '/resources/accessTokens?userId=' +
      encodeURIComponent(userId) +
      '&levelName=' +
      encodeURIComponent(this.levelName) +
      (applicantId ? `&applicantId=${encodeURIComponent(applicantId)}` : '') +
      '&ttlInSecs=1800';

    const body = '';

    const response = await axios({
      method: 'post',
      url: this.baseUrl + uri,
      headers: this.headers('POST', uri, body),
      data: body,
      transformRequest: [(data) => data],
    });

    return response.data;
  }
}
