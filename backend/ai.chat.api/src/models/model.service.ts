// src/models/model.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PutCommand,
  ScanCommand,
  GetCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ModelWithPricingDto } from './model.dto';

@Injectable()
export class ModelService {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly modelsTableName: string;
  private readonly pricingTableName: string;

  constructor(private readonly configService: ConfigService) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.modelsTableName = this.configService.get('MODELS_TABLE_NAME') || '';
    this.pricingTableName = this.configService.get('MODEL_PRICING_TABLE_NAME') || '';
  }

  

  async createOrUpdateModel(dto: ModelWithPricingDto) {
    const now = new Date().toISOString();
    const dateKey = now.split('T')[0].replace(/-/g, ''); // Format: YYYYMMDD

    // Prepare model item
    const modelItem = {
      modelId: dto.modelId,
      name: dto.name,
      description: dto.description,
      inputPricePerMillionTokens: dto.inputPricePerMillionTokens,
      outputPricePerMillionTokens: dto.outputPricePerMillionTokens,
      enabled: dto.enabled,
      sortOrder: dto.sortOrder,
      createdAt: dto.createdAt ?? now,
      updatedAt: now,
    };

    // Prepare pricing item
    const pricingItem = {
      inputPricePerMillionTokens: dto.inputPricePerMillionTokens,
      outputPricePerMillionTokens: dto.outputPricePerMillionTokens,
      effectiveDate: dto.effectiveDate || now,
    };

    // Use TransactWrite to update both tables atomically
    await this.docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            // Update model table
            Put: {
              TableName: this.modelsTableName,
              Item: {
                PK: dto.modelId,
                ...modelItem,
              },
            },
          },
          {
            // Add current pricing
            Put: {
              TableName: this.pricingTableName,
              Item: {
                PK: `MODEL#${dto.modelId}`,
                SK: `PRICE#${dateKey}`,
                ...pricingItem,
              },
            },
          },
          {
            // Update latest pricing reference
            Put: {
              TableName: this.pricingTableName,
              Item: {
                PK: `MODEL#${dto.modelId}`,
                SK: 'PRICE',
                ...pricingItem,
              },
            },
          },
        ],
      }),
    );

    return {
      ...modelItem,
      ...pricingItem,
    };
  }

  async getModel(modelId: string) {
    // Get model details
    const modelResult = await this.docClient.send(
      new GetCommand({
        TableName: this.modelsTableName,
        Key: { PK: modelId },
      }),
    );

    if (!modelResult.Item) {
      return null;
    }

    // Get latest pricing
    const pricingResult = await this.docClient.send(
      new GetCommand({
        TableName: this.pricingTableName,
        Key: { PK: `MODEL#${modelId}`, SK: 'PRICE' },
      }),
    );

    // Combine and return
    return {
      ...modelResult.Item,
      ...(pricingResult.Item || {}),
    };
  }

  async getModels() {
    const modelsResult = await this.docClient.send(
      new ScanCommand({
        TableName: this.modelsTableName,
        FilterExpression: 'enabled = :enabled',
        ExpressionAttributeValues: {
          ':enabled': true,
        },
      }),
    );

    const models = modelsResult.Items || [];
    
    // Get pricing for each model
    const modelsWithPricing = await Promise.all(
      models.map(async (model) => {
        const pricingResult = await this.docClient.send(
          new GetCommand({
            TableName: this.pricingTableName,
            Key: { PK: `MODEL#${model.PK}`, SK: 'PRICE' },
          }),
        );
        
        return {
          ...model,
          ...(pricingResult.Item || {}),
        };
      }),
    );

    return modelsWithPricing.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}