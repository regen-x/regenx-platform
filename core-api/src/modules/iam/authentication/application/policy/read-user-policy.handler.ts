import { ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { IPolicyHandler } from '../../../authorization/infrastructure/policy/handler/policy-handler.interface';
import { AppAction } from '../../../authorization/domain/app-action.enum';
import { PolicyHandlerStorage } from '../../../authorization/infrastructure/policy/storage/policies-handler.storage';
import { AuthorizationService } from '../../../authorization/application/service/authorization.service';
import { User } from '../../../user/domain/user.domain';
import { REQUEST_USER_KEY } from '../../authentication.constants';

@Injectable()
export class ReadUserPolicyHandler implements IPolicyHandler {
  private readonly action = AppAction.Read;

  constructor(
    private readonly policyHandlerStorage: PolicyHandlerStorage,
    private readonly authorizationService: AuthorizationService,
  ) {
    this.policyHandlerStorage.add(ReadUserPolicyHandler, this);
  }

  handle(request: Request): void {
    const currentUser = this.getCurrentUser(request);

    const isAllowed = this.authorizationService.isAllowed(
      currentUser,
      this.action,
      User,
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        `You are not allowed to ${this.action.toUpperCase()} this resource`,
      );
    }
  }

  private getCurrentUser(request: Request): User {
    return request[REQUEST_USER_KEY] as User;
  }
}
