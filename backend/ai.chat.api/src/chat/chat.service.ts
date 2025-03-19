import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from "@langchain/aws";
import { Response } from 'express';
import { ChatRequestDto, MessageDto } from './chat-request.dto';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
    private dynamoDb = new DynamoDB.DocumentClient();

    constructor(private configService: ConfigService) {}

    async streamChat(messageDto: MessageDto, res: Response) {
        // res.setHeader('Content-Type', 'text/event-stream');
        // res.setHeader('Cache-Control', 'no-cache');
        // res.setHeader('Connection', 'keep-alive');

        // // get messages by conversationId
        // if (!messageDto.conversationId) {
        //     const conversationId = uuidv4();
        //     const systemMessage = this.getSystemMessage();
        //     const messages = [
        //         systemMessage,
        //         messageDto
        //     ]
        // } else {
        //     messages = await this.getMessages(messageDto.conversationId);
        // }


        // const model = this.getModel(chatRequestDto.model);
        // const stream = await model.stream(messages);

        // let inputTokens = 0;
        // let outputTokens = 0;

        // for await (const chunk of stream) {
        //     inputTokens += chunk.usage_metadata?.input_tokens || 0;
        //     outputTokens += chunk.usage_metadata?.output_tokens || 0;
        //     res.write(`event: delta\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
        // }
        
        // res.write(`data: ${JSON.stringify({ inputTokens, outputTokens })}\n\n`);
        // res.write('data: [DONE]')
        // res.end();
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

    // private async createConversation(conversationId: string) {
    //     const params = {
    //         TableName: this.configService.get<string>('CONVERSATIONS_TABLE_NAME'),
    //         Item: {
    //             conversationId,
    //             createdAt: new Date().toISOString()
    //         }
    //     };

    //     await this.dynamoDb.put(params).promise();
    // }

    
}
