import { UnauthorizedException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../../../../../common/application/interface/base-error.interface';

export class UnverifiedEmailException extends UnauthorizedException {
  constructor(params: IBaseErrorInfoParams) {
    super(params);
  }
}
