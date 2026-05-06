import { SerializerOptions } from 'jsonapi-serializer';

export const RESPONSE_ADAPTER_BASE_OPTIONS: SerializerOptions = {
  keyForAttribute: 'camelCase',
  pluralizeType: false,
  relationships: {},
  nullIfMissing: true,
  included: true,
};
