import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import {
  IUserRepository,
  USER_REPOSITORY_KEY,
} from '../../../user/application/repository/user.repository.interface';
import { ENVIRONMENT } from '../../../../../configuration/orm.configuration';
import { JWT_AUTOMATED_TESTS_SECRET } from '../../../../../test/test.constants';
import { IAccessTokenPayload } from './access-token-payload.interface';
import { User } from '../../../user/domain/user.domain';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY_KEY)
    private readonly userRepository: IUserRepository,
  ) {
    /* istanbul ignore next */
    const options: StrategyOptionsWithoutRequest =
      process.env.NODE_ENV === ENVIRONMENT.AUTOMATED_TEST
        ? {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_AUTOMATED_TESTS_SECRET,
          }
        : {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            audience: configService.get('auth0.audience'),
            issuer: `https://${configService.get('auth0.domain')}/`,
            algorithms: ['RS256'],
            secretOrKeyProvider: passportJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 5,
              jwksUri: `https://${configService.get('auth0.domain')}/.well-known/jwks.json`,
            }),
          };

    super(options);
  }

  async validate(accessTokenPayload: IAccessTokenPayload): Promise<User> {
    const formattedSub = accessTokenPayload.sub.replace(
      this.configService.get('jwt.providerPrefix'),
      '',
    );

    const currentUser = await this.userRepository.getOneByFilter({
      externalId: formattedSub,
    });

    if (!currentUser) {
      throw new ForbiddenException();
    }

    return currentUser;
  }
}
