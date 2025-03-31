// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EntraIDStrategy } from './strategies/entra.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles/roles.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'EntraID' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EntraIDStrategy
  ],
  exports: [PassportModule],
})
export class AuthModule {}