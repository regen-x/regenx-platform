import { Injectable, InternalServerErrorException, Type } from '@nestjs/common';
import { IPolicyHandler } from '../handler/policy-handler.interface';

@Injectable()
export class PolicyHandlerStorage {
  private readonly collection = new Map<Type<IPolicyHandler>, IPolicyHandler>();

  add(handlerCls: Type<IPolicyHandler>, handler: IPolicyHandler) {
    this.collection.set(handlerCls, handler);
  }

  get(handlerCls: Type<IPolicyHandler>): IPolicyHandler | undefined {
    const handler = this.collection.get(handlerCls);

    if (!handler) {
      throw new InternalServerErrorException(
        `Can't find instance of "${handlerCls.name}".`,
      );
    }

    return handler;
  }
}
