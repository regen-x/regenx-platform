import { DynamicModule, Module } from '@nestjs/common';
import { IPermissionsDefinition } from './infrastructure/policy/type/permissions-definition.interface';
import { PolicyHandlerStorage } from './infrastructure/policy/storage/policies-handler.storage';
import { PERMISSIONS_FOR_FEATURE_KEY } from './authorization.constants';
import { AuthorizationService } from './application/service/authorization.service';
import { CaslAbilityFactory } from './infrastructure/casl/factory/casl-ability.factory';
import { PoliciesGuard } from './infrastructure/policy/guard/policy.guard';

export interface IAuthorizationModuleForFeatureOptions {
  permissions: IPermissionsDefinition;
}

@Module({})
export class AuthorizationModule {
  static forRoot(): DynamicModule {
    return {
      module: AuthorizationModule,
      global: true,
      providers: [PolicyHandlerStorage],
      exports: [PolicyHandlerStorage],
    };
  }

  static forFeature(
    options: IAuthorizationModuleForFeatureOptions,
  ): DynamicModule {
    const permissionsProvider = {
      provide: PERMISSIONS_FOR_FEATURE_KEY,
      useValue: options.permissions,
    };

    return {
      module: AuthorizationModule,
      providers: [
        AuthorizationService,
        CaslAbilityFactory,
        PoliciesGuard,
        permissionsProvider,
      ],
      exports: [
        AuthorizationService,
        CaslAbilityFactory,
        PoliciesGuard,
        permissionsProvider,
      ],
    };
  }
}
