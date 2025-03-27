import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { UsageLimitService } from 'src/chat/usage-limit.service';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(private readonly usageLimitService: UsageLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if this user has exceeded their limit based on their role
    if (await this.usageLimitService.hasExceededLimit(user)) {
      const userLimit = this.usageLimitService.getUserMonthlyLimit(user);
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      throw new ForbiddenException({
        message: `Monthly usage limit exceeded. Your role-based limit is $${userLimit.toFixed(2)} per month.`,
        error: 'Usage Limit Exceeded',
        details: {
          limit: userLimit,
          resetDays: daysUntilReset,
          resetDate: nextMonth.toISOString().split('T')[0],
          userRole: user.roles[0], // Primary role
        }
      });
    }
    
    return true;
  }
}