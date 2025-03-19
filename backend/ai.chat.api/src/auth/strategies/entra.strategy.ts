import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

export interface User {
  email: string;
  name: string;
  roles: string[];
}

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

  validate(payload: any): User {
    console.log('payload', payload);
    // TODO: release Emplid claim and add
    // Here's where we can modify user object
    const roles = payload.roles || [];
    return { email: payload.email, name: payload.name, roles };
  }
}