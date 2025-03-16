import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from "@langchain/aws";
import { Response } from 'express';

@Injectable()
export class ChatService {

    constructor(private configService: ConfigService) {}

    async streamChat(message: string, res: Response) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const model = this.getModel();
        const stream = await model.stream([
            { role: 'system', content: 'You are a helpful assistant that understands both French and English. Please answer any questions to the best of your ability.' },
            { role: 'user', content: 'Does saying, "ChatGPT" in French sound similar to "Cat I Farted" in French?' },
        ]);

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify(chunk.content)}\n\n`);
        }
        res.end();
    }

    async handleConversation(model: string, conversation: any) {

    }

    private getModel() {
        return new ChatBedrockConverse({
            model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
            region: this.configService.get<string>('BEDROCK_AWS_REGION'),
        });
    }

    
}
