import { ISuccessfulOperationResponse } from '../../../../../common/application/interface/successful-operation-response.interface';
import { IRefreshSessionResponse } from '../dto/refresh-session-response.interface';
import { ISignInResponse } from '../dto/sign-in-response.interface';
import { ISignUpResponse } from '../dto/sign-up-response.interface';

export const IDENTITY_PROVIDER_SERVICE_KEY = 'identity_provider_service';

export interface IIdentityProviderService {
  signUp(email: string, password: string): Promise<ISignUpResponse>;
  signIn(email: string, password: string): Promise<ISignInResponse>;
  forgotPassword(
    email: string,
    externalId: string,
  ): Promise<ISuccessfulOperationResponse>;
  confirmPassword(
    email: string,
    newPassword: string,
    code: string,
  ): Promise<ISuccessfulOperationResponse>;
  resendConfirmationCode(email: string): Promise<ISuccessfulOperationResponse>;
  refreshSession(refreshToken: string): Promise<IRefreshSessionResponse>;
}
