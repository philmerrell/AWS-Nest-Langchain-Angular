import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private configService: ConfigService) {}
  
  @Post('token')
  async getToken(@Body() body: { code: string }) {
    if (!body.code) {
      throw new HttpException('Authorization code is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const tokens = await this.authService.exchangeCodeForTokens(body.code);
      return tokens;
    } catch (error) {
        console.log(error);
      throw new HttpException('Failed to exchange code for tokens', HttpStatus.UNAUTHORIZED);
    }
  }
}