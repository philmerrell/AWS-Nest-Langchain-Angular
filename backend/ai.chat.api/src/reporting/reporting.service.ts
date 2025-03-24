import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class ReportingService {
  private readonly ddbClient: DynamoDBClient;
  private readonly ddbDocClient: DynamoDBDocumentClient;

  constructor(private readonly configService: ConfigService) {
    this.ddbClient = new DynamoDBClient({});
    this.ddbDocClient = DynamoDBDocumentClient.from(this.ddbClient);
  }

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

async getAllUserDailyCosts(date: string, limit = 10, lastKey?: Record<string, any>) {
    const result = await this.ddbDocClient.send(new QueryCommand({
        TableName: this.configService.get('ADMIN_AGGREGATES_TABLE_NAME'),
        KeyConditionExpression: 'PK = :pk and begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': 'AGGREGATE',
            ':sk': `DAY#${date}#`,
        },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: lastKey,
    }));

    return {
        items: result.Items ?? [],
        lastKey: result.LastEvaluatedKey,
    };
}

async getTopUsersByCost(date: string, limit = 10, lastKey?: Record<string, any>) {
    const result = await this.ddbDocClient.send(new QueryCommand({
        TableName: this.configService.get('ADMIN_AGGREGATES_TABLE_NAME'),
        KeyConditionExpression: 'PK = :pk and begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': 'AGGREGATE',
            ':sk': `DAY#${date}#`,
        },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: lastKey,
    }));

    return {
        items: result.Items ?? [],
        lastKey: result.LastEvaluatedKey,
    };
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
}
