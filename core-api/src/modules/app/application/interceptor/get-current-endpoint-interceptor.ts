import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from '../service/app.service';

@Injectable()
export class GetCurrentEndpointInterceptor implements NestInterceptor {
  constructor(private readonly appService: AppService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const host = request.headers.host;
    const endpointUrl = `${request.protocol}://${host}${request.url}`;
    this.appService.setCurrentRequestUrl(endpointUrl);
    return next.handle();
  }
}
