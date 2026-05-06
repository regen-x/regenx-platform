import { AppAction } from '../../iam/authorization/domain/app-action.enum';
import { IPermissionsDefinition } from '../../iam/authorization/infrastructure/policy/type/permissions-definition.interface';
import { Offer } from './offer.domain';

export const offerPermissions: IPermissionsDefinition = {
  regular(user, { can }) {
    can(AppAction.Read, Offer);
    can(AppAction.Update, Offer, { project: { user } });
  },
  admin(_, { can }) {
    can(AppAction.Manage, Offer);
  },
};
