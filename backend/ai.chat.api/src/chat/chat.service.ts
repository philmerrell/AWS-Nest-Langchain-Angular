import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from "@langchain/aws";
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';

@Injectable()
export class ChatService {

    constructor(private configService: ConfigService) {}

    async streamChat(chatRequestDto: ChatRequestDto, res: Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const model = this.getModel(chatRequestDto.model);
        const stream = await model.stream(chatRequestDto.messages);

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify(chunk.content)}\n\n`);
        }
        res.end();
    }

    async handleConversation(model: string, conversation: any) {

    }

    private getModel(model: string) {
        return new ChatBedrockConverse({
            model,
            region: this.configService.get<string>('BEDROCK_AWS_REGION'),
        });
    }

    
}
