import { AppRole } from '../../../domain/app-role.enum';
import { DefinePermissions } from './define-permissions.type';

export type IPermissionsDefinition = Partial<
  Record<AppRole, DefinePermissions>
>;
