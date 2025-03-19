import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EntraIDStrategy } from './strategies/entra.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles/roles.guard';
const passportModule = PassportModule.register({ defaultStrategy: 'EntraID' });
@Module({
  imports: [passportModule],
  controllers: [AuthController],
  providers: [
    
    AuthService, EntraIDStrategy],
  exports: [passportModule],
})
export class AuthModule {}