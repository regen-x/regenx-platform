import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Serializer, SerializerOptions } from 'jsonapi-serializer';

import { AppService } from './app.service';
import {
  ILinks,
  ISerializedData,
  SerializedResource,
} from '../../../../common/application/dto/serialized-response.interface';
import { CollectionDto } from '../../../../common/application/dto/collection.dto';
import { RESPONSE_ADAPTER_BASE_OPTIONS } from '../../../../common/application/constant/response-adapter-options.constant';

@Injectable()
export class ResponseSerializerService {
  private appBaseUrl: string;
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {
    this.appBaseUrl = this.configService.get('server.baseUrl');
  }

  serialize<T>(type: string, data: T | T[], options: SerializerOptions = {}) {
    const serializer = new Serializer(type, options);
    const serializedData = serializer.serialize(data);
    const isSerializedDataArray = Array.isArray(serializedData.data);
    const EMPTY_ID = '';
    if (isSerializedDataArray) {
      return {
        ...serializedData,
        data: serializedData.data.map((d: ISerializedData<T>) =>
          d.id === EMPTY_ID ? delete d.id : d,
        ),
      };
    }

    if (serializedData.data?.id === EMPTY_ID) {
      delete serializedData.data.id;
    }

    return serializedData;
  }

  getManyEntitiesLinks<T extends object>(
    collection: CollectionDto<T>,
  ): { links: Omit<ILinks, 'related'> } {
    const PAGE_NUMBER_KEY = 'page[number]';
    const PAGE_SIZE_KEY = 'page[size]';
    const currentEndpointUrl = this.appService.getCurrentRequestUrl();
    const currentUrl = new URL(currentEndpointUrl);
    const searchParams = new URLSearchParams(currentUrl.search);
    const currentPageNumber = collection.pageNumber ?? 1;

    const links: Omit<ILinks, 'related'> = {
      self: currentEndpointUrl,
      next: null,
      last: currentEndpointUrl,
    };

    const nextPageQueryString = this.buildPaginationQueryString(
      searchParams,
      collection.pageNumber + 1,
      collection.pageSize,
    );

    if (currentPageNumber < collection.pageCount) {
      links.next = `${currentUrl.origin}${currentUrl.pathname}?${nextPageQueryString}`;
    }

    searchParams.set(PAGE_NUMBER_KEY, collection.pageCount.toString());
    searchParams.set(PAGE_SIZE_KEY, collection.pageSize.toString());

    const lastPageQueryString = this.buildPaginationQueryString(
      searchParams,
      collection.pageCount,
      collection.pageSize,
    );

    links.last = `${currentUrl.origin}${currentUrl.pathname}?${lastPageQueryString}`;

    return { links };
  }

  getRelationshipsFromArray(
    resource: Record<string, any>,
    relationshipKeys: string[],
    entityName: string,
    addIdToSelfLink = true,
  ) {
    const relationships = {};

    relationshipKeys.forEach((relationKey) => {
      const relatedResource = resource[relationKey];
      if (!relatedResource) return;
      const currentRequestUrl = this.appService.getCurrentRequestUrl();
      const normalizedCurrentRequestUrl = this.normalizeUrl(currentRequestUrl);
      const relationEndpoint = this.appService.getEndpointForRelatedEntity(
        entityName,
        relationKey,
      );
      const urlParamId = addIdToSelfLink ? `/${resource.id}` : '';
      const self = `${normalizedCurrentRequestUrl}${urlParamId}/relationships/${relationKey}`;
      const related = `${this.appBaseUrl}${relationEndpoint}/${relatedResource.id}`;

      relationships[relationKey] = {
        data: {
          type: relationKey,
          id: relatedResource?.id?.toString(),
        },
        links: {
          self,
          related,
        },
      };
    });

    return { relationships };
  }

  private normalizeUrl(urlString: string): string {
    const url = new URL(urlString);
    url.search = '';
    return url.toString();
  }
  private buildPaginationQueryString(
    searchParams: URLSearchParams,
    pageNumber: number,
    pageSize: number,
  ): string {
    const PAGE_NUMBER_KEY = 'page[number]';
    const PAGE_SIZE_KEY = 'page[size]';
    searchParams.set(PAGE_NUMBER_KEY, pageNumber.toString());
    searchParams.set(PAGE_SIZE_KEY, pageSize.toString());
    return Array.from(searchParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  createSerializationOptions<T>(
    resource: T,
    relationshipKeys: string[],
  ): SerializerOptions {
    if (!resource) return RESPONSE_ADAPTER_BASE_OPTIONS;

    const attributes = Object.keys(resource).filter(
      (attr) => !relationshipKeys.includes(attr) && attr !== 'id',
    );

    return {
      ...RESPONSE_ADAPTER_BASE_OPTIONS,
      attributes,
    };
  }

  getIncludedData<T>(
    resource: T,
    relationshipKeys: string[],
    entityName: string,
  ): { included: Record<string, any>[] } {
    const included = [];

    relationshipKeys.forEach((relationKey) => {
      const relatedResource = resource[relationKey];
      if (!relatedResource) return;

      const isOnRelationship = included.find((data) => {
        return (
          data.type === relationKey && `${data.id}` === `${relatedResource.id}`
        );
      });

      if (isOnRelationship) return;

      const relationSerializer = new Serializer(relationKey, {
        ...RESPONSE_ADAPTER_BASE_OPTIONS,
        attributes: Object.keys(relatedResource).filter(
          (attribute: string) => attribute !== 'id',
        ),
      });

      const selfEndpoint = this.appService.getEndpointForRelatedEntity(
        entityName,
        relationKey,
      );

      const data = relationSerializer.serialize(relatedResource).data;

      const links = {
        self: `${this.appBaseUrl}${selfEndpoint}/${relatedResource.id}`,
      };

      included.push({
        ...data,
        links,
      });
    });

    return { included };
  }

  addSelfLink(serializedResource: SerializedResource): void {
    serializedResource.links = {
      self: `${this.appService.getCurrentRequestUrl()}`,
    };
  }

  getLinkForOneRelationship(
    relationshipName: string,
    id: string | undefined,
  ): {
    self: string;
    related: string;
  } {
    const currentEndpoint = this.appService.getCurrentRequestUrl();

    const normalizedEndpoint = this.normalizeUrl(currentEndpoint);
    const relationEndpoint =
      this.appService.getEndpointFromEntity(relationshipName);
    const idParam = id ? `/${id}` : '';

    return {
      self: normalizedEndpoint,
      related: `${this.appBaseUrl}${relationEndpoint}${idParam}`,
    };
  }
}
