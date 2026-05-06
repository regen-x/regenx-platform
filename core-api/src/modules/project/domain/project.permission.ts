import { AppAction } from '../../iam/authorization/domain/app-action.enum';
import { IPermissionsDefinition } from '../../iam/authorization/infrastructure/policy/type/permissions-definition.interface';
import { Project } from './project.domain';

export const projectPermissions: IPermissionsDefinition = {
  regular(user, { can }) {
    can(AppAction.Read, Project);
    can(AppAction.Update, Project, { user: { id: user.id } });
  },
  admin(_, { can }) {
    can(AppAction.Manage, Project);
  },
};
