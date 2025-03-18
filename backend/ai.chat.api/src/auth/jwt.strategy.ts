import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `${configService.get<string>('JWKS_URI')}`,
      }),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    // if (!payload.roles || !Array.isArray(payload.roles)) {
    //     throw new UnauthorizedException('No roles assigned');
    // }
    return { userId: payload.sub, email: payload.email };
  }
}