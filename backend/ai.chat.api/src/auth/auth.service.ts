// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { User } from './strategies/entra.strategy';

@Injectable()
export class AuthService {
  
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {}

  async exchangeCodeForTokens(code: string) {
    const tokenEndpoint = `https://login.microsoftonline.com/${this.configService.get('ENTRA_TENANT_ID')}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', this.configService.get('ENTRA_CLIENT_ID') || '');
    params.append('scope', 'openid');
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', this.configService.get('REDIRECT_URI') || '');
    params.append('client_secret', this.configService.get('ENTRA_CLIENT_SECRET') || '');

    const response = await axios.post(tokenEndpoint, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    return response.data;
  }

  async generateJwtToken(user: User): Promise<string> {
    const payload = {
      email: user.email,
      name: user.name,
      emplId: user.emplId,
      picture: user.picture,
      roles: user.roles
    };
    
    return this.jwtService.sign(payload, {
      expiresIn: '1d',
      secret: this.configService.get('JWT_SECRET'),
    });
  }
}