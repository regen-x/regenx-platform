import {
  AbilityBuilder,
  ExtractSubjectType,
  createMongoAbility,
} from '@casl/ability';
import { Inject, Injectable } from '@nestjs/common';
import { PERMISSIONS_FOR_FEATURE_KEY } from '../../../authorization.constants';
import { IPermissionsDefinition } from '../../policy/type/permissions-definition.interface';
import { AppAbility } from '../type/app-ability.type';
import { User } from '../../../../user/domain/user.domain';
import { AppSubjects } from '../type/app-subjects.type';

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @Inject(PERMISSIONS_FOR_FEATURE_KEY)
    private readonly permissions: IPermissionsDefinition,
  ) {}

  createForUser(user: User): AppAbility {
    const builder = new AbilityBuilder<AppAbility>(createMongoAbility);

    this.permissions[user.role](user, builder);

    return builder.build({
      // Read https://casl.js.org/v5/en/guide/subject-type-detection#use-classes-as-subject-types for details
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<AppSubjects>,
    });
  }
}
