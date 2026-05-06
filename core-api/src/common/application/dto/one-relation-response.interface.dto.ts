import { ILinks } from './serialized-response.interface';

export interface OneRelationResponseData {
  id: string;
  type: string;
}

export interface OneRelationResponse {
  data: OneRelationResponseData | null;
  links: Omit<ILinks, 'last' | 'next'>;
}
