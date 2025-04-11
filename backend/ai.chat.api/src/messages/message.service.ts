import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Define the content block types
interface TextContentBlock {
  text: string;
}

interface ToolUseContentBlock {
  toolUse: {
    toolUseId: string;
    name: string;
    input: any;
  };
}

// Union type for all content block types
type ContentBlock = TextContentBlock | ToolUseContentBlock;

// Tool result tracking
interface ToolResult {
  toolUseId: string;
  name: string;
  input: any;
  result: string;
  status: 'success' | 'error';
}

// Updated Message interface
export interface Message {
  id?: string;
  // Content can be either a string (for backward compatibility) or an array of content blocks
  content: string | ContentBlock[];
  createdAt?: string;
  reasoning?: string;
  role: 'system' | 'user' | 'assistant';
  // Token usage tracking
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  // Tool results
  toolResults?: ToolResult[];
}

@Injectable()
export class MessageService {
    private client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    private readonly tableName: string;

    constructor(private readonly configService: ConfigService) {
        this.tableName = this.configService.get<string>('MESSAGES_TABLE_NAME')!;
    }

    async addToConversation(messages: Message[], conversationId: string, emplId: string): Promise<void> {
        // Map messages to DynamoDB items
        const items = messages.map((message, index) => {
            // Prepare the message for storage
            const preparedMessage = this.prepareMessageForStorage(message);
            
            return {
                PutRequest: {
                    Item: {
                        PK: `${emplId}#${conversationId}`,
                        SK: `${new Date().toISOString()}#${index}`, // Ensuring uniqueness
                        ...preparedMessage,
                    },
                },
            };
        });

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
            
            
            // Convert DynamoDB items back to Message objects
            return result.Items?.map(item => this.convertDynamoItemToMessage(item)) || [];
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

    /**
     * Prepare a message for storage in DynamoDB by converting complex objects to strings
     */
    private prepareMessageForStorage(message: Message): Record<string, any> {
        const preparedMessage: Record<string, any> = {
            id: message.id,
            role: message.role,
            content: JSON.stringify(message.content),
            createdAt: message.createdAt || new Date().toISOString(),
        };
               
        // Add optional fields
        if (message.reasoning) {
            preparedMessage.reasoning = message.reasoning;
        }
        
        if (message.usage) {
            preparedMessage.usage = JSON.stringify(message.usage);
        }
        
        if (message.toolResults && message.toolResults.length > 0) {
            preparedMessage.toolResults = JSON.stringify(message.toolResults);
        }
        
        return preparedMessage;
    }

    /**
     * Convert a DynamoDB item back to a Message object
     */
    private convertDynamoItemToMessage(item: Record<string, any>): Message {
      console.log(item.content);
      // Create the message object with all required properties
      const message: Message = {
          id: item.id || item.SK,
          content: JSON.parse(item.content),
          role: item.role,
          createdAt: item.createdAt || item.SK,
          reasoning: item.reasoning,
      };
      
      // Parse optional fields
      if (item.usage) {
          try {
              message.usage = JSON.parse(item.usage);
          } catch (error) {
              console.error('Failed to parse usage JSON', error);
          }
      }
      
      if (item.toolResults) {
          try {
              message.toolResults = JSON.parse(item.toolResults);
          } catch (error) {
              console.error('Failed to parse toolResults JSON', error);
          }
      }
      
      return message;
  }
}