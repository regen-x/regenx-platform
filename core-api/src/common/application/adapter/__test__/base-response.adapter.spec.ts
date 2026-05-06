import { Test, TestingModule } from '@nestjs/testing';
import { ResponseSerializerService } from '../../../../modules/app/application/service/response-serializer.service';
import { BaseResponseAdapter } from '../base-response.adapter';
import { Provider } from '@nestjs/common';

jest.mock(
  '../../../../modules/app/application/service/response-serializer.service',
);

describe('BaseResponseAdapter', () => {
  let responseAdapter: BaseResponseAdapter;
  let serializerService: jest.Mocked<ResponseSerializerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ResponseSerializerService,
          useClass: jest.fn(() => ({
            createSerializationOptions: jest.fn(),
            serialize: jest.fn(),
            addSelfLink: jest.fn(),
            getRelationshipsFromArray: jest.fn(),
            getIncludedData: jest.fn(),
            getManyEntitiesLinks: jest.fn(),
            getLinkForOneRelationship: jest.fn(),
          })),
        },
        BaseResponseAdapter as Provider,
      ],
    }).compile();

    responseAdapter = module.get<BaseResponseAdapter>(BaseResponseAdapter);
    serializerService = module.get<ResponseSerializerService>(
      ResponseSerializerService,
    ) as jest.Mocked<ResponseSerializerService>;
  });

  describe('oneEntityResponse', () => {
    it('should return serialized resource with no relationships', () => {
      const entityName = 'TestEntity';
      const resource = { id: '1', name: 'Test' };
      const relationshipsKeys: string[] = [];
      const expectedSerializedResource = {
        data: { id: '1', type: 'TestEntity' },
      };

      serializerService.createSerializationOptions.mockReturnValue({});
      serializerService.serialize.mockReturnValue(expectedSerializedResource);

      const result = responseAdapter.oneEntityResponse(
        entityName,
        resource,
        relationshipsKeys,
      );

      expect(serializerService.createSerializationOptions).toHaveBeenCalledWith(
        resource,
        relationshipsKeys,
      );
      expect(serializerService.serialize).toHaveBeenCalledWith(
        entityName,
        { id: '', ...resource },
        {},
      );
      expect(result).toEqual(expectedSerializedResource);
    });

    it('should return serialized resource with relationships and included data', () => {
      const entityName = 'TestEntity';
      const resource = { id: '1', name: 'Test' };
      const relationshipsKeys = ['relatedEntity'];
      const expectedSerializedResource = {
        data: { id: '1', type: 'TestEntity' },
      };
      const relationships = {
        relatedEntity: { data: { id: '2', type: 'RelatedEntity' } },
      };
      const included = [{ id: '2', type: 'RelatedEntity' }];

      serializerService.createSerializationOptions.mockReturnValue({});
      serializerService.serialize.mockReturnValue(expectedSerializedResource);
      serializerService.getRelationshipsFromArray.mockReturnValue({
        relationships,
      });
      serializerService.getIncludedData.mockReturnValue({ included });

      const result = responseAdapter.oneEntityResponse(
        entityName,
        resource,
        relationshipsKeys,
      );

      expect(serializerService.getRelationshipsFromArray).toHaveBeenCalledWith(
        resource,
        relationshipsKeys,
        entityName,
        false,
      );
      expect(serializerService.getIncludedData).toHaveBeenCalledWith(
        resource,
        relationshipsKeys,
        entityName,
      );
      expect(result).toEqual({
        ...expectedSerializedResource,
        included,
        data: {
          ...expectedSerializedResource.data,
          relationships,
        },
      });
    });
  });

  describe('manyEntitiesResponse', () => {
    it('should return serialized collection with pagination', () => {
      const entityName = 'TestEntity';
      const collection = {
        data: [
          { id: '1', name: 'Test1' },
          { id: '2', name: 'Test2' },
        ],
        pageNumber: 1,
        pageSize: 10,
        pageCount: 1,
        itemCount: 2,
      };
      const relationshipKeys: string[] = [];
      const serializedResources = {
        data: [
          { id: '1', type: 'TestEntity' },
          { id: '2', type: 'TestEntity' },
        ],
      };
      const links = { self: '/test-entities', next: null, last: null };

      serializerService.createSerializationOptions.mockReturnValue({});
      serializerService.serialize.mockReturnValue(serializedResources);
      serializerService.getManyEntitiesLinks.mockReturnValue({ links });

      const result = responseAdapter.manyEntitiesResponse(
        entityName,
        collection,
        relationshipKeys,
      );

      expect(serializerService.getManyEntitiesLinks).toHaveBeenCalledWith(
        collection,
      );
      expect(result).toEqual({
        ...serializedResources,
        links,
        meta: {
          itemCount: 2,
          pageCount: 1,
          pageSize: 10,
          pageNumber: 1,
        },
        included: [],
      });
    });
  });

  describe('oneRelationshipsResponse', () => {
    it('should return serialized relationship', () => {
      const response = { id: '2', name: 'Related' };
      const relationName = 'RelatedEntity';
      const id = '1';
      const serializedResponse = { data: { id: '2', type: 'RelatedEntity' } };
      const links = {
        self: '/entities/1/relationships/relatedEntity',
        next: null,
        last: null,
        related: '/related-entities/2',
      };

      serializerService.serialize.mockReturnValue(serializedResponse);
      serializerService.getLinkForOneRelationship.mockReturnValue(links);

      const result = responseAdapter.oneRelationshipsResponse(
        response,
        relationName,
        id,
      );

      expect(serializerService.getLinkForOneRelationship).toHaveBeenCalledWith(
        relationName,
        id,
      );
      expect(result).toEqual({
        data: [serializedResponse.data],
        links,
      });
    });
  });
});
