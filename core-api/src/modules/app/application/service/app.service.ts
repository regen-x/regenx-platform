import { Injectable } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import {
  ClassMethod,
  Constructor,
  ControllerInstance,
  ControllerMetadata,
  EndpointMetadata,
  Endpoints,
} from '../type/controller-metadata.type';
import { ENDPOINT_KEY } from '../../../../common/application/interface/decorators/endpoint-entity.decorator';

@Injectable()
export class AppService {
  private endpoints: Endpoints = {};
  private currentRequestUrl: string;

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    const controllers = this.discoveryService.getControllers();
    this.registerControllers(controllers);
  }

  public setCurrentRequestUrl(endpoint: string) {
    this.currentRequestUrl = endpoint;
  }

  public getCurrentRequestUrl() {
    return this.currentRequestUrl;
  }

  public getEndpointFromEntity(entity: string): string {
    return this.endpoints[entity]?.basePath || '';
  }

  public getEndpointForRelatedEntity(
    entity: string,
    relatedEntity: string,
  ): string {
    const entityEndpoint = this.endpoints[entity];
    const relatedEndpoint = this.endpoints[relatedEntity];

    if (!entityEndpoint || !relatedEndpoint) return '';

    const entityPath = entityEndpoint.basePath;
    const relatedPath = relatedEndpoint.basePath;

    if (!entityPath || !relatedPath) return '';

    return relatedPath;
  }

  private normalizePath(pathValue: unknown): string {
    if (typeof pathValue === 'string') {
      return pathValue;
    }

    if (Array.isArray(pathValue)) {
      const firstString = pathValue.find((value) => typeof value === 'string');
      return firstString || '';
    }

    return '';
  }

  private discoverControllerMethods(
    instance: ControllerInstance,
    entity: string,
    controllerPath: string,
  ): void {
    const prototype = Object.getPrototypeOf(instance);
    const propertyNames = Object.getOwnPropertyNames(prototype);

    this.endpoints[entity] = this.endpoints[entity] || { methods: new Set() };

    propertyNames.forEach((methodName) => {
      const method = prototype[methodName];

      if (typeof method !== 'function') return;

      const methodPath = this.normalizePath(this.getMethodPath(method));

      if (!methodPath) return;

      const pathParts = controllerPath.split('/').filter((part) => part !== '');
      const sanitizedControllerPath = '/' + pathParts.join('/');

      const sanitizedMethodPath = methodPath.endsWith('/')
        ? methodPath.slice(0, -1)
        : methodPath;

      const endpointPath = `${sanitizedControllerPath}${sanitizedMethodPath}`;

      const isMethodRegistered =
        this.endpoints[entity].methods.has(endpointPath);

      if (!isMethodRegistered) {
        this.endpoints[entity].methods.add(endpointPath);
      }
    });
  }

  private registerControllers(controllers: InstanceWrapper[]) {
    controllers.forEach((controller) => {
      const { metatype, instance } = controller as ControllerMetadata;

      if (!instance || !metatype) return;

      const endpointMetadata = this.getEndpointMetadata(metatype);
      const controllerPath = this.normalizePath(this.getControllerPath(metatype));

      if (!endpointMetadata || !controllerPath) return;

      const { entity } = endpointMetadata;
      const endpoint = this.endpoints[entity];

      if (!endpoint) {
        this.endpoints[entity] = {
          basePath: controllerPath,
          methods: new Set<string>(),
        };
      }

      this.discoverControllerMethods(instance, entity, controllerPath);
    });
  }

  private getControllerPath(metatype: Constructor): unknown {
    return Reflect.getMetadata(PATH_METADATA, metatype);
  }

  private getEndpointMetadata(metatype: Constructor): EndpointMetadata {
    return this.reflector.get(ENDPOINT_KEY, metatype);
  }

  private getMethodPath(method: ClassMethod | Constructor): unknown {
    return Reflect.getMetadata(PATH_METADATA, method);
  }
}
