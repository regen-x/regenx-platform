import { Catch, HttpException } from '@nestjs/common';
import { sentenceCase } from 'change-case-all';
import { Request } from 'express';
import { BaseExceptionFilter } from '../../../../common/application/filter/base-exception.filter';

@Catch(HttpException)
export class AppExceptionFilter extends BaseExceptionFilter {
  createErrorResponse(
    exception: HttpException,
    request: Request,
  ): {
    error: {
      status: string;
      source: { pointer: string };
      title: string;
      detail: string;
    };
  } {
    const exceptionResponse = exception.getResponse();
    const errorInfo = Array.isArray(exceptionResponse)
      ? exceptionResponse[0]
      : exceptionResponse;

    const errorTitle =
      errorInfo?.title ||
      sentenceCase(exception.name.replace('Exception', '')) ||
      'An error occurred';

    const errorDetail =
      errorInfo?.detail || errorInfo?.message || 'An error occurred';

    const errorSourcePointer = errorInfo?.pointer || request.url;

    const error = {
      status: errorInfo?.status || String(exception.getStatus()),
      source: { pointer: errorSourcePointer },
      title: errorTitle,
      detail: errorDetail,
    };

    return {
      error,
    };
  }
}
