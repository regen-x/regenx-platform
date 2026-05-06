import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PolicyHandlerStorage } from '../storage/policies-handler.storage';
import { IPolicyHandler } from '../handler/policy-handler.interface';
import { POLICIES_KEY } from '../decorator/policy.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyHandlerStorage: PolicyHandlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlersCls = this.getPolicyHandlersCls(context);

    if (handlersCls) {
      await Promise.all(
        handlersCls.map((handlerCls) => {
          const handler = this.policyHandlerStorage.get(handlerCls);
          return handler.handle(this.getContextRequest(context));
        }),
      ).catch((error) => {
        throw new ForbiddenException(error.message);
      });
    }

    return true;
  }

  private getPolicyHandlersCls(
    context: ExecutionContext,
  ): Type<IPolicyHandler>[] | undefined {
    return this.reflector.getAllAndOverride(POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private getContextRequest(context: ExecutionContext): Request {
    return context.switchToHttp().getRequest();
  }
}
