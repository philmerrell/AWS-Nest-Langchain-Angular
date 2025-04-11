// backend/ai.chat.api/src/chat/chat.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBedrockConverse } from "@langchain/aws";
import { Response } from 'express';
import { ChatRequestDto } from './chat-request.dto';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/auth/strategies/entra.strategy';
import { ConversationService } from 'src/conversations/conversation.service';
import { Message, MessageService } from 'src/messages/message.service';
import { CostService } from 'src/cost/cost.service';
import { McpService } from 'src/mcp/mcp.service';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z, ZodObject } from 'zod';
import { FunctionDefinition, ToolDefinition } from '@langchain/core/language_models/base';


@Injectable()
export class ChatService implements OnModuleInit {
    private activeStreams = new Map<string, { aborted: boolean }>();
    private mcpTools: any[] = [];
  
    constructor(
        private readonly configService: ConfigService,
        private readonly conversationService: ConversationService,
        private readonly costService: CostService,
        private readonly messageService: MessageService,
        private readonly mcpService: McpService
    ) {}

    onModuleInit() {
        // Clean up any stale streams on initialization
        this.activeStreams.clear();
        
        // Initialize MCP tools
        this.initMcpTools();
    }

    private async initMcpTools() {
        try {
            // Wait for MCP service to connect and initialize
            setTimeout(async () => {
                // Convert MCP tools to a format suitable for Bedrock
                const availableTools = this.mcpService.getAvailableTools();
                console.log(availableTools);
                this.mcpTools = this.convertMcpToolsToBedrockTools(availableTools);
                console.log(`Initialized ${this.mcpTools.length} MCP tools for AI chat`);
            }, 2000); // Give MCP service some time to connect
        } catch (error) {
            console.error('Failed to initialize MCP tools:', error);
        }
    }

    private convertMcpToolsToBedrockTools(mcpTools: Tool[]): ToolDefinition[] {
      return mcpTools.map(tool => {
        // If you have a JSON schema in tool.inputSchema, convert it to a Zod schema
        // This is just a minimal example – adapt it to match your actual schema
        const schema = z.object({
          location: z.string().describe("City name, US zip code, UK postcode, Canada postal code, IP address, or Latitude/Longitude"),
          units: z.enum(["metric", "imperial"]).optional().describe("Units for temperature (metric = Celsius, imperial = Fahrenheit)"),
        });
    
        return {
          name: tool.name,
          type: 'function',
          description: tool.description || `Tool for ${tool.name}`,
          // The function ChatBedrockConverse will actually call
          function: (async (args: any) => {
            try {
              // Call your MCP tool through the service
              const result = await this.mcpService.callTool(tool.name, args);
              return result;
            } catch (error) {
              console.error(`Error executing MCP tool ${tool.name}:`, error);
              return `Error executing tool ${tool.name}: ${error.message}`;
            }
          }) as unknown as FunctionDefinition,
          // Zod schema for your tool arguments:
          schema: schema
        } as ToolDefinition;
      });
    }

    async streamChat(chatRequestDto: ChatRequestDto, res: Response, user: User): Promise<void> {
        this.setupSSEHeaders(res);
        
        // Create stream context and track it
        const requestId = chatRequestDto.requestId;
        const streamContext = { aborted: false };
        this.activeStreams.set(requestId, streamContext);
        
        // Set up request abort handler
        res.on('close', () => {
          // Mark this stream as aborted when the connection is closed
          if (this.activeStreams.has(requestId)) {
            const context = this.activeStreams.get(requestId)!;
            context.aborted = true;
          }
        });
    
        const { conversationId, messages, isNewConversation } = await this.initializeConversation(chatRequestDto, user, res);
        const model = this.getModel(chatRequestDto.modelId);
    
        try {
          // Add MCP tools to the model
          if (this.mcpTools.length > 0) {
            console.log(this.mcpTools);
            model.bindTools(this.mcpTools);
          }
          
          // Process stream
          const systemResponse = await this.processChatStream(model, messages, res, user, streamContext, requestId);
          
          // Only save results if not aborted
          if (!streamContext.aborted) {
            const messagesToSave = this.getMessagesToSave(systemResponse, messages, isNewConversation);
            this.messageService.addToConversation(messagesToSave, conversationId, user.emplId);
            
            if(isNewConversation) {
              const conversationName = await this.generateConversationName(chatRequestDto.content, user);
              res.write(`event: metadata\ndata: ${JSON.stringify({ conversationId, conversationName})}\n\n`);
              await this.conversationService.updateConversationName(user.emplId, conversationId, conversationName);
            }
            
            res.write(`data: [DONE]`);
          }
          
          res.end();
        } catch (error) {
          res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`);
          res.end();
          throw error;
        } finally {
          // Clean up stream context
          this.activeStreams.delete(requestId);
        }
    }

    cancelStream(requestId: string): boolean {
        if (this.activeStreams.has(requestId)) {
          const context = this.activeStreams.get(requestId)!;
          context.aborted = true;
          return true;
        }
        return false;
    }

    private async generateConversationName(userInput: string, user: User) {
        const model = new ChatBedrockConverse({
            model: 'amazon.nova-micro-v1:0',
            region: this.configService.get<string>('BEDROCK_AWS_REGION'),
        });
        const response = await model.invoke([['system', 'Respond with only a title name and nothing else. Do not use quotes in your response.'], ['user', `Look at the following prompt: ${userInput} \n\nYour task: As an AI proficient in summarization, create a short concise title for the given prompt. Ensure the title is under 30 characters.`]]);
        const inputTokens = response.usage_metadata?.input_tokens || 0;
        const outputTokens = response.usage_metadata?.output_tokens || 0;
        await this.costService.trackUsage({
            user,
            modelId: model.model,
            inputTokens,
            outputTokens
        });
        return response.content
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
            : [
                { ...this.getSystemMessage(user) },
                ...await this.getPreviousMessages(chatRequestDto.conversationId!, user.emplId, userMessage)
            ];
        
        if (isNewConversation) {
            res.write(`event: metadata\ndata: ${JSON.stringify({ conversationId })}\n\n`);
            await this.conversationService.createConversation(conversationId, user);
        }
        
        return { conversationId, messages, isNewConversation };
    }

    private async getPreviousMessages(conversationId: string, emplId: string, userMessage: Message): Promise<Message[]> {
        const previousMessages = await this.messageService.getMessages(conversationId, emplId);
        return [...previousMessages, userMessage];
    }

    private async processChatStream(
        model: any, 
        messages: Message[], 
        res: Response, 
        user: User,
        streamContext: { aborted: boolean },
        requestId: string
    ): Promise<Message> {
        const stream = await model.stream(messages);
        let inputTokens = 0, outputTokens = 0, content = '', reasoningResponse = '';
        
        for await (const chunk of stream) {
          // Check if request has been aborted
          if (streamContext.aborted) {
            break; // Exit the loop if request was aborted
          }
    
          inputTokens += chunk.usage_metadata?.input_tokens || 0;
          outputTokens += chunk.usage_metadata?.output_tokens || 0;
          
          // Process chunk
          if (Array.isArray(chunk.content)) {
            for (const reasoningContent of chunk.content) {
              if (reasoningContent.type === 'reasoning_content') {
                reasoningResponse += reasoningContent.reasoningText.text;
                res.write(`event: reasoning\ndata: ${JSON.stringify({ reasoning: reasoningContent.reasoningText.text })}\n\n`);
              }
            }
          } else {
            content += chunk.content;
            res.write(`event: delta\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
          }
          
          // Process tool calls if present
          if (chunk.tool_calls && chunk.tool_calls.length > 0) {
          }
        }
    
        await this.costService.trackUsage({
            user,
            modelId: model.model,
            inputTokens,
            outputTokens,
        });
        
        return { 
          role: 'assistant', 
          id: requestId,
          content,
          ...(reasoningResponse && { reasoning: reasoningResponse })
        };
    }
    
    private getModel(modelId: string) {
        return new ChatBedrockConverse({
            model: modelId,
            region: this.configService.get<string>('BEDROCK_AWS_REGION')
        });
    }

    private getMessagesToSave(systemResponse: Message, messages: Message[], isNewConversation: boolean): Message[] {
        messages.push(systemResponse);
        return isNewConversation ? messages : messages.slice(-2);
    }

    private getSystemMessage(user: User): Message {
        return {
            role: 'system',
            content: `The user's name is: ${user.name}, please follow their instructions carefully. Respond using markdown. If you are asked to draw a diagram, use Mermaid syntax in a \`\`\`mermaid code block. For visualizations, use a \`\`\`vega code block with Vega-lite. Do not draw or visualize unless explicitly requested. Be concise unless instructed otherwise. 
            
You have access to the following tools for helping with weather information:
- get-current-weather: Use this tool to fetch current weather conditions for a specific location
- get-weather-forecast: Use this tool to fetch a 5-day weather forecast for a specific location

When asked about weather conditions or forecasts for a specific location, make sure to use these tools to provide accurate, up-to-date information.`
        };
    }
}