import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

export interface User {
  email: string;
  emplId: string;
  name: string;
  roles?: string[];
  picture?: string;
}

@Injectable()
export class EntraIDStrategy extends PassportStrategy(Strategy, 'EntraID') {
  constructor(protected readonly configService: ConfigService) {
    const issuer = `https://login.microsoftonline.com/${configService.get('ENTRA_TENANT_ID')}/v2.0`;
    const audience = configService.get('ENTRA_CLIENT_ID');
    const jwksUri = `https://login.microsoftonline.com/${configService.get('ENTRA_TENANT_ID')}/discovery/v2.0/keys`;
    console.log('jwksUri', jwksUri);
    console.log('issuer', issuer);
    console.log('audience', audience);
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
    // TODO: release Emplid claim and add
    // Here's where we can modify user object
    return { email: 'philmerrell@boisestate.edu', emplId: '123456789', name: 'Phil Merrell', roles: ['DotNetDevelopers'] };
    const roles = payload.roles || [];
    return { email: payload.email, name: payload.name, emplId: payload.emplId, roles };
  }
}