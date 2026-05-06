import { SetMetadata } from '@nestjs/common';

export const ENDPOINT_KEY = 'endpoint-entity';
export const ControllerEntity = (entity: string) =>
  SetMetadata(ENDPOINT_KEY, { entity });
