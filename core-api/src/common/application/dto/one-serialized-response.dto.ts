import { ApiProperty } from '@nestjs/swagger';
import {
  IBaseSerializedResponseDto,
  IDataWithSelfLink,
  ILinks,
  ISerializedData,
} from './serialized-response.interface';

export class OneSerializedResponseDto<ResponseDto extends object>
  implements IBaseSerializedResponseDto
{
  @ApiProperty()
  readonly data: ISerializedData<ResponseDto>;

  @ApiProperty()
  readonly included?: IDataWithSelfLink<unknown>[];

  @ApiProperty()
  readonly links: Omit<ILinks, 'last' | 'next'>;

  constructor({
    data,
    included,
    links,
  }: {
    data: ISerializedData<ResponseDto>;
    included?: IDataWithSelfLink<unknown>[];
    links: Omit<ILinks, 'last' | 'next'>;
  }) {
    this.data = data;
    this.included = included;
    this.links = links;
  }
}
