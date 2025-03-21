import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from "@langchain/aws";
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/auth/strategies/entra.strategy';
import { ConversationService } from 'src/conversations/conversation.service';
import { Message, MessageService } from 'src/messages/message.service';
import { CostService } from 'src/cost/cost.service';

@Injectable()
export class ChatService {
    constructor(
        private readonly configService: ConfigService,
        private readonly conversationService: ConversationService,
        private readonly costService: CostService,
        private readonly messageService: MessageService,
    ) {}

    async streamChat(chatRequestDto: ChatRequestDto, res: Response, user: User): Promise<void> {
        this.setupSSEHeaders(res);

        const { conversationId, messages, isNewConversation } = await this.initializeConversation(chatRequestDto, user, res);
        const model = this.getModel(chatRequestDto.modelId);
        
        const systemResponse = await this.processChatStream(model, messages, res, user);
        const messagesToSave = this.getMessagesToSave(systemResponse, messages, isNewConversation);

        this.messageService.addToConversation(messagesToSave, conversationId, user.emplId);
        res.write(`data: [DONE]`);
        res.end();
    }

    private setupSSEHeaders(res: Response): void {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
    }

    private async initializeConversation(chatRequestDto: ChatRequestDto, user: User, res: Response) {
        const isNewConversation = !chatRequestDto.conversationId;
        const conversationId = chatRequestDto.conversationId || uuidv4();
        const userMessage: Message = { role: 'user', content: chatRequestDto.content, id: chatRequestDto.id || uuidv4(),  };
        
        let messages: Message[] = isNewConversation
            ? [{ ...this.getSystemMessage(user) }, userMessage]
            : await this.getPreviousMessages(chatRequestDto.conversationId!, user.email, userMessage);
        
        if (isNewConversation) {
            res.write(`data: ${JSON.stringify({ conversationId })}\n\n`);
            await this.conversationService.createConversation(conversationId, user);
        }
        
        return { conversationId, messages, isNewConversation };
    }

    private async getPreviousMessages(conversationId: string, userEmail: string, userMessage: Message): Promise<Message[]> {
        const previousMessages = await this.messageService.getMessages(conversationId, userEmail);
        return [...previousMessages, userMessage];
    }

    private async processChatStream(model: any, messages: Message[], res: Response, user: User): Promise<Message> {
        const stream = await model.stream(messages);
        let inputTokens = 0, outputTokens = 0, content = '';

        for await (const chunk of stream) {
            inputTokens += chunk.usage_metadata?.input_tokens || 0;
            outputTokens += chunk.usage_metadata?.output_tokens || 0;
            content += chunk.content;
            res.write(`event: delta\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ inputTokens, outputTokens })}\n\n`);
        await this.costService.trackUsage({
            user,
            modelId: model.model,
            inputTokens,
            outputTokens,
          });
        return { role: 'assistant', id: uuidv4(), content };
    }

    private getMessagesToSave(systemResponse: Message, messages: Message[], isNewConversation: boolean): Message[] {
        messages.push(systemResponse);
        return isNewConversation ? messages : messages.slice(-2);
    }

    private getModel(modelId: string) {
        return new ChatBedrockConverse({
            model: modelId,
            region: this.configService.get<string>('BEDROCK_AWS_REGION'),
        });
        
    }

    private getSystemMessage(user: User): Message {
        return {
            role: 'system',
            content: `The user's name is: ${user.email}, please follow their instructions carefully. Respond using markdown. If you are asked to draw a diagram, use Mermaid syntax in a \`\`\`mermaid code block. For visualizations, use a \`\`\`vega code block with Vega-lite. Do not draw or visualize unless explicitly requested. Be concise unless instructed otherwise.`
        };
    }
}
