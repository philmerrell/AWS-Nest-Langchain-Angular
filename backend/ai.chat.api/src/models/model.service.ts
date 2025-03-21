import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ModelCreateDto } from './model.dto';

@Injectable()
export class ModelService {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.get('MODELS_TABLE_NAME') || '';
  }

  async createModel(dto: ModelCreateDto) {
    const now = new Date().toISOString();

    const item = {
      ...dto,
      createdAt: dto.createdAt ?? now,
      updatedAt: dto.updatedAt ?? now,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: dto.modelId,
          ...item,
        },
      }),
    );

    return item;
  }

  async getModels() {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'enabled = :enabled',
        ExpressionAttributeValues: {
          ':enabled': true,
        },
      }),
    );

    return (result.Items ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
