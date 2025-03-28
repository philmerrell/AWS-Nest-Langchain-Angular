// backend/ai.chat.api/src/reporting/reporting.controller.ts
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import {
  YearMonthParamDto,
  YearParamDto,
  DateParamDto,
  PaginationQueryDto,
} from './reporting.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Role, Roles } from 'src/auth/guards/roles/roles.decorator';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // USER ENDPOINTS
  
  @Get('users/monthly/:yearMonth')
  @UseGuards(JwtAuthGuard)
  async getUserMonthlyCost(
    @Param() params: YearMonthParamDto,
    @Req() req: any
  ) {
    const user = req.user;
    return this.reportingService.getUserMonthlyCost(user.emplId, params.yearMonth);
  }

  @Get('users/yearly/:year')
  @UseGuards(JwtAuthGuard)
  async getUserYearlyCost(
    @Param() params: YearParamDto,
    @Req() req: any
  ) {
    const user = req.user;
    return this.reportingService.getUserYearlyCost(user.emplId, params.year);
  }

  @Get('users/daily-breakdown/:date')
  @UseGuards(JwtAuthGuard)
  async getUserDailyBreakdown(
    @Param() params: DateParamDto,
    @Req() req: any
  ) {
    const user = req.user;
    return this.reportingService.getUserUsageBreakdown(user.emplId, params.date);
  }

  // ADMIN ENDPOINTS

  @Get('admin/top-users/yearly/:year')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DotNetDevelopers)
  async getTopUsersByYear(
    @Param() params: YearParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    const lastKey = query.lastKey ? JSON.parse(query.lastKey) : undefined;
    return this.reportingService.getTopUsersByCost(params.year, query.limit, lastKey);
  }
 

  @Get('admin/top-users/:date')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DotNetDevelopers)
  async getTopUsers(
    @Param() params: DateParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    const lastKey = query.lastKey ? JSON.parse(query.lastKey) : undefined;
    return this.reportingService.getTopUsersByCost(params.date, query.limit, lastKey);
  }
  
  @Get('admin/monthly-summary/:yearMonth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DotNetDevelopers)
  async getAdminMonthlySummary(
    @Param() params: YearMonthParamDto,
  ) {
    return this.reportingService.getAdminMonthlySummary(params.yearMonth);
  }

  @Get('admin/top-users/monthly/:yearMonth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DotNetDevelopers)
  async getTopUsersByMonth(
    @Param() params: YearMonthParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    const lastKey = query.lastKey ? JSON.parse(query.lastKey) : undefined;
    return this.reportingService.getTopUsersByCost(params.yearMonth, query.limit, lastKey);
  }
}