import { BadRequestException } from '@nestjs/common';
import { IBaseErrorInfoParams } from '../../../../../common/application/interface/base-error.interface';

export class UserAlreadySignedUp extends BadRequestException {
  constructor(params: IBaseErrorInfoParams) {
    const title = params.title ?? 'Signup Conflict';
    super({ ...params, title });
  }
}
