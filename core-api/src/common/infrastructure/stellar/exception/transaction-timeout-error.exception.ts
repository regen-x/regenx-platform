import { RequestTimeoutException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../../application/interface/base-error.interface';

export class TransactionTimeoutException extends RequestTimeoutException {
  constructor(params: IBaseErrorInfoParams) {
    super(params);
  }
}
