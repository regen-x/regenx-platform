import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredException } from '../../application/exception/token-expired.exception';
import { TOKEN_EXPIRED_ERROR } from '../../application/exception/authentication-exception-messages';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
  handleRequest(err: any, user: any, info: null | Error) {
    if (info?.name === 'TokenExpiredError')
      throw new TokenExpiredException(TOKEN_EXPIRED_ERROR);
    else if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
