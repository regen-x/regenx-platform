import { Injectable } from '@nestjs/common';
import { CaslAbilityFactory } from '../../infrastructure/casl/factory/casl-ability.factory';
import { AppAction } from '../../domain/app-action.enum';
import { User } from '../../../user/domain/user.domain';
import { AppSubjects } from '../../infrastructure/casl/type/app-subjects.type';

@Injectable()
export class AuthorizationService {
  constructor(private readonly abilityFactory: CaslAbilityFactory) {}

  isAllowed(user: User, action: AppAction, subject: AppSubjects): boolean {
    if (!user) {
      return false;
    }

    if (!action || !subject) {
      return false;
    }

    const userAbility = this.abilityFactory.createForUser(user);
    return userAbility.can(action, subject);
  }
}
