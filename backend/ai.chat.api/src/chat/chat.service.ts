import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from "@langchain/aws";
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/auth/strategies/entra.strategy';
import { ConversationService } from 'src/conversations/conversation.service';
import { Message, MessageService } from 'src/messages/message.service';

@Injectable()
export class ChatService {

    constructor(
        private configService: ConfigService,
        private conversationService: ConversationService,
        private messageService: MessageService) {}

    async streamChat(chatRequestDto: ChatRequestDto, res: Response, user: User) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const isNewConversation = !chatRequestDto.conversationId;
        const userMessage: Message = { role: 'user', content: chatRequestDto.content };
        let messages: Message[] = [];
        let conversationId = chatRequestDto.conversationId || uuidv4();
        if (chatRequestDto.conversationId) {
            const previousMessages = await this.messageService.getMessages(chatRequestDto.conversationId, user.email);
            messages = [
                ...previousMessages,
                userMessage
            ];
        } else {
            res.write(`data: ${JSON.stringify({ conversationId })}\n\n`);
            await this.conversationService.createConversation(conversationId, user);
            const systemMessage = this.getSystemMessage(user);
            messages = [
                { ...systemMessage },
                userMessage
            ];
        }

        const model = this.getModel(chatRequestDto.modelId);
        const formattedMessages = messages.map(message => ({
            ...message,
            type: message.role === 'user' ? 'user' : 'assistant'
        }));
        const stream = await model.stream(formattedMessages);

        let inputTokens = 0;
        let outputTokens = 0;

        let content = '';

        for await (const chunk of stream) {
            inputTokens += chunk.usage_metadata?.input_tokens || 0;
            outputTokens += chunk.usage_metadata?.output_tokens || 0;
            content += chunk.content;
            res.write(`event: delta\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
        }

        const systemMessage: Message = { role: 'system', content};
        messages = [
            ...messages,
            systemMessage
        ];
        
        const messagesToAdd: Message[] = isNewConversation ? messages : [userMessage, systemMessage];

        this.messageService.addToConversation(messagesToAdd, conversationId, user.email);
        res.write(`data: ${JSON.stringify({ inputTokens, outputTokens })}\n\n`);
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

    private getSystemMessage(user: User): { role: 'system'; content: string } {
        return { role: 'system', content: `The user's name is: ${user.email}, please follow their instructions carefully. Respond using markdown. If you are asked to draw a diagram, you can use Mermaid diagrams using mermaid.js syntax in a \`\`\`mermaid code block. If you are asked to visualize something, you can use a \`\`\`vega code block with Vega-lite. Don't draw a diagram or visualize anything unless explicitly asked to do so. Be concise in your responses unless told otherwise.` };
    }

    
}
