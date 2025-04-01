import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { User } from 'src/auth/strategies/entra.strategy';
import { DeleteCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

  async deleteConversation(emplId: string, conversationId: string): Promise<void> {
    try {
      // First, find the conversation to ensure it exists and belongs to the user
      const conversation = await this.getConversationById(emplId, conversationId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }
  
      // Delete the conversation record
      const deleteParams = {
        TableName: this.configService.get<string>('CONVERSATIONS_TABLE_NAME'),
        Key: {
          PK: emplId,
          SK: conversation.createdAt,
        },
      };
  
      await this.client.send(new DeleteCommand(deleteParams));
      console.log('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }


  async getConversations(emplId: string, lastEvaluatedKey?: Record<string, any>): Promise<any> {
    try {
      // Get starred conversations using the GSI
      const starredParams = {
        TableName: this.configService.get('CONVERSATIONS_TABLE_NAME'),
        IndexName: 'StarredConversationsIndex',
        KeyConditionExpression: 'PK = :emplId AND isStarred = :isStarred',
        ExpressionAttributeValues: {
          ':emplId': emplId,
          ':isStarred': 1,
        },
        // Sort by the SK in the main table, which is still available in the GSI projection
        ScanIndexForward: false, // Get newest starred conversations first
      };
  
      // Get recent conversations (standard query on main table)
      const recentParams: any = {
        TableName: this.configService.get('CONVERSATIONS_TABLE_NAME'),
        KeyConditionExpression: 'PK = :emplId',
        ExpressionAttributeValues: {
          ':emplId': emplId,
        },
        ScanIndexForward: false, // Newest first
        Limit: 20, // Limit to 20 recent conversations
      };
  
      if (lastEvaluatedKey) {
        recentParams.ExclusiveStartKey = lastEvaluatedKey;
      }
  
      // Execute both queries in parallel for efficiency
      const [starredResult, recentResult] = await Promise.all([
        this.client.send(new QueryCommand(starredParams)),
        this.client.send(new QueryCommand(recentParams))
      ]);
  
      const starredItems = starredResult.Items || [];
      const recentItems = recentResult.Items || [];
      
      // Combine the results, removing duplicates (conversations that are both starred and recent)
      const starredIds = new Set(starredItems.map(item => item.conversationId));
      const nonDuplicateRecentItems = recentItems.filter(item => 
        !starredIds.has(item.conversationId)
      );
      
      // Format and return the combined results
      return {
        items: [
          ...starredItems.map(conversation => ({
            createdAt: conversation.SK,
            conversationId: conversation.conversationId,
            name: conversation.name,
            isStarred: true
          })),
          ...nonDuplicateRecentItems.map(conversation => ({
            createdAt: conversation.SK,
            conversationId: conversation.conversationId,
            name: conversation.name,
            isStarred: conversation.isStarred === 1
          }))
        ],
        lastEvaluatedKey: recentResult.LastEvaluatedKey || null,
      };
    } catch (error) {
      throw new Error(`Error fetching conversations: ${error.message}`);
    }
  }

  async getConversationById(emplId: string, conversationId: string): Promise<any> {
    const conversationKey = `${emplId}#${conversationId}`;
    console.log(conversationKey);
    const params = {
      TableName: this.configService.get('CONVERSATIONS_TABLE_NAME'),
      IndexName: 'ConversationByKeyIndex',
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

  async toggleStar(emplId: string, conversationId: string, isStarred: boolean): Promise<void> {
    try {
      // First, find the conversation to ensure it exists and belongs to the user
      const conversation = await this.getConversationById(emplId, conversationId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }
  
      // Update the conversation's star status
      // Use 1 for starred, 0 for non-starred for better DynamoDB GSI compatibility
      const updateParams = {
        TableName: this.configService.get<string>('CONVERSATIONS_TABLE_NAME'),
        Key: {
          PK: emplId,
          SK: conversation.createdAt,
        },
        UpdateExpression: 'SET isStarred = :isStarred',
        ExpressionAttributeValues: {
          ':isStarred': isStarred ? 1 : 0,
        },
      };
  
      await this.client.send(new UpdateCommand(updateParams));
      console.log(`Conversation star status updated successfully to ${isStarred}`);
    } catch (error) {
      console.error('Error updating conversation star status:', error);
      throw error;
    }
  }

}