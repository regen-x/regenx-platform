import { UnauthorizedException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../../../../../common/application/interface/base-error.interface';

export class CodeMismatchException extends UnauthorizedException {
  constructor(params: IBaseErrorInfoParams) {
    super(params);
  }
}
