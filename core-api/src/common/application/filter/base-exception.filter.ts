import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErrorResponse } from '../../../modules/app/interface/exception-filter/app-error-response.interface';

export class BaseExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = this.createErrorResponse(exception, request);

    response.status(status).json(errorResponse);
  }

  createErrorResponse(
    exception: HttpException,
    request: Request,
  ): AppErrorResponse {
    return {
      error: {
        status: String(exception.getStatus()),
        source: { pointer: request.url },
        title: 'An error occurred',
        detail: 'An error occurred',
      },
    };
  }
}
