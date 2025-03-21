// cost.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ModelPricingService } from './model-pricing.service'; // adjust path as needed

interface TrackUsageInput {
  emplId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
}

@Injectable()
export class CostService {
  private readonly ddbClient: DynamoDBClient;
  private readonly ddbDocClient: DynamoDBDocumentClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly modelPricingService: ModelPricingService,
  ) {
    this.ddbClient = new DynamoDBClient({});
    this.ddbDocClient = DynamoDBDocumentClient.from(this.ddbClient);
  }

  async trackUsage({
    emplId,
    modelId,
    inputTokens,
    outputTokens,
  }: TrackUsageInput): Promise<void> {
    const now = new Date();
    const usageDate = now;
    const date = usageDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const yearMonth = usageDate.toISOString().slice(0, 7); // YYYY-MM
    const year = usageDate.getFullYear().toString();

    // 🔄 Get pricing from helper service
    const {
      inputPricePerMillionTokens,
      outputPricePerMillionTokens,
    } = await this.modelPricingService.getEffectivePricing(modelId, usageDate);

    // 💰 Calculate cost
    const inputCost =
      (inputTokens / 1_000_000) * inputPricePerMillionTokens;
    const outputCost =
      (outputTokens / 1_000_000) * outputPricePerMillionTokens;
    const totalCost = inputCost + outputCost;

    // 🔐 Atomic usage + aggregate update
    const transactParams = {
      TransactItems: [
        {
          Update: {
            TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
            Key: {
              PK: `USER#${emplId}`,
              SK: `USAGE#${modelId}#${date}`,
            },
            UpdateExpression:
              'ADD inputTokens :in, outputTokens :out, totalCost :cost',
            ExpressionAttributeValues: {
              ':in': inputTokens,
              ':out': outputTokens,
              ':cost': totalCost,
            },
          },
        },
        {
          Update: {
            TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
            Key: {
              PK: `USER#${emplId}`,
              SK: `AGG#MONTH#${yearMonth}`,
            },
            UpdateExpression: 'ADD totalCost :cost',
            ExpressionAttributeValues: { ':cost': totalCost },
          },
        },
        {
          Update: {
            TableName: this.configService.get('USER_USAGE_TABLE_NAME'),
            Key: {
              PK: `USER#${emplId}`,
              SK: `AGG#YEAR#${year}`,
            },
            UpdateExpression: 'ADD totalCost :cost',
            ExpressionAttributeValues: { ':cost': totalCost },
          },
        },
        {
          Put: {
            TableName: this.configService.get('ADMIN_AGGREGATES_TABLE_NAME'),
            Item: {
              PK: 'AGGREGATE',
              SK: `DAY#${date}#${totalCost.toFixed(6).padStart(12, '0')}`,
              emplId,
              totalCost,
            },
          },
        },
      ],
    };

    await this.ddbDocClient.send(new TransactWriteCommand(transactParams));
  }
}
