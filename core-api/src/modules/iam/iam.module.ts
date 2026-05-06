import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [AuthenticationModule, AuthorizationModule.forRoot(), UserModule],
})
export class IamModule {}
