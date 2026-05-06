import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IPolicyHandler } from '../../../iam/authorization/infrastructure/policy/handler/policy-handler.interface';
import { Request } from 'express';
@Injectable()
export class ReadTransactionPolicyHandler implements IPolicyHandler {
  handle(request: Request): void {
    const { user } = request;
    const { transaction } = request.params;

    if (!user || !transaction) {
      throw new UnauthorizedException();
    }
  }
}
