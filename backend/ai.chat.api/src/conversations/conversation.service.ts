import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { User } from 'src/auth/strategies/entra.strategy';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConversationService {
  private client = new DynamoDBClient({});

  constructor(private configService: ConfigService) { }

  async createConversation(conversationId: string, user: User) {
    try {
      const tableName = this.configService.get<string>('CONVERSATIONS_TABLE_NAME');
      if (!tableName) {
        throw new Error('Table name is not defined in the configuration');
      }

      const params = {
        TableName: tableName,
        Item: {
          PK: user.emplId,
          SK: new Date().toISOString(),
          conversationId
        }
      };

      await this.client.send(new PutCommand(params));
      console.log('Conversation created successfully');
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }


  async getConversations(emplId: string, lastEvaluatedKey?: Record<string, any>): Promise<any> {
    const params: any = {
      TableName: this.configService.get('CONVERSATIONS_TABLE_NAME'),
      KeyConditionExpression: 'PK = :emplId',
      ExpressionAttributeValues: {
        ':emplId': emplId,
      },
      Limit: 10, // Set the page size
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    try {
      const result = await this.client.send(new QueryCommand(params));
      return {
        items: result.Items ? result.Items.map(conversation => ({
          createdAt: conversation.SK,
          conversationId: conversation.conversationId,
        })) : [],
        lastEvaluatedKey: result.LastEvaluatedKey || null,
      };
    } catch (error) {
      throw new Error(`Error fetching conversations: ${error.message}`);
    }
  }

}