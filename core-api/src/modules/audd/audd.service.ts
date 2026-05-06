import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';

import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  Method,
} from 'axios';

type AuddTokenSet = {
  token: string;
  refreshToken: string;
  expiresAt: number;
};

type AuddAuthResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  refreshToken?: string;
  expiresAt?: number | string;
  expiresIn?: number;
};

type AuddRequestOptions = {
  headers?: Record<string, string>;
};

const AUDD_DEFAULT_BASE_URL = 'https://api.sandbox.audd.digital';
const AUDD_TOKEN_TTL_MS = 5 * 60 * 1000;
const AUDD_REFRESH_SKEW_MS = 60 * 1000;

function base32Decode(value: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = value
    .replace(/=+$/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let bitCount = 0;

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new ServiceUnavailableException('AUDD MFA secret is invalid');
    }

    bits = (bits << 5) | index;
    bitCount += 5;

    if (bitCount >= 8) {
      bytes.push((bits >> (bitCount - 8)) & 0xff);
      bitCount -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateTotp(secret: string) {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(binary % 1_000_000).padStart(6, '0');
}

@Injectable()
export class AuddService {
  private readonly logger = new Logger(AuddService.name);
  private client: AxiosInstance | null = null;
  private tokenSet: AuddTokenSet | null = null;
  private authPromise: Promise<AuddTokenSet> | null = null;

  getTokenState() {
    return {
      tokenCached: Boolean(this.tokenSet?.token),
      tokenExpiresAt: this.tokenSet?.expiresAt
        ? new Date(this.tokenSet.expiresAt).toISOString()
        : null,
    };
  }

  private getRequiredEnv(name: string) {
    const value = process.env[name];
    if (!value) {
      throw new ServiceUnavailableException(
        `AUDD configuration missing: ${name}`,
      );
    }

    return value;
  }

  private getBaseUrl() {
    return process.env.AUDD_API_URL || AUDD_DEFAULT_BASE_URL;
  }

  private getClient() {
    if (this.client) {
      return this.client;
    }

    const httpsAgent = new https.Agent({
      cert: fs.readFileSync(this.getRequiredEnv('AUDD_CLIENT_CERT_FILE')),
      key: fs.readFileSync(this.getRequiredEnv('AUDD_CLIENT_KEY_FILE')),
      rejectUnauthorized: true,
    });

    this.client = axios.create({
      baseURL: this.getBaseUrl(),
      httpsAgent,
      timeout: 30000,
    });

    return this.client;
  }

  private toSafeError(error: unknown, fallbackMessage: string) {
    if (error instanceof ServiceUnavailableException) {
      return error;
    }

    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    return new ServiceUnavailableException({
      message: fallbackMessage,
      status,
    });
  }

  private parseTokenSet(data: AuddAuthResponse): AuddTokenSet {
    const token = data?.token || data?.accessToken || data?.jwt;
    const refreshToken = data?.refreshToken;

    if (!token || !refreshToken) {
      throw new ServiceUnavailableException(
        'AUDD authentication response invalid',
      );
    }

    const expiresAt =
      typeof data.expiresAt === 'number'
        ? data.expiresAt
        : typeof data.expiresAt === 'string'
          ? Date.parse(data.expiresAt)
          : typeof data.expiresIn === 'number'
            ? Date.now() + data.expiresIn * 1000
            : Date.now() + AUDD_TOKEN_TTL_MS;

    return {
      token,
      refreshToken,
      expiresAt: Number.isFinite(expiresAt)
        ? expiresAt
        : Date.now() + AUDD_TOKEN_TTL_MS,
    };
  }

  private setTokenSet(data: AuddAuthResponse) {
    this.tokenSet = this.parseTokenSet(data);
    return this.tokenSet;
  }

  private isTokenFresh() {
    return Boolean(
      this.tokenSet?.token &&
      this.tokenSet.expiresAt - AUDD_REFRESH_SKEW_MS > Date.now(),
    );
  }

  private async runAuthOperation(
    operation: () => Promise<AuddTokenSet>,
  ): Promise<AuddTokenSet> {
    if (!this.authPromise) {
      this.authPromise = operation().finally(() => {
        this.authPromise = null;
      });
    }

    return this.authPromise;
  }

  private getHeaderValue(headers: unknown, name: string) {
    if (!headers || typeof headers !== 'object') {
      return undefined;
    }

    const record = headers as Record<string, string | string[] | undefined>;
    const value = record[name] ?? record[name.toLowerCase()];
    return Array.isArray(value) ? value.join(',') : value;
  }

  private logAuddResponse(
    method: string,
    path: string,
    status: number | undefined,
    durationMs: number,
    headers: unknown,
  ) {
    const requestIds = [
      ['x-amzn-requestid', this.getHeaderValue(headers, 'x-amzn-requestid')],
      ['x-amz-apigw-id', this.getHeaderValue(headers, 'x-amz-apigw-id')],
      ['x-amzn-trace-id', this.getHeaderValue(headers, 'x-amzn-trace-id')],
    ]
      .filter(([, value]) => Boolean(value))
      .map(([name, value]) => `${name}=${value}`)
      .join(' ');

    const message =
      `AUDD ${method.toUpperCase()} ${path} status=${status ?? 'unknown'} ` +
      `durationMs=${durationMs}${requestIds ? ` ${requestIds}` : ''}`;

    if (status && status >= 500) {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }

  private async executeWithLogging<T>(config: AxiosRequestConfig) {
    const method = String(config.method || 'GET').toUpperCase();
    const path = String(config.url || '');
    const startedAt = Date.now();

    try {
      const response = await this.getClient().request<T>(config);
      this.logAuddResponse(
        method,
        path,
        response.status,
        Date.now() - startedAt,
        response.headers,
      );
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logAuddResponse(
        method,
        path,
        axiosError.response?.status,
        Date.now() - startedAt,
        axiosError.response?.headers,
      );
      throw error;
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isAuthError(error: unknown) {
    const status = (error as AxiosError).response?.status;
    return status === 401 || status === 403;
  }

  private isRetryableServerError(error: unknown) {
    const status = (error as AxiosError).response?.status;
    return typeof status === 'number' && status >= 500;
  }

  private async performLoginMfa(): Promise<AuddTokenSet> {
    const baseUrl = this.getBaseUrl();
    const username = this.getRequiredEnv('AUDD_USERNAME');
    const password = this.getRequiredEnv('AUDD_PASSWORD');
    const mfaSecret = this.getRequiredEnv('AUDD_MFA_SECRET');
    const apiKey = this.getRequiredEnv('AUDD_API_KEY');
    const certFile = this.getRequiredEnv('AUDD_CLIENT_CERT_FILE');
    const keyFile = this.getRequiredEnv('AUDD_CLIENT_KEY_FILE');

    this.logger.log('AUDD performLoginMfa called');
    this.logger.log({
      message: 'AUDD performLoginMfa config',
      baseUrl,
      username,
      certFile,
      keyFile,
      mfaSecretLength: mfaSecret.length,
      apiKeyLength: apiKey.length,
    });

    try {
      const httpsAgent = new https.Agent({
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile),
        rejectUnauthorized: true,
      });

      const response = await axios.post(
        `${baseUrl}/mfa/login`,
        {
          username,
          password,
          mfaCode: generateTotp(mfaSecret),
        },
        {
          httpsAgent,
          timeout: 30000,
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      return this.setTokenSet(response.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error('AUDD LOGIN FAILURE RAW:');
      this.logger.error({
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        code: axiosError.code,
        message: axiosError.message,
        name: axiosError.name,
        cause:
          axiosError.cause instanceof Error
            ? axiosError.cause.message
            : undefined,
      });

      this.tokenSet = null;
      throw this.toSafeError(error, 'AUDD MFA login failed');
    }
  }

  async loginMfa(): Promise<AuddTokenSet> {
    return this.runAuthOperation(() => this.performLoginMfa());
  }

  async refreshJwt(): Promise<AuddTokenSet> {
    return this.runAuthOperation(async () => {
      if (!this.tokenSet?.token || !this.tokenSet.refreshToken) {
        return this.performLoginMfa();
      }

      try {
        const response = await this.executeWithLogging<AuddAuthResponse>({
          method: 'POST',
          url: '/login/jwt/refresh',
          data: {
            accessToken: this.tokenSet?.token,
            refreshToken: this.tokenSet?.refreshToken,
          },
        });

        return this.setTokenSet(response.data);
      } catch {
        this.tokenSet = null;
        return this.performLoginMfa();
      }
    });
  }

  async getToken(): Promise<string> {
    if (this.isTokenFresh() && this.tokenSet?.token) {
      return this.tokenSet.token;
    }

    const tokenSet = this.tokenSet?.refreshToken
      ? await this.refreshJwt()
      : await this.loginMfa();

    return tokenSet.token;
  }

  async request<T = any>(
    method: string,
    path: string,
    body?: any,
    options?: AuddRequestOptions,
  ): Promise<T> {
    const backoffs = [300, 900];
    let didRefreshForAuth = false;

    for (let attempt = 0; attempt <= backoffs.length; attempt += 1) {
      const token = await this.getToken();

      try {
        const response = await this.executeWithLogging<T>({
          method: method as Method,
          url: path,
          data: body,
          headers: {
            ...(options?.headers ?? {}),
            Authorization: `Bearer ${token}`,
          },
        });

        return response.data;
      } catch (error) {
        if (this.isAuthError(error) && !didRefreshForAuth) {
          didRefreshForAuth = true;
          await this.refreshJwt();
          continue;
        }

        if (attempt < backoffs.length && this.isRetryableServerError(error)) {
          await this.sleep(backoffs[attempt]);
          continue;
        }

        throw this.toSafeError(error, 'AUDD authenticated request failed');
      }
    }

    throw new ServiceUnavailableException('AUDD authenticated request failed');
  }
}
