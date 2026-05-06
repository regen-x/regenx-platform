import { ApiProperty } from '@nestjs/swagger';
import { OneRelationResponseData } from './one-relation-response.interface.dto';
import { ILinks } from './serialized-response.interface';

export class OneRelationResponseDto {
  @ApiProperty()
  data: OneRelationResponseData;

  @ApiProperty()
  links: Omit<ILinks, 'last' | 'next'>;
}
