import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../modules/app/app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';
import {
  IDENTITY_PROVIDER_SERVICE_KEY,
  IIdentityProviderService,
} from '../modules/iam/authentication/application/service/identity-provider.service.interface';
import { StellarAccountAdapter } from '../common/infrastructure/stellar/stellar.account.adapter';
import { StellarAssetAdapter } from '../common/infrastructure/stellar/stellar.asset.adapter';
import { StellarTransactionAdapter } from '../common/infrastructure/stellar/stellar.transaction.adapter';
import { StellarPaymentAdapter } from '../common/infrastructure/stellar/stellar.payment.adapter';

export const identityProviderServiceMock: jest.MockedObject<IIdentityProviderService> =
  {
    signUp: jest.fn(),
    signIn: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
    resendConfirmationCode: jest.fn(),
    refreshSession: jest.fn(),
  };

export const stellarAccountAdapterMock = {
  getAccount: jest.fn(),
  getKeypair: jest.fn(),
  createChangeTrustOperation: jest.fn(),
  getAddress: jest.fn(),
};

export const stellarAssetAdapterMock = {
  buildAsset: jest.fn(),
  createStellarAssetContractOperation: jest.fn(),
};

export const stellarTransactionAdapterMock = {
  buildTransactionFromXdr: jest.fn(),
  buildTransaction: jest.fn(),
  signTransaction: jest.fn(),
  submitTransaction: jest.fn(),
  prepareTransaction: jest.fn(),
  submitSorobanTransaction: jest.fn(),
  getSorobanTransaction: jest.fn(),
  createCosignerTransaction: jest.fn(),
};

export const stellarPaymentAdapterMock = {
  buildPaymentOperation: jest.fn(),
};

export const testStellarModuleBootstrapper = (): Promise<TestingModule> => {
  initializeTransactionalContext();

  return Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(IDENTITY_PROVIDER_SERVICE_KEY)
    .useValue(identityProviderServiceMock)
    .overrideProvider(StellarAccountAdapter)
    .useValue(stellarAccountAdapterMock)
    .overrideProvider(StellarAssetAdapter)
    .useValue(stellarAssetAdapterMock)
    .overrideProvider(StellarTransactionAdapter)
    .useValue(stellarTransactionAdapterMock)
    .overrideProvider(StellarPaymentAdapter)
    .useValue(stellarPaymentAdapterMock)
    .compile();
};
