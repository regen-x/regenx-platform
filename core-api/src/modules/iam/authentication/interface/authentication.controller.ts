import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../infrastructure/decorator/auth.decorator';
import { AuthType } from '../domain/auth-type.enum';
import { AuthenticationService } from '../application/service/authentication.service';
import { SignUpDto } from '../application/dto/sign-up.dto';
import { OneSerializedResponseDto } from '../../../../common/application/dto/one-serialized-response.dto';
import { UserResponseDto } from '../../user/application/dto/user-response.dto';
import { SignInDto } from '../application/dto/sign-in.dto';
import { ISignInResponse } from '../application/dto/sign-in-response.interface';
import { ForgotPasswordDto } from '../application/dto/forgot-password.dto';
import { ConfirmPasswordDto } from '../application/dto/confirm-password.dto';
import { ResendConfirmationCodeDto } from '../application/dto/resend-confirmation-code.dto';
import { ISuccessfulOperationResponse } from '../../../../common/application/interface/successful-operation-response.interface';
import { IRefreshSessionResponse } from '../application/dto/refresh-session-response.interface';
import { RefreshSessionDto } from '../application/dto/refresh-session.dto';

@Controller('auth')
@ApiTags('auth')
@Auth(AuthType.None)
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('sign-up')
  async handleSignUp(
    @Body() signUpDto: SignUpDto,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    return this.authenticationService.handleSignUp(signUpDto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async handleSignIn(
    @Body() signInDto: SignInDto,
  ): Promise<OneSerializedResponseDto<ISignInResponse>> {
    return this.authenticationService.handleSignIn(signInDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async handleForgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<OneSerializedResponseDto<ISuccessfulOperationResponse>> {
    return this.authenticationService.handleForgotPassword(forgotPasswordDto);
  }

  @Post('confirm-password')
  @HttpCode(HttpStatus.OK)
  async handleConfirmPassword(
    @Body() confirmPasswordDto: ConfirmPasswordDto,
  ): Promise<OneSerializedResponseDto<ISuccessfulOperationResponse>> {
    return this.authenticationService.handleConfirmPassword(confirmPasswordDto);
  }

  @Post('resend-confirmation-code')
  @HttpCode(HttpStatus.OK)
  async handleResendConfirmationCode(
    @Body() resendConfirmationCode: ResendConfirmationCodeDto,
  ): Promise<OneSerializedResponseDto<ISuccessfulOperationResponse>> {
    return this.authenticationService.handleResendConfirmationCode(
      resendConfirmationCode,
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async handleRefreshSession(
    @Body() refreshSessionDto: RefreshSessionDto,
  ): Promise<OneSerializedResponseDto<IRefreshSessionResponse>> {
    return this.authenticationService.handleRefreshSession(refreshSessionDto);
  }
}
