// src/models/model.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PutCommand,
  ScanCommand,
  GetCommand,
  TransactWriteCommand,
  QueryCommand,
  UpdateCommand
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

  async createOrUpdateModelWithPricing(dto: ModelWithPricingDto) {
    const now = new Date().toISOString();
    const dateKey = now.split('T')[0].replace(/-/g, ''); // Format: YYYYMMDD
  
    // If this model is being set as default, clear any existing default first
    if (dto.isDefault) {
      await this.clearDefaultModel();
    }
  
    // Prepare model item with allowed roles
    const modelItem = {
      modelId: dto.modelId,
      name: dto.name,
      description: dto.description,
      allowedRoles: dto.allowedRoles || [],
      inputPricePerMillionTokens: dto.inputPricePerMillionTokens,
      outputPricePerMillionTokens: dto.outputPricePerMillionTokens,
      enabled: dto.enabled,
      isDefault: dto.isDefault,
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

  async getModelWithPricing(modelId: string) {
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

  async getModelsWithPricing(userRoles: string[] = []) {
    // If no roles provided or empty array, use a scan operation
    if (!userRoles || userRoles.length === 0) {
      const modelsResult = await this.docClient.send(
        new ScanCommand({
          TableName: this.modelsTableName,
          FilterExpression: 'enabled = :enabled',
          ExpressionAttributeValues: {
            ':enabled': true,
          },
        }),
      );
      
      // Rest of your existing code for processing models...
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
  
    // Otherwise, for role-based filtering, we'll first get all models
    const allModelsResult = await this.docClient.send(
      new ScanCommand({
        TableName: this.modelsTableName,
        FilterExpression: 'enabled = :enabled',
        ExpressionAttributeValues: {
          ':enabled': true,
        },
      }),
    );
  
    // Filter models by user roles
    const models = (allModelsResult.Items || []).filter(model => {
      // If model has no allowedRoles, it's accessible to everyone
      if (!model.allowedRoles || model.allowedRoles.length === 0) {
        return true;
      }
      
      // Check if any of the user's roles match the model's allowed roles
      return userRoles.some(role => model.allowedRoles.includes(role));
    });
    
    // Get pricing for each model (same as before)
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

  async getDefaultModel() {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.modelsTableName,
        FilterExpression: 'isDefault = :isDefault AND enabled = :enabled',
        ExpressionAttributeValues: {
          ':isDefault': true,
          ':enabled': true,
        },
      }),
    );

    if (!result.Items || result.Items.length === 0) {
      // No default model found, return the first enabled model
      const fallbackResult = await this.docClient.send(
        new ScanCommand({
          TableName: this.modelsTableName,
          FilterExpression: 'enabled = :enabled',
          ExpressionAttributeValues: {
            ':enabled': true,
          },
          Limit: 1,
        }),
      );
      
      return fallbackResult.Items?.[0] || null;
    }

    // Get pricing for the default model
    const model = result.Items[0];
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
  }

  async setDefaultModel(modelId: string) {
    // First, validate the model exists
    const model = await this.getModelWithPricing(modelId);
    if (!model) {
      throw new Error(`Model with ID ${modelId} not found`);
    }

    // Clear any existing default model
    await this.clearDefaultModel();

    // Set this model as default
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.modelsTableName,
        Key: { PK: modelId },
        UpdateExpression: 'SET isDefault = :isDefault',
        ExpressionAttributeValues: {
          ':isDefault': true,
        },
      }),
    );

    return { success: true, modelId };
  }

  private async clearDefaultModel() {
    // Find current default model
    const defaultModelResult = await this.docClient.send(
      new ScanCommand({
        TableName: this.modelsTableName,
        FilterExpression: 'isDefault = :isDefault',
        ExpressionAttributeValues: {
          ':isDefault': true,
        },
      }),
    );

    // If a default model exists, clear its default status
    if (defaultModelResult.Items && defaultModelResult.Items.length > 0) {
      for (const model of defaultModelResult.Items) {
        await this.docClient.send(
          new UpdateCommand({
            TableName: this.modelsTableName,
            Key: { PK: model.PK },
            UpdateExpression: 'SET isDefault = :isDefault',
            ExpressionAttributeValues: {
              ':isDefault': false,
            },
          }),
        );
      }
    }
  }
}