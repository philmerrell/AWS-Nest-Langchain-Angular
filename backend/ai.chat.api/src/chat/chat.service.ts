import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from "@langchain/aws";
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/auth/strategies/entra.strategy';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class ChatService {
    private dynamoDb = new DynamoDBClient();


    constructor(private configService: ConfigService) {}

    async streamChat(chatRequestDto: ChatRequestDto, res: Response, user: User) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        if (!chatRequestDto.conversationId) {
            const conversationId = uuidv4();
            res.write(`data: ${JSON.stringify({ conversationId })}\n\n`);
            await this.createConversation(conversationId, user);
            const systemMessage = this.getSystemMessage();
            const messages = [
                systemMessage,
                chatRequestDto
            ]
        } else {
            // messages = await this.getMessages(messageDto.conversationId);
        }


        const model = this.getModel(chatRequestDto.modelId);
        // const stream = await model.stream(messages);

        // let inputTokens = 0;
        // let outputTokens = 0;

        // for await (const chunk of stream) {
        //     inputTokens += chunk.usage_metadata?.input_tokens || 0;
        //     outputTokens += chunk.usage_metadata?.output_tokens || 0;
        //     res.write(`event: delta\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
        // }
        
        // res.write(`data: ${JSON.stringify({ inputTokens, outputTokens })}\n\n`);
        res.write('data: [DONE]')
        res.end();
    }

    async handleConversation(model: string, conversation: any) {

    }

    private getModel(model: string) {
        // TODO: the attribute 'additionalModelRequestFields' for 'thinking' should be configurable
        return new ChatBedrockConverse({
            model,
            region: this.configService.get<string>('BEDROCK_AWS_REGION')
        });
    }

    private getSystemMessage() {
        return { role: 'system', content: 'Follow the user\'s instructions carefully. Respond using markdown. If you are asked to draw a diagram, you can use Mermaid diagrams using mermaid.js syntax in a ```mermaid code block. If you are asked to visualize something, you can use a ```vega code block with Vega-lite. Don\'t draw a diagram or visualize anything unless explicitly asked to do so. Be concise in your responses unless told otherwise.' };
    }


    // async getMessages(conversationId: string) {
    //     const params = {
    //         TableName: this.configService.get<string>('MESSAGES_TABLE_NAME') || '',
    //         KeyConditionExpression: 'conversationId = :conversationId',
    //         ExpressionAttributeValues: {
    //             ':conversationId': conversationId
    //         }
    //     };

    //     const result = await this.dynamoDb.query(params).promise();

    //     if (result.Items?.length === 0) {
    //         await this.createConversation(conversationId);
    //     }

    //     return result.Items;
    // }


private async createConversation(conversationId: string, user: User) {
    try {
        const tableName = this.configService.get<string>('CONVERSATIONS_TABLE_NAME');
        if (!tableName) {
            throw new Error('Table name is not defined in the configuration');
        }

        const params = {
            TableName: tableName,
            Item: {
                PK: user.email,
                SK: new Date().toISOString(),
                conversationId
            }
        };

        await this.dynamoDb.send(new PutCommand(params));
        console.log('Conversation created successfully');
    } catch (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }
}

    
}
