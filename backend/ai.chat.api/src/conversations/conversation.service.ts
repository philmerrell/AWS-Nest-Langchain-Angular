import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { User } from 'src/auth/strategies/entra.strategy';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { MessageContent } from '@langchain/core/messages';

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
          conversationKey: `${user.emplId}#${conversationId}`,
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
      ScanIndexForward: false,
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
          name: conversation.name
        })) : [],
        lastEvaluatedKey: result.LastEvaluatedKey || null,
      };
    } catch (error) {
      throw new Error(`Error fetching conversations: ${error.message}`);
    }
  }


  // TODO: Do I need to check emplid here to make sure user can get this conversation
  async getConversationById(emplId: string, conversationId: string): Promise<any> {
    const conversationKey = `${emplId}#${conversationId}`;
    const params = {
      TableName: this.configService.get('CONVERSATIONS_TABLE_NAME'),
      IndexName: 'ConversationByIdIndex',
      KeyConditionExpression: 'conversationKey = :conversationKey',
      ExpressionAttributeValues: {
      ':conversationKey': conversationKey,
      },
    };

    try {
      const result = await this.client.send(new QueryCommand(params));
      if (result.Items) {
        result.Items = result.Items.map(item => ({
          createdAt: item.SK,
          conversationId: item.conversationId,
          name: item.name
        }));
      }
      if (result.Items && result.Items.length > 0) {
        return result.Items[0];
      } else {
        throw new Error('Conversation not found');
      }
    } catch (error) {
      throw new Error(`Error fetching conversation by ID: ${error.message}`);
    }
  }

  async updateConversationName(emplId: string, conversationId: string, newName: MessageContent): Promise<void> {
    try {
      const tableName = this.configService.get<string>('CONVERSATIONS_TABLE_NAME');
      if (!tableName) {
        throw new Error('Table name is not defined in the configuration');
      }

      // Fetch the conversation to ensure it exists and belongs to the user
      const conversation = await this.getConversationById(emplId, conversationId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const params = {
        TableName: tableName,
        Key: {
          PK: emplId,
          SK: conversation.createdAt,
        },
        UpdateExpression: 'SET #name = :newName',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':newName': newName,
        },
      };

      await this.client.send(new UpdateCommand(params));
      console.log('Conversation name updated successfully');
    } catch (error) {
      console.error('Error updating conversation name:', error);
      throw error;
    }
  }

}