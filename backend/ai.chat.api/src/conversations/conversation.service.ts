import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './conversation.dto';
import { DynamoDB } from 'aws-sdk';

@Injectable()
export class ConversationService {
  private db = new DynamoDB.DocumentClient();
  private tableName = 'Conversations';

  async createConversation(dto: CreateConversationDto) {
    const timestamp = new Date().toISOString();
    
    const params = {
      TableName: this.tableName,
      Item: {
        userId: dto.userId,
        conversationId: dto.conversationId,
        title: dto.title,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };

    await this.db.put(params).promise();
    return { ...params.Item };
  }

  async getUserConversations(userId: string) {
    const params = {
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    };

    const result = await this.db.query(params).promise();
    return result.Items || [];
  }

  async deleteConversation(userId: string, conversationId: string) {
    const params = {
      TableName: this.tableName,
      Key: { userId, conversationId },
    };

    await this.db.delete(params).promise();
    return { message: 'Conversation deleted' };
  }
}