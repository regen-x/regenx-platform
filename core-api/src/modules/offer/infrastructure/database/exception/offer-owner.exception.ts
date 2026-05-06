import { BadRequestException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../../../../common/application/interface/base-error.interface';

export class OfferOwnerException extends BadRequestException {
  constructor(params: IBaseErrorInfoParams) {
    super(params);
  }
}
