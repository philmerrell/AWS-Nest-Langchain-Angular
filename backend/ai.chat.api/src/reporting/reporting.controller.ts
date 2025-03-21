import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import {
  EmplIdParamDto,
  YearMonthParamDto,
  YearParamDto,
  DateParamDto,
  PaginationQueryDto,
} from './reporting.dto';

@Controller('reporting')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // USER

  @Get('users/:emplId/monthly/:yearMonth')
  async getUserMonthlyCost(
    @Param() params: EmplIdParamDto & YearMonthParamDto,
  ) {
    return this.reportingService.getUserMonthlyCost(params.emplId, params.yearMonth);
  }

  @Get('users/:emplId/yearly/:year')
  async getUserYearlyCost(
    @Param() params: EmplIdParamDto & YearParamDto,
  ) {
    return this.reportingService.getUserYearlyCost(params.emplId, params.year);
  }

  @Get('users/:emplId/daily-breakdown/:date')
  async getUserDailyBreakdown(
    @Param() params: EmplIdParamDto & DateParamDto,
  ) {
    return this.reportingService.getUserUsageBreakdown(params.emplId, params.date);
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
