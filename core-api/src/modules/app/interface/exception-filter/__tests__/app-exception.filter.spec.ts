import { ArgumentsHost, HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { AppExceptionFilter } from '../app-exception.filter';

describe('AppExceptionFilter', () => {
  let appExceptionFilter: AppExceptionFilter;
  let mockResponse: Pick<Response, 'status' | 'json'>;
  let mockRequest: Pick<Request, 'url'>;
  const DEFAULT_ERROR_TITLE = 'An error occurred';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppExceptionFilter],
    }).compile();

    appExceptionFilter = module.get<AppExceptionFilter>(AppExceptionFilter);
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      url: '/test-route',
    };
  });

  it('should catch HttpException and send the correct error response', () => {
    const mockHttpException = new HttpException('Error message', 400);
    const host: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    appExceptionFilter.catch(mockHttpException, host);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        status: '400',
        source: { pointer: '/test-route' },
        title: DEFAULT_ERROR_TITLE,
        detail: 'Error message',
      },
    });
  });

  it('should use default values if errorInfo is not provided', () => {
    const mockHttpException = new HttpException(null, 400);

    const host: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    jest.spyOn(mockHttpException, 'getResponse').mockReturnValue({});

    appExceptionFilter.catch(mockHttpException, host);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        status: '400',
        source: { pointer: '/test-route' },
        title: DEFAULT_ERROR_TITLE,
        detail: 'An error occurred',
      },
    });
  });

  it('should handle an error response that is an array', () => {
    const mockErrorArray = [{ message: 'Array error', status: 400 }];
    const mockHttpException = new HttpException(mockErrorArray, 400);

    const host: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    appExceptionFilter.catch(mockHttpException, host);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        status: '400',
        source: { pointer: '/test-route' },
        title: DEFAULT_ERROR_TITLE,
        detail: 'Array error',
      },
    });
  });

  it('should return a title when exception does not have a name', () => {
    const mockHttpException = new HttpException('Exception without name', 400);
    Object.defineProperty(mockHttpException, 'name', {
      get: () => undefined,
    });

    const errorInfo = { title: '' };
    const errorTitle = appExceptionFilter['getErrorTitle'](
      errorInfo,
      mockHttpException,
    );

    expect(errorTitle).toBe(DEFAULT_ERROR_TITLE);
  });

  it('should handle an empty string message', () => {
    const mockHttpException = new HttpException('', 400);

    const host: ArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    appExceptionFilter.catch(mockHttpException, host);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        status: '400',
        source: { pointer: '/test-route' },
        title: DEFAULT_ERROR_TITLE,
        detail: 'An error occurred',
      },
    });
  });

  it('should return the correct error title', () => {
    const mockHttpException = new HttpException('Error title', 400);

    const errorInfo = { title: 'Specific error' };
    const errorTitle = appExceptionFilter['getErrorTitle'](
      errorInfo,
      mockHttpException,
    );

    expect(errorTitle).toBe('Specific error');
  });

  it('should return the default error title if no title is provided', () => {
    const mockHttpException = new HttpException('Http Exception', 400);
    const errorTitle = appExceptionFilter['getErrorTitle'](
      {},
      mockHttpException,
    );

    expect(errorTitle).toBe(DEFAULT_ERROR_TITLE);
  });

  it('should return the correct error detail', () => {
    const errorDetail = appExceptionFilter['getErrorDetail']({
      message: 'Test Detail',
    });

    expect(errorDetail).toBe('Test Detail');
  });

  it('should return the default error detail if no message is provided', () => {
    const errorDetail = appExceptionFilter['getErrorDetail']({});

    expect(errorDetail).toBe('An error occurred');
  });

  it('should return the correct error pointer', () => {
    const errorPointer = appExceptionFilter['getErrorPointer'](
      { pointer: 'Test Pointer' },
      mockRequest as Request,
    );

    expect(errorPointer).toBe('Test Pointer');
  });

  it('should return the request URL as error pointer if no pointer is provided', () => {
    const errorPointer = appExceptionFilter['getErrorPointer'](
      {},
      mockRequest as Request,
    );

    expect(errorPointer).toBe('/test-route');
  });
});
