import { Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { IDENTITY_PROVIDER_SERVICE_KEY } from './application/service/identity-provider.service.interface';
import { UserModule } from '../user/user.module';
import { AuthenticationController } from './interface/authentication.controller';
import { JwtStrategy } from './infrastructure/passport/jwt.strategy';
import { AccessTokenGuard } from './infrastructure/guard/access-token.guard';
import { AuthenticationGuard } from './infrastructure/guard/authentication.guard';
import { AuthenticationResponseAdapter } from './application/adapter/authentication-response.adapter';
import { AuthenticationService } from './application/service/authentication.service';
import { Auth0Service } from './infrastructure/auth0/auth0.service';
import { InvestorVerificationModule } from '../../investor-verification/investor-verification.module';

const authenticationRepositoryProvider: Provider = {
  provide: IDENTITY_PROVIDER_SERVICE_KEY,
  useClass: Auth0Service,
};

@Module({
  imports: [PassportModule, UserModule, InvestorVerificationModule],
  controllers: [AuthenticationController],
  providers: [
    JwtStrategy,
    AccessTokenGuard,
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    AuthenticationResponseAdapter,
    AuthenticationController,
    AuthenticationService,
    authenticationRepositoryProvider,
  ],
})
export class AuthenticationModule {}
