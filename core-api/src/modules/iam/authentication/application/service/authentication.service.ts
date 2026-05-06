import { Inject, Injectable } from '@nestjs/common';
import {
  IDENTITY_PROVIDER_SERVICE_KEY,
  IIdentityProviderService,
} from './identity-provider.service.interface';
import {
  IUserRepository,
  USER_REPOSITORY_KEY,
} from '../../../user/application/repository/user.repository.interface';
import { UserMapper } from '../../../user/application/mapper/user.mapper';
import { AuthenticationResponseAdapter } from '../adapter/authentication-response.adapter';
import { UserResponseDto } from '../../../user/application/dto/user-response.dto';
import { OneSerializedResponseDto } from '../../../../../common/application/dto/one-serialized-response.dto';
import { ISignUpDto } from '../dto/sign-up.dto.interface';
import { UserAlreadySignedUp } from '../exception/user-already-signed-up.exception';
import { USER_ALREADY_SIGNED_UP_ERROR } from '../exception/authentication-exception-messages';
import { User } from '../../../user/domain/user.domain';
import { AppRole } from '../../../authorization/domain/app-role.enum';
import { USER_ENTITY_NAME } from '../../../user/domain/user.name';
import { ISignInDto } from '../dto/sign-in.dto.interface';
import { ISignInResponse } from '../dto/sign-in-response.interface';
import { AUTHENTICATION_NAME } from '../../domain/authentication.name';
import { ISuccessfulOperationResponse } from '../../../../../common/application/interface/successful-operation-response.interface';
import { IForgotPasswordDto } from '../dto/forgot-password.dto.interface';
import { IConfirmPasswordDto } from '../dto/confirm-password.dto.interface';
import { IResendConfirmationCodeDto } from '../dto/resend-confirmation-code.dto.interface';
import { IRefreshSessionDto } from '../dto/refresh-session.dto.interface';
import { IRefreshSessionResponse } from '../dto/refresh-session-response.interface';
import { UserType } from '../../../user/domain/user-type.enum';
import { InvestorVerificationService } from '../../../../investor-verification/investor-verification.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(IDENTITY_PROVIDER_SERVICE_KEY)
    private readonly identityProviderService: IIdentityProviderService,
    @Inject(USER_REPOSITORY_KEY)
    private readonly userRepository: IUserRepository,
    private readonly userMapper: UserMapper,
    private readonly authenticationResponseAdapter: AuthenticationResponseAdapter,
    private readonly investorVerificationService: InvestorVerificationService,
  ) {}

  async handleSignUp(
    signUpDto: ISignUpDto,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    const { email, password, birthdate, fullname, phoneNumber, type } =
      signUpDto;

    const existingUser = await this.userRepository.getOneByFilter({ email });

    if (!existingUser) {
      return this.signUpAndSave(
        email,
        password,
        fullname,
        phoneNumber,
        birthdate,
        type,
      );
    }

    if (!existingUser.externalId) {
      return this.signUpAndSave(
        email,
        password,
        fullname,
        phoneNumber,
        birthdate,
        type,
        existingUser.id,
      );
    }

    throw new UserAlreadySignedUp({
      message: USER_ALREADY_SIGNED_UP_ERROR,
      pointer: '/user/externalId',
    });
  }

  private async signUpAndSave(
    email: string,
    password: string,
    fullname: string,
    phoneNumber: string,
    birthdate: string,
    type: UserType,
    userId?: number,
  ): Promise<OneSerializedResponseDto<UserResponseDto>> {
    let userToSaveId = userId;

    if (!userToSaveId) {
      userToSaveId = (
        await this.userRepository.saveOne({
          email,
          role: AppRole.Regular,
          fullname,
          phoneNumber,
          birthdate,
          type,
        } as User)
      ).id;
    }

    const { externalId } = await this.identityProviderService.signUp(
      email,
      password,
    );

    const user = await this.userRepository.updateOneOrFail(userToSaveId, {
      externalId,
    });

    if (type === UserType.WHOLESALE_INVESTOR) {
      await this.investorVerificationService.ensureInvestorRecord(String(user.id));
    }

    return this.authenticationResponseAdapter.oneEntityResponse<UserResponseDto>(
      USER_ENTITY_NAME,
      this.userMapper.fromUserToUserResponseDto(user),
    );
  }

  async handleSignIn(
    signInDto: ISignInDto,
  ): Promise<OneSerializedResponseDto<ISignInResponse>> {
    const { email, password } = signInDto;
    const existingUser = await this.userRepository.getOneByEmailOrFail(email);

    const response = await this.identityProviderService.signIn(
      existingUser.email,
      password,
    );

    return this.authenticationResponseAdapter.oneEntityResponse<ISignInResponse>(
      AUTHENTICATION_NAME,
      response,
    );
  }

  async handleForgotPassword(
    forgotPasswordDto: IForgotPasswordDto,
  ): Promise<OneSerializedResponseDto<ISuccessfulOperationResponse>> {
    const { email } = forgotPasswordDto;
    const { externalId } = await this.userRepository.getOneByEmailOrFail(email);

    const response = await this.identityProviderService.forgotPassword(
      email,
      externalId,
    );

    return this.authenticationResponseAdapter.oneEntityResponse<ISuccessfulOperationResponse>(
      AUTHENTICATION_NAME,
      response,
    );
  }

  async handleConfirmPassword(
    confirmPasswordDto: IConfirmPasswordDto,
  ): Promise<OneSerializedResponseDto<ISuccessfulOperationResponse>> {
    const { email, newPassword, code } = confirmPasswordDto;
    const { externalId } = await this.userRepository.getOneByEmailOrFail(email);

    const response = await this.identityProviderService.confirmPassword(
      externalId,
      newPassword,
      code,
    );

    return this.authenticationResponseAdapter.oneEntityResponse<ISuccessfulOperationResponse>(
      AUTHENTICATION_NAME,
      response,
    );
  }

  async handleResendConfirmationCode(
    resendConfirmationCodeDto: IResendConfirmationCodeDto,
  ): Promise<OneSerializedResponseDto<ISuccessfulOperationResponse>> {
    const { email } = resendConfirmationCodeDto;
    const { externalId } = await this.userRepository.getOneByEmailOrFail(email);

    const response =
      await this.identityProviderService.resendConfirmationCode(externalId);

    return this.authenticationResponseAdapter.oneEntityResponse<ISuccessfulOperationResponse>(
      AUTHENTICATION_NAME,
      response,
    );
  }

  async handleRefreshSession(
    refreshSessionDto: IRefreshSessionDto,
  ): Promise<OneSerializedResponseDto<IRefreshSessionResponse>> {
    const { email, refreshToken } = refreshSessionDto;
    await this.userRepository.getOneByEmailOrFail(email);

    const response =
      await this.identityProviderService.refreshSession(refreshToken);

    return this.authenticationResponseAdapter.oneEntityResponse<IRefreshSessionResponse>(
      AUTHENTICATION_NAME,
      response,
    );
  }
}
