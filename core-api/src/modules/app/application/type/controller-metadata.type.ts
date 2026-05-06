export type ClassMethod = (...args: any[]) => any;

export type Constructor<T = any> = new (...args: any[]) => T;

export type ControllerMetadata = {
  metatype: Constructor;
  instance: ControllerInstance;
};
export type Endpoints = {
  [entity: string]: Endpoint;
};
export type ControllerInstance = {
  [key: string]: unknown;
};
export type Endpoint = {
  basePath?: string;
  methods: Set<string>;
};

export type EndpointMetadata =
  | {
      entity: string;
    }
  | undefined;
