import { NotFoundException } from '@nestjs/common';

export class OwnerAccountNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}
