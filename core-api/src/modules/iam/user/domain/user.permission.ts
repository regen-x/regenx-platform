import { AppAction } from '../../authorization/domain/app-action.enum';
import { IPermissionsDefinition } from '../../authorization/infrastructure/policy/type/permissions-definition.interface';
import { User } from './user.domain';

export const userPermissions: IPermissionsDefinition = {
  regular(user, { can }) {
    can(AppAction.Read, User);
    can(AppAction.Update, User, { id: user.id }); // Can only update himself
  },
  admin(_, { can }) {
    can(AppAction.Manage, User);
  },
};
