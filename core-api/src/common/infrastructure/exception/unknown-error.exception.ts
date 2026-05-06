import { InternalServerErrorException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../application/interface/base-error.interface';

export class UnknownErrorException extends InternalServerErrorException {
  constructor(params: IBaseErrorInfoParams) {
    super(params);
  }
}
