import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '../../../user/domain/user.domain';
import { REQUEST_USER_KEY } from '../../authentication.constants';

export const CurrentUser = createParamDecorator(
  (field: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: User | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
