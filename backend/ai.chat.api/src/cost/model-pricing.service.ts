import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class ModelPricingService {
  private readonly dynamo: DynamoDBDocumentClient;
  private readonly tableName: string;
  private readonly logger = new Logger(ModelPricingService.name);

  constructor(private readonly configService: ConfigService) {
    const client = new DynamoDBClient({});
    this.dynamo = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.get<string>('MODEL_PRICING_TABLE_NAME') || '';
  }

  async getLatestPricing(modelId: string) {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { PK: `model#${modelId}`, SK: 'PRICE' },
    });

    const { Item } = await this.dynamo.send(command);

    if (!Item) {
      throw new Error(`No latest pricing found for model ${modelId}`);
    }

    return {
      inputPricePerMillionTokens: Item.inputPricePerMillionTokens ?? 0,
      outputPricePerMillionTokens: Item.outputPricePerMillionTokens ?? 0,
      effectiveDate: Item.effectiveDate,
    };
  }

  async getEffectivePricing(modelId: string, usageDate: Date) {
    const dateKey = usageDate.toISOString().split('T')[0].replace(/-/g, ''); // e.g., 20250320

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk and SK <= :sk',
      ExpressionAttributeValues: {
        ':pk': `MODEL#${modelId}`,
        ':sk': `PRICE#${dateKey}`,
      },
      ScanIndexForward: false, // Newest first
      Limit: 1,
    });

    const { Items } = await this.dynamo.send(command);
    const price = Items?.[0];

    if (!price) {
      this.logger.warn(`No historical pricing found for model ${modelId} on or before ${dateKey}`);
      throw new Error(`No pricing found for model ${modelId} as of ${dateKey}`);
    }

    return {
      inputPricePerMillionTokens: price.inputPricePerMillionTokens ?? 0,
      outputPricePerMillionTokens: price.outputPricePerMillionTokens ?? 0,
      effectiveDate: price.effectiveDate,
    };
  }
}
