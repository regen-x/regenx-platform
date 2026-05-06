export class IBaseSerializedResponseDto {
  included?: IDataWithSelfLink<unknown>[];
}
export interface IRelationshipData {
  type: string;
  id: string;
}

export interface IRelationshipLinks {
  related: string;
  self: string;
}

export interface IRelationships {
  [key: string]: {
    data: IRelationshipData;
    links: IRelationshipLinks;
  };
}

export interface ISerializedData<ResponseDto> {
  type: string;
  id: string;
  attributes: Omit<ResponseDto, 'id'>;
  relationships?: IRelationships;
}

export interface IDataWithSelfLink<ResponseDto>
  extends ISerializedData<ResponseDto> {
  links: Omit<ILinks, 'next' | 'last'>;
}

export interface ILinks {
  self: string;
  next: string | null;
  last: string | null;
  related: string | null;
}

export interface SerializedResource {
  data: ISerializedData<object>;
  included?: IDataWithSelfLink<unknown>[];
  links: Partial<ILinks>;
}
