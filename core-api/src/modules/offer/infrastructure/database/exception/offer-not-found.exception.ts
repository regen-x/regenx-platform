import { NotFoundException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../../../../common/application/interface/base-error.interface';

export class OfferNotFoundException extends NotFoundException {
  constructor(params: IBaseErrorInfoParams) {
    super(params);
  }
}
