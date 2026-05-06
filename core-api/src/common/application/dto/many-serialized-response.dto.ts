import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IBaseSerializedResponseDto,
  IDataWithSelfLink,
  ILinks,
  ISerializedData,
} from './serialized-response.interface';
import { IPagingCollectionData } from './collection.interface';

export class ManySerializedResponseDto<ResponseDto extends object>
  implements IBaseSerializedResponseDto
{
  @ApiPropertyOptional()
  readonly data: ISerializedData<ResponseDto>[];

  @ApiProperty()
  readonly included?: IDataWithSelfLink<unknown>[];

  @ApiProperty()
  readonly links?: ILinks;

  @ApiProperty()
  readonly meta?: IPagingCollectionData;

  constructor({
    data,
    included,
    meta,
    links,
  }: {
    data: ISerializedData<ResponseDto>[];
    included?: IDataWithSelfLink<unknown>[];
    meta?: IPagingCollectionData;
    links?: ILinks;
  }) {
    this.data = data;
    this.included = included;
    this.links = links;
    this.meta = meta;
  }
}
