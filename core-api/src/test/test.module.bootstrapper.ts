import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../modules/app/app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';
import {
  IDENTITY_PROVIDER_SERVICE_KEY,
  IIdentityProviderService,
} from '../modules/iam/authentication/application/service/identity-provider.service.interface';

export const identityProviderServiceMock: jest.MockedObject<IIdentityProviderService> =
  {
    signUp: jest.fn(),
    signIn: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
    resendConfirmationCode: jest.fn(),
    refreshSession: jest.fn(),
  };

let testModule: TestingModule | null = null;

export const testModuleBootstrapper = async (): Promise<TestingModule> => {
  if (testModule) {
    return testModule;
  }

  initializeTransactionalContext();

  testModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(IDENTITY_PROVIDER_SERVICE_KEY)
    .useValue(identityProviderServiceMock)
    .compile();

  return testModule;
};
