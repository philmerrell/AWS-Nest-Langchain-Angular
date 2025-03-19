import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EntraIDStrategy extends PassportStrategy(Strategy, 'EntraID') {
  constructor(protected readonly configService: ConfigService) {
    const issuer = `https://login.microsoftonline.com/${configService.get('ENTRA_TENANT_ID')}/v2.0`;
    const audience = configService.get('ENTRA_CLIENT_ID');
    const jwksUri = `https://login.microsoftonline.com/${configService.get('ENTRA_TENANT_ID')}/discovery/v2.0/keys`;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience,
      issuer,
      algorithms: ['RS256'],
      ignoreExpiration: true,
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
    });
  }

  validate(payload: any) {
    console.log('payload', payload);
    const roles = payload.roles || [];
    return { ...payload, roles };
  }
}