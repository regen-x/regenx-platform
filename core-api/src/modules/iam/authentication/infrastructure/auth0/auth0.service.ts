import { HttpStatus, Injectable } from '@nestjs/common';
import { IIdentityProviderService } from '../../application/service/identity-provider.service.interface';
import {
  AuthenticationClient,
  GetUsers200ResponseOneOfInner,
  ManagementClient,
} from 'auth0';
import { ConfigService } from '@nestjs/config';
import { ISignInResponse } from '../../application/dto/sign-in-response.interface';
import { ISignUpResponse } from '../../application/dto/sign-up-response.interface';
import { ISuccessfulOperationResponse } from '../../../../../common/application/interface/successful-operation-response.interface';
import { CodeMismatchException } from './exception/code-mismatch.exception';
import * as crypto from 'crypto';
import { InvalidCredentialsException } from './exception/invalid-credentials.exception';
import { IRefreshSessionResponse } from '../../application/dto/refresh-session-response.interface';
import { AUTH_EXCEPTION_MESSAGES } from './exception/exception-messages';
import { IAuth0SignUpResponse } from './interface/sign-up-response.auth0.service.interface';
import { AUTH0_CONNECTION, AUTH0_SCOPE } from './constants/constants';
import { UnverifiedEmailException } from './exception/unverified-email.exception';
import { UnknownErrorException } from '../../../../../common/infrastructure/exception/unknown-error.exception';

@Injectable()
export class Auth0Service implements IIdentityProviderService {
  private readonly authClient: AuthenticationClient;
  private readonly managementClient: ManagementClient;

  constructor(private readonly configService: ConfigService) {
    this.authClient = new AuthenticationClient({
      domain: this.configService.get('auth0.domain'),
      clientId: this.configService.get('auth0.clientId'),
      clientSecret: this.configService.get('auth0.clientSecret'),
    });

    this.managementClient = new ManagementClient({
      domain: this.configService.get('auth0.domain'),
      clientId: this.configService.get('auth0.clientId'),
      clientSecret: this.configService.get('auth0.clientSecret'),
      audience: this.configService.get('auth0.audience'),
    });
  }

  async signUp(email: string, password: string): Promise<ISignUpResponse> {
    try {
      const {
        data: { _id: externalId },
      } = (await this.authClient.database.signUp({
        email,
        password,
        connection: AUTH0_CONNECTION,
      })) as unknown as IAuth0SignUpResponse;

      return { externalId };
    } catch {
      throw new UnknownErrorException({
        message: AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_SIGNING_UP,
      });
    }
  }

  async signIn(username: string, password: string): Promise<ISignInResponse> {
    try {
      const {
        data: { access_token: accessToken, refresh_token: refreshToken },
      } = await this.authClient.oauth.passwordGrant({
        username,
        password,
        scope: AUTH0_SCOPE,
      });

      return { accessToken, refreshToken };
    } catch (error) {
      if (
        error.error_description === 'Wrong email or password.' &&
        error.statusCode === HttpStatus.FORBIDDEN
      ) {
        throw new InvalidCredentialsException({
          message: AUTH_EXCEPTION_MESSAGES.INVALID_CREDENTIALS,
        });
      }
      if (
        error.error_description ===
        'Please verify your email before continuing.'
      ) {
        throw new UnverifiedEmailException({
          message: AUTH_EXCEPTION_MESSAGES.EMAIL_NOT_VERIFIED,
        });
      }

      throw new UnknownErrorException({
        message: AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_SIGNING_IN,
      });
    }
  }

  private async getUser(
    externalId: string,
  ): Promise<GetUsers200ResponseOneOfInner> {
    const { data: user } = await this.managementClient.users.get({
      id: `auth0|${externalId}`,
    });

    return user;
  }

  async resendConfirmationCode(
    externalId: string,
  ): Promise<ISuccessfulOperationResponse> {
    try {
      const user = await this.getUser(externalId);

      const newCode = this.generateSixDigitsCode();

      await this.managementClient.users.update(
        {
          id: `auth0|${externalId}`,
        },
        {
          user_metadata: {
            ...user.user_metadata,
            verificationCode: newCode,
          },
        },
      );

      await this.managementClient.jobs.verifyEmail({
        client_id: this.configService.get('auth0.clientId'),
        user_id: `auth0|${externalId}`,
      });

      return {
        success: true,
        message: 'A new verification link has been sent to your email',
      };
    } catch {
      throw new UnknownErrorException({
        message:
          AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_RESENDING_CONFIRMATION_CODE,
      });
    }
  }

  private generateSixDigitsCode(): string {
    const randomBytesBuffer = crypto.randomBytes(3);
    const randomNumber = randomBytesBuffer.readUIntBE(0, 3);

    const sixDigitsCode = (randomNumber % 900000) + 100000;

    return sixDigitsCode.toString();
  }

  async forgotPassword(
    email: string,
    externalId: string,
  ): Promise<ISuccessfulOperationResponse> {
    try {
      const user = await this.getUser(externalId);

      await this.managementClient.users.update(
        {
          id: `auth0|${externalId}`,
        },
        {
          user_metadata: {
            ...user.user_metadata,
            confirmNewPasswordCode: this.generateSixDigitsCode(),
          },
        },
      );

      await this.authClient.database.changePassword({
        email,
        connection: AUTH0_CONNECTION,
      });

      return {
        success: true,
        message: 'Password reset instructions have been sent',
      };
    } catch {
      throw new UnknownErrorException({
        message: AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_RESETTING_PASSWORD,
      });
    }
  }

  async confirmPassword(
    externalId: string,
    newPassword: string,
    code: string,
  ): Promise<ISuccessfulOperationResponse> {
    try {
      const { user_metadata } = await this.getUser(externalId);

      if (user_metadata.confirmNewPasswordCode !== code) {
        throw new CodeMismatchException({
          message: AUTH_EXCEPTION_MESSAGES.CODE_MISMATCH,
          pointer: '/confirm-password/code',
        });
      }

      await this.managementClient.users.update(
        {
          id: `auth0|${externalId}`,
        },
        {
          password: newPassword,
        },
      );

      return {
        success: true,
        message: 'Password successfully updated',
      };
    } catch (error) {
      if (error instanceof CodeMismatchException) {
        throw error;
      } else {
        throw new UnknownErrorException({
          message:
            AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_CONFIRMING_PASSWORD,
        });
      }
    }
  }

  async refreshSession(refreshToken: string): Promise<IRefreshSessionResponse> {
    try {
      const {
        data: { access_token: accessToken },
      } = await this.authClient.oauth.refreshTokenGrant({
        refresh_token: refreshToken,
        scope: AUTH0_SCOPE,
      });

      return { accessToken };
    } catch {
      throw new UnknownErrorException({
        message: AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_REFRESHING_SESSION,
      });
    }
  }
}
