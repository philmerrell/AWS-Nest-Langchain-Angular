import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export interface Message {
    id?: string;
    content: string;
    createdAt?: string;
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
            return result.Items?.map(item => ({
                id: item.SK,
                content: item.content,
                createdAt: item.SK,
                role: item.role,
            })) || [];

            
        } catch (error) {
            throw new Error(`Failed to get messages: ${error.message}`);
        }
    }
}
