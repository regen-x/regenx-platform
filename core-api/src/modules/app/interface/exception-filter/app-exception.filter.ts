import { Catch, HttpException } from '@nestjs/common';
import { sentenceCase } from 'change-case-all';
import { Request } from 'express';

import { AppErrorResponse } from './app-error-response.interface';
import { IBaseErrorInfo } from '../../../../common/application/interface/base-error.interface';
import { BaseExceptionFilter } from '../../../../common/application/filter/base-exception.filter';

@Catch(HttpException)
export class AppExceptionFilter extends BaseExceptionFilter {
  createErrorResponse(
    exception: HttpException,
    request: Request,
  ): AppErrorResponse {
    const errorInfo = this.getErrorInfoFromException(exception);

    const errorTitle = this.getErrorTitle(errorInfo, exception);
    const errorDetail = this.getErrorDetail(errorInfo);
    const errorPointer = this.getErrorPointer(errorInfo, request);

    return {
      error: {
        status: String(errorInfo?.status || exception.getStatus()),
        source: { pointer: errorPointer },
        title: errorTitle,
        detail: errorDetail,
      },
    };
  }

  private getErrorInfoFromException(exception: HttpException): IBaseErrorInfo {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }
    if (Array.isArray(exceptionResponse)) {
      return exceptionResponse[0];
    }

    return exceptionResponse as IBaseErrorInfo;
  }

  private getErrorTitle(
    errorInfo: IBaseErrorInfo,
    exception: HttpException,
  ): string {
    const DEFAULT_ERROR_TITLE = 'An error occurred';
    const GENERIC_EXCEPTION = 'HttpException';
    const exceptionName = exception?.name || '';
    const errorTitle = errorInfo?.title || '';

    if (exceptionName === GENERIC_EXCEPTION) {
      return errorTitle || DEFAULT_ERROR_TITLE;
    }

    const formattedName = sentenceCase(exceptionName.replace('Exception', ''));
    return errorTitle || formattedName || DEFAULT_ERROR_TITLE;
  }

  private getErrorDetail(errorInfo: IBaseErrorInfo): string {
    const DEFAULT_ERROR_DETAIL = 'An error occurred';
    const { message = '' } = errorInfo || {};
    return message || DEFAULT_ERROR_DETAIL;
  }

  private getErrorPointer(errorInfo: IBaseErrorInfo, request: Request): string {
    const { pointer = '' } = errorInfo || {};
    return pointer || request.url;
  }
}
