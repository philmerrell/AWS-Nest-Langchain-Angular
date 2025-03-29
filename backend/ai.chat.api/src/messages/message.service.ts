import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export interface Message {
    id?: string;
    content: string;
    createdAt?: string;
    reasoning?: string;
    role: 'system' | 'user' | 'assistant';
}

@Injectable()
export class MessageService {
    private client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    private readonly tableName: string;

    constructor(private readonly configService: ConfigService) {
        this.tableName = this.configService.get<string>('MESSAGES_TABLE_NAME')!;
    }

    async addToConversation(messages: Message[], conversationId: string, emplId: string): Promise<void> {
        const items = messages.map((message, index) => ({
            PutRequest: {
                Item: {
                    PK: `${emplId}#${conversationId}`,
                    SK: `${new Date().toISOString()}#${index}`, // Ensuring uniqueness
                    ...message,
                },
            },
        }));

        const params = {
            RequestItems: {
                [this.tableName]: items,
            },
        };

        try {
            const command = new BatchWriteCommand(params);
            await this.client.send(command);
        } catch (error) {
            throw new Error(`Failed to add messages to conversation: ${error.message}`);
        }
    }

    async getMessages(conversationId: string, emplId: string): Promise<Message[]> {
        console.log(`${emplId}#${conversationId}`)
        const params = {
            TableName: this.tableName,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": `${emplId}#${conversationId}`,
            },
        };

        try {
            const command = new QueryCommand(params);
            const result = await this.client.send(command);
            // remove system message
            if (result.Items && result.Items.length > 0) {
                result.Items.shift(); // Remove the first result
            }
            return result.Items?.map(item => ({
                id: item.SK,
                content: item.content,
                createdAt: item.SK,
                role: item.role,
                reasoning: item.reasoning
            })) || [];

            
        } catch (error) {
            throw new Error(`Failed to get messages: ${error.message}`);
        }
    }

    async deleteConversationMessages(conversationId: string, emplId: string): Promise<void> {
        const params = {
          TableName: this.tableName,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": `${emplId}#${conversationId}`,
          },
        };
      
        try {
          // First, query all messages for this conversation
          const command = new QueryCommand(params);
          const result = await this.client.send(command);
          
          if (!result.Items || result.Items.length === 0) {
            return; // No messages to delete
          }
          
          // Prepare batch delete requests
          const batchSize = 25; // DynamoDB batch operations limit
          const deleteRequests = result.Items.map(item => ({
            DeleteRequest: {
              Key: {
                PK: `${emplId}#${conversationId}`,
                SK: item.SK
              }
            }
          }));
          
          // Process in batches if needed
          for (let i = 0; i < deleteRequests.length; i += batchSize) {
            const batchToProcess = deleteRequests.slice(i, i + batchSize);
            
            const batchParams = {
              RequestItems: {
                [this.tableName]: batchToProcess
              }
            };
            
            await this.client.send(new BatchWriteCommand(batchParams));
          }
          
          console.log(`Successfully deleted ${deleteRequests.length} messages for conversation ${conversationId}`);
        } catch (error) {
          throw new Error(`Failed to delete conversation messages: ${error.message}`);
        }
      }
}
