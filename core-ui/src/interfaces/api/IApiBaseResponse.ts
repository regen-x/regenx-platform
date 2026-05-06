export interface ISingleResponse<T = unknown> extends IBaseResponse<T> {
	data: IResponseData<T>;
	links: Omit<ILinks, 'next' | 'last'>;
}

export interface IListResponse<T = unknown> extends IBaseResponse<T> {
	data: IResponseData<T>[];
	links: ILinks;
	meta: IMeta;
}

export interface IMeta {
	pageSize: number;
	pageNumber: number;
	pageCount: number;
	itemCount: number;
}

export interface IBaseResponse<T = unknown> {
	included?: IDataWithSelfLink<T>;
}

export interface IResponseData<T> {
	type: string;
	id?: string;
	relationships?: IRelationships;
	attributes: T;
}

export interface IRelationships {
	[key: string]: {
		data: IRelationshipData;
		links: IRelationshipLinks;
	};
}

export interface IRelationshipData {
	type: string;
	id: string;
}

export interface IRelationshipLinks {
	related: string;
	self: string;
}

export interface IDataWithSelfLink<ResponseDto>
	extends IResponseData<ResponseDto> {
	links: Omit<ILinks, 'next' | 'last'>;
}

export interface ILinks {
	self: string;
	next: string | null;
	last: string | null;
}
