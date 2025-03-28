// backend/ai.chat.api/src/reporting/reporting.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class ReportingService {
  private readonly ddbClient: DynamoDBClient;
  private readonly ddbDocClient: DynamoDBDocumentClient;

  constructor(private readonly configService: ConfigService) {
    this.ddbClient = new DynamoDBClient({});
    this.ddbDocClient = DynamoDBDocumentClient.from(this.ddbClient);
  }

  // USER METHODS

  async getUserMonthlyCost(emplId: string, yearMonth: string) {
    const result = await this.ddbDocClient.send(new QueryCommand({
      TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
      KeyConditionExpression: 'PK = :pk and SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${emplId}`,
        ':sk': `AGG#MONTH#${yearMonth}`,
      },
    }));

    return { cost: result.Items?.[0]?.totalCost ?? 0 };
  }

  async getUserYearlyCost(emplId: string, year: string) {
    const result = await this.ddbDocClient.send(new QueryCommand({
      TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
      KeyConditionExpression: 'PK = :pk and SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `USER#${emplId}`,
        ':sk': `AGG#YEAR#${year}`,
      },
    }));

    return { cost: result.Items?.[0]?.totalCost ?? 0 };
  }

  async getUserUsageBreakdown(emplId: string, date: string) {
    const result = await this.ddbDocClient.send(new QueryCommand({
      TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
      KeyConditionExpression: 'PK = :pk and begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${emplId}`,
        ':sk': `USAGE#`,
      },
    }));

    return result.Items
      ?.filter(item => item.SK.includes(`#${date}`))
      .map(item => ({
        modelId: item.SK.split('#')[1],
        inputTokens: item.inputTokens ?? 0,
        outputTokens: item.outputTokens ?? 0,
        totalCost: item.totalCost ?? 0,
      })) ?? [];
  }

  // ADMIN METHODS

  async getTopUsersByCost(dateParam: string, limit = 10, lastKey?: Record<string, any>): Promise<any> {
    // Determine the type of date parameter (day, month, or year)
    const dateType = this.getDateParamType(dateParam);
    
    // Query based on date format
    const queryPrefix = dateType === 'day' 
      ? `DAY#${dateParam}#` 
      : dateType === 'month' 
        ? `MONTH#${dateParam}#` 
        : `YEAR#${dateParam}#`;
    
    // Get all records for the time period
    const result = await this.ddbDocClient.send(new QueryCommand({
      TableName: this.configService.get('ADMIN_AGGREGATES_TABLE_NAME'),
      KeyConditionExpression: 'PK = :pk and begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': 'AGGREGATE',
        ':sk': queryPrefix,
      },
    }));
    
    // Aggregate by user
    const userMap = new Map<string, { emplId: string, email: string, totalCost: number }>();
    
    result.Items?.forEach(item => {
      const userKey = item.emplId;
      if (!userMap.has(userKey)) {
        userMap.set(userKey, { 
          emplId: item.emplId, 
          email: item.email, 
          totalCost: 0 
        });
      }
      userMap.get(userKey)!.totalCost += (item.totalCost || 0);
    });
    
    // Convert to array and sort by cost (highest first)
    const aggregatedUsers = Array.from(userMap.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
    
    return {
      items: aggregatedUsers,
      // We're aggregating in memory, so pagination changes to be simpler
      lastKey: aggregatedUsers.length === limit ? { lastEmplId: aggregatedUsers[aggregatedUsers.length - 1].emplId } : null,
    };
  }
  
  // Helper to determine date parameter type
  private getDateParamType(dateParam: string): 'day' | 'month' | 'year' {
    const parts = dateParam.split('-');
    if (parts.length === 3) return 'day';
    if (parts.length === 2) return 'month';
    return 'year';
  }

  async getAdminMonthlySummary(yearMonth: string) {
    // First, get all daily aggregates for the month
    const days = this.getDaysInMonth(yearMonth);
    
    // Create a map to store totals by day
    const dailyTotals = new Map<string, number>();
    let totalUsers = 0;
    const uniqueUsers = new Set<string>();
    let totalCost = 0;
    
    // Process each day in the month
    for (const day of days) {
      const dayResult = await this.ddbDocClient.send(new QueryCommand({
        TableName: this.configService.get('ADMIN_AGGREGATES_TABLE_NAME'),
        KeyConditionExpression: 'PK = :pk and begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': 'AGGREGATE',
          ':sk': `DAY#${day}#`,
        },
      }));
      
      const dayItems = dayResult.Items || [];
      
      // Calculate daily total
      const dailyTotal = dayItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
      dailyTotals.set(day, dailyTotal);
      
      // Add to overall totals
      totalCost += dailyTotal;
      
      // Track unique users
      dayItems.forEach(item => {
        if (item.emplId) {
          uniqueUsers.add(item.emplId);
        }
      });
    }
    
    totalUsers = uniqueUsers.size;
    
    // Get model usage breakdown
    const modelUsage = await this.getModelUsageBreakdown(yearMonth);
    
    return {
      yearMonth,
      totalCost,
      totalUsers,
      dailyTotals: Array.from(dailyTotals.entries()).map(([day, cost]) => ({ day, cost })),
      modelUsage,
    };
  }

  // HELPER METHODS
  
  private async getModelUsageBreakdown(yearMonth: string): Promise<any[]> {
    // This is a simplified approach - in production you might need to aggregate across all users
    const result = await this.ddbDocClient.send(new ScanCommand({
      TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
      FilterExpression: 'begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':sk': `USAGE#`,
      },
    }));
    
    // Group by model and sum the costs
    const modelMap = new Map<string, { totalCost: number, inputTokens: number, outputTokens: number }>();
    
    result.Items?.forEach(item => {
      if (item.SK.includes(yearMonth.replace('-', ''))) {
        const modelId = item.SK.split('#')[1];
        
        if (!modelMap.has(modelId)) {
          modelMap.set(modelId, { totalCost: 0, inputTokens: 0, outputTokens: 0 });
        }
        
        const model = modelMap.get(modelId)!;
        model.totalCost += (item.totalCost || 0);
        model.inputTokens += (item.inputTokens || 0);
        model.outputTokens += (item.outputTokens || 0);
      }
    });
    
    return Array.from(modelMap.entries()).map(([modelId, stats]) => ({
      modelId,
      ...stats,
    }));
  }

  private getDaysInMonth(yearMonth: string): string[] {
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const days: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(`${yearMonth}-${day.toString().padStart(2, '0')}`);
    }
    
    return days;
  }
}