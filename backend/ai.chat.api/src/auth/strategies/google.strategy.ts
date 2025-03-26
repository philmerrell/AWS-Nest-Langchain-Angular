// src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { User } from './entra.strategy'; // Reusing your existing User interface

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    console.log(profile);
    
    // Check if the email is from Boise State domain
    const email:string = emails[0].value;
    const photo = photos[0].value;
    if (!email.endsWith('@boisestate.edu')) {
      return done(new Error('Only Boise State emails are allowed'), null);
    }
    
    const user: User = {
      email: email.toLowerCase(),
      name: name.givenName + ' ' + name.familyName,
      picture: photo,
      roles: ['DotNetDevelopers'],
      emplId: profile.id, // Using Google profile ID as emplId
    };
    
    return done(null, user);
  }
}