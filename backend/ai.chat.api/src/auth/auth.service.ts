import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AuthService {
  
  constructor(
    private configService: ConfigService
  ) {}

  async exchangeCodeForTokens(code: string) {
    const tokenEndpoint = `https://login.microsoftonline.com/${this.configService.get('ENTRA_TENANT_ID')}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', this.configService.get('ENTRA_CLIENT_ID') || '');
    // Example if you have API-specific scopes
    params.append('scope', 'openid profile email api://e388e26f-b9bf-45da-beb4-b6caa48c4cdd/Read offline_access');
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

}