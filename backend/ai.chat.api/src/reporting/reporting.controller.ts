import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import {
  YearMonthParamDto,
  YearParamDto,
  DateParamDto,
  PaginationQueryDto,
} from './reporting.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // USER

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

  // ADMIN

  @Get('admin/daily/:date')
  async getAllUserDailyCosts(
    @Param() params: DateParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    const lastKey = query.lastKey ? JSON.parse(query.lastKey) : undefined;
    return this.reportingService.getAllUserDailyCosts(params.date, query.limit, lastKey);
  }

  @Get('admin/top-users/:date')
  async getTopUsers(
    @Param() params: DateParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    const lastKey = query.lastKey ? JSON.parse(query.lastKey) : undefined;
    return this.reportingService.getTopUsersByCost(params.date, query.limit, lastKey);
  }
}
