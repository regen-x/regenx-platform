import { NotFoundException } from '@nestjs/common';

import { USERNAME_NOT_FOUND_ERROR } from './user-exception-messages';
import { IBaseErrorInfoParams } from '../../../../../../common/application/interface/base-error.interface';

type Params = Omit<IBaseErrorInfoParams, 'message'> & { email: string };
export class EmailNotFoundException extends NotFoundException {
  constructor(params: Params) {
    const message = `${params.email} ${USERNAME_NOT_FOUND_ERROR}`;
    super({ ...params, message });
  }
}
