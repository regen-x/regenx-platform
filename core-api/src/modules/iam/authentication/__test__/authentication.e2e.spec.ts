import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { loadFixtures } from '../../../../../data/util/loader';
import {
  identityProviderServiceMock,
  testModuleBootstrapper,
} from '../../../../test/test.module.bootstrapper';
import { setupApp } from '../../../../configuration/app.configuration';
import { createAccessToken } from '../../../../test/test.util';
import { TokenExpiredException } from '../application/exception/token-expired.exception';
import {
  TOKEN_EXPIRED_ERROR,
  USER_ALREADY_SIGNED_UP_ERROR,
} from '../application/exception/authentication-exception-messages';
import { ISignInResponse } from '../application/dto/sign-in-response.interface';
import { AUTHENTICATION_NAME } from '../domain/authentication.name';
import { CodeMismatchException } from '../infrastructure/auth0/exception/code-mismatch.exception';
import { IForgotPasswordDto } from '../application/dto/forgot-password.dto.interface';
import { IConfirmPasswordDto } from '../application/dto/confirm-password.dto.interface';
import { IResendConfirmationCodeDto } from '../application/dto/resend-confirmation-code.dto.interface';
import { IRefreshSessionResponse } from '../application/dto/refresh-session-response.interface';
import { IRefreshSessionDto } from '../application/dto/refresh-session.dto.interface';
import { join } from 'path';
import { InvalidCredentialsException } from '../infrastructure/auth0/exception/invalid-credentials.exception';
import { AUTH_EXCEPTION_MESSAGES } from '../infrastructure/auth0/exception/exception-messages';
import { EmailNotFoundException } from '../../user/infrastructure/database/exception/email-not-found.exception';
import {
  mockInexistentSignInDto,
  mockValidSignInDto,
  mockValidSignUpDto,
} from './mocks/authentication.e2e.mocks';
import { UnverifiedEmailException } from '../infrastructure/auth0/exception/unverified-email.exception';
import { UnknownErrorException } from '../../../../common/infrastructure/exception/unknown-error.exception';

describe('Authentication Module', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await loadFixtures(
      `${__dirname}/fixture`,
      join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'configuration/orm.configuration.ts',
      ),
    );
    const moduleRef = await testModuleBootstrapper();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Guards', () => {
    describe('Access Token', () => {
      it('Should allow requests that contain a valid token', async () => {
        const accessToken = createAccessToken({
          sub: '00000000-0000-0000-0000-00000000000X',
        });

        await request(app.getHttpServer())
          .get('/api/v1/user')
          .auth(accessToken, { type: 'bearer' })
          .expect(HttpStatus.OK);
      });

      it('Should deny requests that contain an invalid token', async () => {
        const accessToken = createAccessToken({
          sub: 'non-existent-user-id',
        });

        await request(app.getHttpServer())
          .get('/api/v1/user')
          .auth(accessToken, { type: 'bearer' })
          .expect(HttpStatus.FORBIDDEN);
      });
      it('Should respond with an exception if the access token is expired', async () => {
        const expiration = '0ms';
        const accessToken = createAccessToken(
          {
            sub: '00000000-0000-0000-0000-00000000000X',
          },
          { expiresIn: expiration },
        );

        await request(app.getHttpServer())
          .get('/api/v1/user')
          .auth(accessToken, { type: 'bearer' })
          .expect(HttpStatus.UNAUTHORIZED)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(
              new TokenExpiredException(TOKEN_EXPIRED_ERROR).message,
            );
          });
      });
    });
  });

  describe('API', () => {
    describe('POST - /auth/sign-up', () => {
      it('Should allow users to sign up', async () => {
        const externalId = '00000000-0000-0000-0000-000000000001';
        identityProviderServiceMock.signUp.mockResolvedValueOnce({
          externalId,
        });

        await request(app.getHttpServer())
          .post('/api/v1/auth/sign-up')
          .send(mockValidSignUpDto)
          .expect(HttpStatus.CREATED)
          .then(({ body }) => {
            const expectedResponse = expect.objectContaining({
              data: expect.objectContaining({
                attributes: expect.objectContaining({
                  email: mockValidSignUpDto.email,
                  externalId,
                }),
              }),
            });
            expect(body).toEqual(expectedResponse);
          });
      });

      it('Should throw an error if user already signed up', async () => {
        const externalId = '00000000-0000-0000-0000-000000000003';
        identityProviderServiceMock.signUp.mockResolvedValueOnce({
          externalId,
        });

        await request(app.getHttpServer())
          .post('/api/v1/auth/sign-up')
          .send(mockValidSignUpDto)
          .expect(HttpStatus.BAD_REQUEST)
          .then(({ body }) => {
            expect(body.error.detail).toBe(USER_ALREADY_SIGNED_UP_ERROR);
            expect(body.error.source.pointer).toBe('/user/externalId');
          });
      });
    });

    describe('POST - /auth/sign-in', () => {
      it('Should allow users to sign in when provided a correct email and password', async () => {
        const serviceResponse: ISignInResponse = {
          accessToken: 'accessToken',
          refreshToken: 'refreshToken',
        };

        identityProviderServiceMock.signIn.mockResolvedValueOnce(
          serviceResponse,
        );

        await request(app.getHttpServer())
          .post('/api/v1/auth/sign-in')
          .send(mockValidSignInDto)
          .expect(HttpStatus.OK)
          .then(({ body }) => {
            const expectedResponse = expect.objectContaining({
              data: expect.objectContaining({
                type: AUTHENTICATION_NAME,
                attributes: expect.objectContaining({
                  ...serviceResponse,
                }),
              }),
              links: expect.objectContaining({
                self: expect.any(String),
              }),
            });
            expect(body).toEqual(expectedResponse);
          });
      });

      it('Should send an UserNotFound error when provided an invalid email', async () => {
        const error = new EmailNotFoundException({
          email: mockInexistentSignInDto.email,
        });

        await request(app.getHttpServer())
          .post('/api/v1/auth/sign-in')
          .send(mockInexistentSignInDto)
          .expect(HttpStatus.NOT_FOUND)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });

      it('Should send an InvalidCredentialsException error provided a valid user but invalid password', async () => {
        const error = new InvalidCredentialsException({
          message: AUTH_EXCEPTION_MESSAGES.INVALID_CREDENTIALS,
        });

        identityProviderServiceMock.signIn.mockRejectedValueOnce(error);

        await request(app.getHttpServer())
          .post('/api/v1/auth/sign-in')
          .send(mockValidSignInDto)
          .expect(HttpStatus.UNAUTHORIZED)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });

      it('Should send an UnverifiedEmailException error provided a valid user but unverified email', async () => {
        const error = new UnverifiedEmailException({
          message: AUTH_EXCEPTION_MESSAGES.EMAIL_NOT_VERIFIED,
        });

        identityProviderServiceMock.signIn.mockRejectedValueOnce(error);

        await request(app.getHttpServer())
          .post('/api/v1/auth/sign-in')
          .send(mockValidSignInDto)
          .expect(HttpStatus.UNAUTHORIZED)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });

      it('Should send an UnknownErrorException error when receiving uncovered error codes', async () => {
        const error = new UnknownErrorException({
          message: AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_SIGNING_IN,
        });

        identityProviderServiceMock.signIn.mockRejectedValueOnce(error);

        await request(app.getHttpServer())
          .post('/api/v1/auth/sign-in')
          .send(mockValidSignInDto)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });
    });

    describe('POST - /auth/forgot-password', () => {
      const url = '/api/v1/auth/forgot-password';
      it('Should respond with a success message when provided a email to forgot password', async () => {
        identityProviderServiceMock.forgotPassword.mockResolvedValueOnce({
          success: true,
          message: 'Password reset instructions have been sent',
        });

        const forgotPasswordDto: IForgotPasswordDto = {
          email: 'admin@test.com',
        };

        await request(app.getHttpServer())
          .post(url)
          .send(forgotPasswordDto)
          .expect(HttpStatus.OK)
          .then(({ body }) => {
            expect(body.data.attributes.success).toEqual(true);
          });
      });

      it("Should respond with an UserNotFoundException when the user doesn't exist", async () => {
        const email = 'test@test.com';

        const error = new EmailNotFoundException({
          email,
        });

        const forgotPasswordDto: IForgotPasswordDto = { email };
        await request(app.getHttpServer())
          .post(url)
          .send(forgotPasswordDto)
          .expect(HttpStatus.NOT_FOUND)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });

      it('Should respond with an UnknownErrorException when an unexpected error occurs', async () => {
        const error = new UnknownErrorException({
          message:
            AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_RESETTING_PASSWORD,
        });

        identityProviderServiceMock.forgotPassword.mockRejectedValueOnce(error);

        const forgotPasswordDto: IForgotPasswordDto = {
          email: 'admin@test.com',
        };

        await request(app.getHttpServer())
          .post(url)
          .send(forgotPasswordDto)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });
    });

    describe('POST - /auth/confirm-password', () => {
      const url = '/api/v1/auth/confirm-password';

      it('Should respond with a success message when provided a email, password and code', async () => {
        identityProviderServiceMock.confirmPassword.mockResolvedValueOnce({
          success: true,
          message: 'Your password has been correctly updated',
        });

        const confirmPasswordDto: IConfirmPasswordDto = {
          email: 'admin@test.com',
          code: '123456',
          newPassword: 'Password1!',
        };

        await request(app.getHttpServer())
          .post(url)
          .send(confirmPasswordDto)
          .expect(HttpStatus.OK)
          .then(({ body }) => {
            expect(body.data.attributes.success).toEqual(true);
          });
      });

      it('Should respond with a CodeMismatchError when the code is invalid', async () => {
        const error = new CodeMismatchException({
          message: AUTH_EXCEPTION_MESSAGES.CODE_MISMATCH,
        });

        identityProviderServiceMock.confirmPassword.mockRejectedValueOnce(
          error,
        );

        const confirmPasswordDto: IConfirmPasswordDto = {
          email: 'admin@test.com',
          code: '654321',
          newPassword: 'Password1!',
        };

        await request(app.getHttpServer())
          .post(url)
          .send(confirmPasswordDto)
          .expect(HttpStatus.UNAUTHORIZED)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
            expect(body.error.source.pointer).toContain(
              '/api/v1/auth/confirm-password',
            );
          });
      });

      it('Should respond with an EmailNotFoundException error when the user does not exist', async () => {
        const email = 'fake@fake.com';

        const error = new EmailNotFoundException({
          email,
        });

        const confirmPasswordDto: IConfirmPasswordDto = {
          email,
          code: '654321',
          newPassword: 'Password1!',
        };

        await request(app.getHttpServer())
          .post(url)
          .send(confirmPasswordDto)
          .expect(HttpStatus.NOT_FOUND)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });

      it('Should respond with an UnknownErrorException when an unexpected error occurs', async () => {
        const error = new UnknownErrorException({
          message:
            AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_CONFIRMING_PASSWORD,
        });

        identityProviderServiceMock.confirmPassword.mockRejectedValueOnce(
          error,
        );

        const forgotPasswordDto: IConfirmPasswordDto = {
          email: 'admin@test.com',
          code: '654321',
          newPassword: 'Password1!',
        };

        await request(app.getHttpServer())
          .post(url)
          .send(forgotPasswordDto)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });
    });

    describe('POST - /auth/resend-confirmation-code', () => {
      const url = '/api/v1/auth/resend-confirmation-code';

      it('Should resend the confirmation code when requested', async () => {
        const successResponse = {
          success: true,
          message: 'A new verification link has been sent to your email',
        };

        identityProviderServiceMock.resendConfirmationCode.mockResolvedValueOnce(
          successResponse,
        );

        const confirmPasswordDto: IResendConfirmationCodeDto = {
          email: 'admin@test.com',
        };

        await request(app.getHttpServer())
          .post(url)
          .send(confirmPasswordDto)
          .expect(HttpStatus.OK)
          .then(({ body }) => {
            expect(body.data.attributes.success).toEqual(true);
          });
      });

      it("Should respond with an UserNotFoundException when the user doesn't exist", async () => {
        const error = new EmailNotFoundException({
          email: mockInexistentSignInDto.email,
        });

        const forgotPasswordDto: IForgotPasswordDto = {
          email: mockInexistentSignInDto.email,
        };
        await request(app.getHttpServer())
          .post(url)
          .send(forgotPasswordDto)
          .expect(HttpStatus.NOT_FOUND)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });

      it('Should respond with an UnknownErrorException over unexpected errors', async () => {
        const error = new UnknownErrorException({
          message:
            AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_RESENDING_CONFIRMATION_CODE,
        });
        identityProviderServiceMock.resendConfirmationCode.mockRejectedValueOnce(
          error,
        );
        const confirmPasswordDto: IResendConfirmationCodeDto = {
          email: 'admin@test.com',
        };
        return request(app.getHttpServer())
          .post(url)
          .send(confirmPasswordDto)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });
    });

    describe('POST - /auth/refresh', () => {
      const url = '/api/v1/auth/refresh';
      it('Should refresh the session when provided a valid refresh token', async () => {
        const successProviderResponse: IRefreshSessionResponse = {
          accessToken: 'accessToken',
        };

        identityProviderServiceMock.refreshSession.mockResolvedValueOnce(
          successProviderResponse,
        );

        const refreshTokenDto: IRefreshSessionDto = {
          refreshToken: 'refreshToken',
          email: 'admin@test.com',
        };

        const expectedResponse = expect.objectContaining({
          data: expect.objectContaining({
            attributes: expect.objectContaining({
              accessToken: 'accessToken',
            }),
          }),
        });

        await request(app.getHttpServer())
          .post(url)
          .send(refreshTokenDto)
          .expect(HttpStatus.OK)
          .then(({ body }) => {
            expect(body).toEqual(expectedResponse);
          });
      });

      it("Should respond with an UserNotFoundException when the user doesn't exist", async () => {
        const error = new EmailNotFoundException({
          email: mockInexistentSignInDto.email,
        });

        const refreshTokenDto: IRefreshSessionDto = {
          refreshToken: 'fakeRefreshToken',
          email: mockInexistentSignInDto.email,
        };

        await request(app.getHttpServer())
          .post(url)
          .send(refreshTokenDto)
          .expect(HttpStatus.NOT_FOUND)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });

      it('Should respond with an UnknownErrorException over unexpected errors', async () => {
        const error = new UnknownErrorException({
          message:
            AUTH_EXCEPTION_MESSAGES.UNKNOWN_ERROR_WHEN_REFRESHING_SESSION,
        });

        identityProviderServiceMock.refreshSession.mockRejectedValueOnce(error);

        const refreshSessionDto: IRefreshSessionDto = {
          email: 'admin@test.com',
          refreshToken: 'refreshToken',
        };

        return request(app.getHttpServer())
          .post(url)
          .send(refreshSessionDto)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .then(({ body }) => {
            expect(body.error.detail).toEqual(error.message);
          });
      });
    });
  });
});
