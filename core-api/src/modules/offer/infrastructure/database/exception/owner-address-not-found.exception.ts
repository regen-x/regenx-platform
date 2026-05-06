import { NotFoundException } from '@nestjs/common';

export class OwnerAddressNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}
