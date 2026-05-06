import { BadRequestException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../../../../../common/application/interface/base-error.interface';

export class IncorrectUserTypeException extends BadRequestException {
  constructor(params: IBaseErrorInfoParams) {
    super(params);
  }
}
