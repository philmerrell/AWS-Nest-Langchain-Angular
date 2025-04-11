import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// ToolResultContentBlock types
export interface ToolResultTextContent {
  text: string;
}

export interface ToolResultJsonContent {
  json: any;
}

// Union type for tool result content blocks
export type ToolResultContentBlock = 
  | ToolResultTextContent
  | ToolResultJsonContent;
  // We could add the other types (image, document, video) as needed

// The ToolResultBlock structure matching Bedrock's API
export interface ToolResultBlock {
  toolUseId: string;  // required
  content: ToolResultContentBlock[];  // required
  status: "success" | "error";
}


// The complete ContentBlock union type
export type ContentBlock = 
  | TextContentBlock
  | ToolUseContentBlock
  | { toolResult: ToolResultBlock }
  // Other content block types as needed
// Define the content block types
export interface TextContentBlock {
  text: string;
}

export interface ToolUseContentBlock {
  toolUse: {
    toolUseId: string;
    name: string;
    input: any;
  };
}


// Updated Message interface
export interface Message {
  id?: string;
  content: ContentBlock[];
  createdAt?: string;
  reasoning?: string;
  role: 'user' | 'assistant';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
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
          createdAt: message.createdAt || new Date().toISOString(),
      };
  
      // Process content blocks
      if (message.content) {
          // Ensure the content array is properly formatted
          // Tool results should be content blocks within this array
          if (Array.isArray(message.content)) {
              // Content is already an array of content blocks
              // We just need to convert it to a string for storage
              preparedMessage.content = JSON.stringify(message.content);
          } else if (typeof message.content === 'string') {
              // Legacy format - single string content
              preparedMessage.content = JSON.stringify([{ text: message.content }]);
          } else {
              // Unknown format, store as empty array
              preparedMessage.content = JSON.stringify([]);
          }
      }
      
      // Add optional fields
      if (message.reasoning) {
          preparedMessage.reasoning = message.reasoning;
      }
      
      if (message.usage) {
          preparedMessage.usage = JSON.stringify(message.usage);
      }
      
      return preparedMessage;
  }

    /**
 * Convert a DynamoDB item back to a Message object
 */
    private convertDynamoItemToMessage(item: Record<string, any>): Message {
      // Create the message object with required properties
      const message: Message = {
          id: item.id || item.SK,
          role: item.role,
          createdAt: item.createdAt || item.SK,
          content: [], // Initialize with empty array
      };
      
      // Parse content field
      if (item.content) {
          try {
              // Try to parse as JSON array of content blocks
              message.content = JSON.parse(item.content);
              
              // Validate content structure
              if (!Array.isArray(message.content)) {
                  // If it's not an array, convert to array with single text block
                  message.content = [{ text: String(message.content) }];
              }
          } catch (error) {
              // If parsing fails, it might be a legacy string format
              message.content = [{ text: item.content }];
              console.error('Failed to parse content JSON, converting to text block:', error);
          }
      }
      
      // Add reasoning if present
      if (item.reasoning) {
          message.reasoning = item.reasoning;
      }
      
      // Parse usage if present
      if (item.usage) {
          try {
              message.usage = JSON.parse(item.usage);
          } catch (error) {
              console.error('Failed to parse usage JSON', error);
          }
      }
      
      return message;
  }
}