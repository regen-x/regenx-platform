import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { AppService } from '../app.service';

const mockDiscoveryService = {
  getControllers: jest.fn(),
};

const mockReflector = {
  get: jest.fn(),
};

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: DiscoveryService, useValue: mockDiscoveryService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setCurrentRequestUrl and getCurrentRequestUrl', () => {
    it('should set and get the current request URL', () => {
      const url = 'http://localhost:3000/test';
      service.setCurrentRequestUrl(url);
      expect(service.getCurrentRequestUrl()).toBe(url);
    });
  });

  describe('getEndpointFromEntity', () => {
    it('should return the correct endpoint for an entity', () => {
      service['endpoints'] = {
        testEntity: { basePath: '/test-path', methods: new Set() },
      };

      const result = service.getEndpointFromEntity('testEntity');
      expect(result).toBe('/test-path');
    });

    it('should return an empty string if the entity is not found', () => {
      const result = service.getEndpointFromEntity('unknownEntity');
      expect(result).toBe('');
    });
  });

  describe('getEndpointForRelatedEntity', () => {
    it('should return the correct endpoint for related entities', () => {
      service['endpoints'] = {
        entityA: { basePath: '/entity-a', methods: new Set() },
        entityB: { basePath: '/entity-b', methods: new Set() },
      };

      const result = service.getEndpointForRelatedEntity('entityA', 'entityB');
      expect(result).toBe('/entity-b');
    });

    it('should return an empty string if either entity is not found', () => {
      service['endpoints'] = {
        entityA: { basePath: '/entity-a', methods: new Set() },
      };

      const result = service.getEndpointForRelatedEntity(
        'entityA',
        'unknownEntity',
      );
      expect(result).toBe('');
    });
  });

  describe('onModuleInit', () => {
    it('should register controllers on module initialization', () => {
      const mockControllers = [
        {
          metatype: class TestController {},
          instance: {},
        },
      ];

      mockDiscoveryService.getControllers.mockReturnValue(mockControllers);
      mockReflector.get.mockReturnValue({ entity: 'testEntity' });

      jest.spyOn(service, 'registerControllers' as any);

      service.onModuleInit();

      expect(service['registerControllers' as any]).toHaveBeenCalledWith(
        mockControllers,
      );
    });
  });
});
