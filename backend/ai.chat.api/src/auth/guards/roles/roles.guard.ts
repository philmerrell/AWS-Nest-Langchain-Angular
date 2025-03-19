import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { Role, ROLES_KEY } from './roles.decorator';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
  
      if (!requiredRoles) {
        return true; // If no roles are specified, allow access
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
  
      if (!user || !user.roles || !requiredRoles.some((role) => user.roles.includes(role))) {
        throw new ForbiddenException('You do not have permission to access this resource.');
      }
  
      return true;
    }
  }