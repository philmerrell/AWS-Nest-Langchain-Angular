// src/auth/auth.controller.ts
import { Controller, Get, Post, Body, HttpException, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response } from 'express';

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

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // This route initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const user = req.user;
    const jwt = await this.authService.generateJwtToken(user);
    
    // Redirect to the client app with the token
    res.redirect(`${this.configService.get('FRONTEND_URL')}?token=${jwt}`);
  }
}