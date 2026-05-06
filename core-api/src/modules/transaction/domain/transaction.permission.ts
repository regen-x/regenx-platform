import { AppAction } from '../../iam/authorization/domain/app-action.enum';
import { IPermissionsDefinition } from '../../iam/authorization/infrastructure/policy/type/permissions-definition.interface';
import { Transaction } from './transaction.domain';

export const transactionPermissions: IPermissionsDefinition = {
  regular(user, { can }) {
    can(AppAction.Read, Transaction);
    can(AppAction.Update, Transaction);
  },
  admin(_, { can }) {
    can(AppAction.Manage, Transaction);
  },
};
