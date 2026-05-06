import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResponseSerializerService } from '../response-serializer.service';
import { AppService } from '../app.service';
import { SerializerOptions } from 'jsonapi-serializer';
import { CollectionDto } from '../../../../../common/application/dto/collection.dto';

const mockAppService = {
  getCurrentRequestUrl: jest.fn(),
  getEndpointForRelatedEntity: jest.fn(),
  getEndpointFromEntity: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3000'),
};

describe('ResponseSerializerService', () => {
  let service: ResponseSerializerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseSerializerService,
        { provide: AppService, useValue: mockAppService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ResponseSerializerService>(ResponseSerializerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('serialize', () => {
    it('should serialize data correctly', () => {
      const type = 'test';
      const data = { id: '1', name: 'Test Name' };
      const options: SerializerOptions = { attributes: ['name'] };

      const result = service.serialize(type, data, options);

      expect(result).toEqual({
        data: {
          type: 'tests',
          id: '1',
          attributes: {
            name: 'Test Name',
          },
        },
      });
    });
  });

  describe('getManyEntitiesLinks', () => {
    it('should return links for pagination', () => {
      const collection: CollectionDto<any> = {
        data: [],
        pageNumber: 1,
        pageCount: 3,
        pageSize: 10,
        itemCount: 30,
      };
      mockAppService.getCurrentRequestUrl.mockReturnValue(
        'http://localhost:3000/api/resources?page[number]=1&page[size]=10',
      );

      const result = service.getManyEntitiesLinks(collection);

      expect(result.links.self).toBe(
        'http://localhost:3000/api/resources?page[number]=1&page[size]=10',
      );
      expect(result.links.next).toBe(
        'http://localhost:3000/api/resources?page[number]=2&page[size]=10',
      );
      expect(result.links.last).toBe(
        'http://localhost:3000/api/resources?page[number]=3&page[size]=10',
      );
    });
  });

  describe('getRelationshipsFromArray', () => {
    it('should return relationships for resources', () => {
      const resource = { id: '1', relatedEntity: { id: '2' } };
      const relationshipKeys = ['relatedEntity'];
      const entityName = 'testEntity';

      mockAppService.getCurrentRequestUrl.mockReturnValue(
        'http://localhost:3000/api/resources',
      );
      mockAppService.getEndpointForRelatedEntity.mockReturnValue(
        '/api/related-entity',
      );

      const result = service.getRelationshipsFromArray(
        resource,
        relationshipKeys,
        entityName,
      );

      expect(result).toEqual({
        relationships: {
          relatedEntity: {
            data: {
              type: 'relatedEntity',
              id: '2',
            },
            links: {
              self: 'http://localhost:3000/api/resources/1/relationships/relatedEntity',
              related: 'http://localhost:3000/api/related-entity/2',
            },
          },
        },
      });
    });
  });
});
