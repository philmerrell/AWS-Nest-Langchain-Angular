import { Injectable, OnModuleInit } from "@nestjs/common";
import { ChatRequestDto } from "./chat-request.dto";
import { User } from "src/auth/strategies/entra.strategy";
import { Response } from "express";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  Message as BedrockMessage
} from "@aws-sdk/client-bedrock-runtime";
import { ConfigService } from "@nestjs/config";
import { CostService } from "src/cost/cost.service";
import { McpService } from "src/mcp/mcp.service";
import { Tool } from "@modelcontextprotocol/sdk/types";
import { v4 as uuidv4 } from 'uuid';
import { ConversationService } from "src/conversations/conversation.service";
import { MessageService } from "src/messages/message.service";

// Define content block types for Bedrock API
interface BedrockTextContent {
  text: string;
}

interface BedrockToolUseContent {
  toolUse: {
    toolUseId: string;
    name: string;
    input: any;
  };
}

interface BedrockToolResultContent {
  toolResult: {
    toolUseId: string;
    content: Array<{ text: string }>;
    status: 'success' | 'error';
  };
}

// Union type for all possible Bedrock content blocks
type BedrockContentBlock = BedrockTextContent | BedrockToolUseContent | BedrockToolResultContent;

// Define content block types for our database
interface TextContent {
  text: string;
}

interface ToolUseContent {
  toolUse: {
    toolUseId: string;
    name: string;
    input: any;
  };
}

// Union type for all possible content blocks in our database
type ContentBlock = TextContent | ToolUseContent;

// Define tool result type
interface ToolResult {
  toolUseId: string;
  name: string;
  input: any;
  result: string;
  status: 'success' | 'error';
}

// Define our custom ChatMessage interface
export interface ChatMessage {
  id?: string;
  content: ContentBlock[];
  createdAt?: string;
  reasoning?: string;
  role: 'system' | 'user' | 'assistant';
  toolResults?: ToolResult[];
}

@Injectable()
export class BedrockChatService implements OnModuleInit {
  private bedrockClient: BedrockRuntimeClient;
  private mcpTools: any[] = [];
  private activeStreams = new Map<string, { aborted: boolean }>();

  constructor(
    private configService: ConfigService,
    private readonly conversationService: ConversationService,
    private readonly costService: CostService,
    private readonly messageService: MessageService,
    private mcpService: McpService,
  ) { }

  onModuleInit() {
    // Initialize the Bedrock client when the module starts
    this.bedrockClient = new BedrockRuntimeClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1')
    });

    this.initMcpTools();

    // Clean up any stale streams on initialization
    this.activeStreams.clear();
  }

  async streamChat(chatRequestDto: ChatRequestDto, res: Response, user: User): Promise<void> {
    try {
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

      const params = this.getConverseCommandParams(chatRequestDto, user, messages);

      // Process the chat stream and get the complete assistant response for database saving
      const assistantResponse = await this.processChatStream(params, res, user, streamContext, requestId, chatRequestDto);

      // Only save results if not aborted
      if (!streamContext.aborted) {
        const messagesToSave = this.getMessagesToSave(assistantResponse, messages, isNewConversation);
        this.messageService.addToConversation(messagesToSave, conversationId, user.emplId);

        if (isNewConversation) {
          const conversationName = await this.generateConversationName(chatRequestDto.content, user);
          res.write(`event: metadata\ndata: ${JSON.stringify({ conversationId, conversationName })}\n\n`);
          await this.conversationService.updateConversationName(user.emplId, conversationId, conversationName);
        }

        res.write(`data: [DONE]`);
      } else {
        console.log('Stream context was aborted, skipping message save');
      }

      res.end();

    } catch (error) {
      console.error('Error streaming chat response:', error);

      // Send an error response if the response hasn't been ended
      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({
          error: 'An error occurred while processing your request: ' + (error.message || 'Unknown error')
        })}\n\n`);
        res.end();
      }
    } finally {
      // Always clean up the stream context
      if (chatRequestDto.requestId) {
        this.activeStreams.delete(chatRequestDto.requestId);
      }
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

  private async processChatStream(params, res, user, streamContext, requestId, chatRequestDto: ChatRequestDto): Promise<ChatMessage> {
    const command = new ConverseStreamCommand(params);
    const response = await this.bedrockClient.send(command);
  
    // Track tokens for cost calculation
    let inputTokens = 0;
    let outputTokens = 0;
  
    // Handle the stream chunks
    let completeMessage = '';
    let reasoningResponse = '';
    let toolUseInput = '';
    let toolName = '';
    let toolUseId = '';
    let toolResults: ToolResult[] = [];
    let contentBlocks: ContentBlock[] = [];
    let waitingForContinuation = false;
  
    for await (const item of response.stream!) {
      // Check if request has been aborted
      if (streamContext.aborted) {
        console.log('Stream aborted, breaking loop');
        break; // Exit the loop if request was aborted
      }
      
      // Process the chunk depending on its type
      if (item.contentBlockStart) {
        if (item.contentBlockStart.start?.toolUse) {
          toolName = item.contentBlockStart.start.toolUse.name || '';
          toolUseId = item.contentBlockStart.start.toolUse.toolUseId || '';
          // Initialize tool input
          toolUseInput = '';
          console.log(`Starting tool use: ${toolName}, ID: ${toolUseId}`);
        }
      } else if (item.contentBlockDelta) {
        if (item.contentBlockDelta.delta?.text) {
          // Send text content to the client
          const textContent = item.contentBlockDelta.delta.text;
          completeMessage += textContent;
          res.write(`event: delta\ndata: ${JSON.stringify({ content: textContent })}\n\n`);
        } else if (item.contentBlockDelta.delta?.reasoningContent) {
          // Send reasoning content to the client
          const reasoningText = item.contentBlockDelta.delta.reasoningContent.text || '';
          reasoningResponse += reasoningText;
          res.write(`event: reasoning\ndata: ${JSON.stringify({ reasoning: reasoningText })}\n\n`);
        } else if (item.contentBlockDelta.delta?.toolUse) {
          // Collect tool use input (append to existing)
          if (item.contentBlockDelta.delta.toolUse.input) {
            toolUseInput += item.contentBlockDelta.delta.toolUse.input;
            console.log(`Tool input update: ${item.contentBlockDelta.delta.toolUse.input}`);
          }
        }
      } else if (item.messageStop) {
        if (item.messageStop.stopReason === 'tool_use' && toolName && toolUseInput) {
          console.log(`Tool use completed. Full input: ${toolUseInput}`);
          waitingForContinuation = true;
          
          // Add the tool use to content blocks
          let parsedInput;
          try {
            parsedInput = JSON.parse(toolUseInput);
          } catch (parseError) {
            console.error('Error parsing tool input JSON:', parseError);
            parsedInput = {}; // Empty object as fallback
          }
          
          contentBlocks.push({
            toolUse: {
              toolUseId: toolUseId,
              name: toolName,
              input: parsedInput
            }
          });
          
          // Notify client that a tool is being used
          res.write(`event: tool_use\ndata: ${JSON.stringify({ 
            toolUseId: toolUseId,
            name: toolName,
            input: parsedInput 
          })}\n\n`);
          
          try {
            // Call the MCP tool
            const toolResult = await this.mcpService.callTool(toolName, parsedInput);
            
            // Format tool result as plain text
            let toolResultText = '';
            if (Array.isArray(toolResult.content)) {
              toolResultText = toolResult.content
                .map(content => typeof content.text === 'string' ? content.text : '')
                .filter(text => text)
                .join('\n');
            }
            
            // Store the tool result for later saving
            toolResults.push({
              toolUseId: toolUseId,
              name: toolName,
              input: parsedInput,
              result: toolResultText,
              status: 'success'
            });
            
            // Notify client of the tool result
            res.write(`event: tool_result\ndata: ${JSON.stringify({ 
              toolUseId: toolUseId,
              name: toolName,
              input: parsedInput,
              result: toolResultText,
              status: 'success'
            })}\n\n`);
            
            // Continue with the conversation...
            const continuationResponse = await this.continueWithToolResult(
              res, 
              params.modelId, 
              user, 
              streamContext,
              {
                messages: [
                  {
                    role: 'user',
                    content: [{ text: chatRequestDto.content }], 
                  } as BedrockMessage,
                  ...params.messages,
                  {
                    role: 'assistant',
                    content: [
                      ...(completeMessage ? [{ text: completeMessage } as BedrockTextContent] : []),
                      {
                        toolUse: {
                          toolUseId: toolUseId,
                          name: toolName,
                          input: parsedInput
                        }
                      } as BedrockToolUseContent
                    ] as BedrockContentBlock[]
                  } as BedrockMessage,
                  {
                    role: 'user',
                    content: [
                      {
                        toolResult: {
                          toolUseId: toolUseId,
                          content: [{ text: toolResultText }],
                          status: 'success'
                        }
                      } as BedrockToolResultContent
                    ] as BedrockContentBlock[]
                  } as BedrockMessage
                ]
              }
            );
            
            // Update complete message with continuation response if available
            if (continuationResponse && continuationResponse.content) {
              if (typeof continuationResponse.content === 'string') {
                completeMessage += continuationResponse.content;
              } else {
                // Find text content blocks
                const textBlocks = continuationResponse.content.filter(block => 'text' in block);
                if (textBlocks.length > 0) {
                  completeMessage += (textBlocks[0] as TextContent).text;
                }
              }
            }
            
            // Update reasoning with continuation response reasoning if available
            if (continuationResponse && continuationResponse.reasoning) {
              reasoningResponse += '\n' + continuationResponse.reasoning;
            }
            
            // Ensure we don't mark this as aborted
            waitingForContinuation = false;
            streamContext.aborted = false;
            
          } catch (error) {
            console.error('Error handling tool result:', error);
            
            // Define error message
            const errorText = `Error: ${error.message || 'Unknown error'}`;
            
            // Store the failed tool result
            toolResults.push({
              toolUseId: toolUseId,
              name: toolName,
              input: parsedInput,
              result: errorText,
              status: 'error'
            });
            
            // Send error to client
            res.write(`event: error\ndata: ${JSON.stringify({ 
              error: 'Error executing tool: ' + (error.message || 'Unknown error')
            })}\n\n`);
            
            // Continue the conversation with the error result
            const continuationResponse = await this.continueWithToolResult(
              res, 
              params.modelId, 
              user,
              streamContext,
              {
                messages: [
                  {
                    role: 'user',
                    content: [{ text: chatRequestDto.content }], 
                  } as BedrockMessage,
                  ...params.messages,
                  {
                    role: 'assistant',
                    content: [
                      ...(completeMessage ? [{ text: completeMessage } as BedrockTextContent] : []),
                      {
                        toolUse: {
                          toolUseId: toolUseId,
                          name: toolName,
                          input: parsedInput
                        }
                      } as BedrockToolUseContent
                    ] as BedrockContentBlock[]
                  } as BedrockMessage,
                  {
                    role: 'user',
                    content: [
                      {
                        toolResult: {
                          toolUseId: toolUseId,
                          content: [{ text: errorText }],
                          status: 'error'
                        }
                      } as BedrockToolResultContent
                    ] as BedrockContentBlock[]
                  } as BedrockMessage
                ]
              }
            );
            
            // Update complete message with continuation response
            if (continuationResponse && continuationResponse.content) {
              if (typeof continuationResponse.content === 'string') {
                completeMessage += continuationResponse.content;
              } else {
                // Find text content blocks
                const textBlocks = continuationResponse.content.filter(block => 'text' in block);
                if (textBlocks.length > 0) {
                  completeMessage += (textBlocks[0] as TextContent).text;
                }
              }
            }
            
            // Update reasoning with continuation response reasoning
            if (continuationResponse && continuationResponse.reasoning) {
              reasoningResponse += '\n' + continuationResponse.reasoning;
            }
            
            // Ensure we don't mark this as aborted
            waitingForContinuation = false;
            streamContext.aborted = false;
          }
        } else {
          // Normal message end (not a tool use)
          // If there's reasoning content, send an event with the complete reasoning
          if (reasoningResponse) {
            res.write(`event: fullReasoning\ndata: ${JSON.stringify({ 
              reasoning: reasoningResponse 
            })}\n\n`);
          }
          
          // Send a completion event - IMPORTANT: Don't send content in this event
          // This prevents the client from replacing existing content
          res.write(`event: complete\ndata: ${JSON.stringify({ 
            ...(reasoningResponse ? { reasoning: reasoningResponse } : {})
          })}\n\n`);
        }
      } else if (item.metadata) {
        inputTokens = item.metadata.usage?.inputTokens || 0;
        outputTokens = item.metadata.usage?.outputTokens || 0;
  
        // Track usage
        await this.costService.trackUsage({
          user,
          modelId: params.modelId,
          inputTokens,
          outputTokens,
        });
        
        // Send usage metadata to client
        res.write(`event: metadata\ndata: ${JSON.stringify({ 
          usage: {
            inputTokens,
            outputTokens
          }
        })}\n\n`);
      }
    }
    
    // If we collected text content, add it to the content blocks
    if (completeMessage && contentBlocks.length === 0) {
      // Only add text content if no other content blocks (like tool uses) were added
      contentBlocks.push({ text: completeMessage });
    } else if (completeMessage && !contentBlocks.some(block => 'text' in block)) {
      // Add text content as the first block if there's no text block yet
      contentBlocks.unshift({ text: completeMessage });
    }
    
    // IMPORTANT: Make sure we're not aborted if we were waiting for continuation
    if (waitingForContinuation) {
      console.log('Was waiting for continuation, marking as not aborted');
      streamContext.aborted = false;
    }
    
    // Create the complete assistant message for database storage
    const assistantResponse: ChatMessage = {
      role: 'assistant',
      id: requestId,
      content: contentBlocks.length > 0 ? contentBlocks : [{ text: completeMessage }],
      reasoning: reasoningResponse || undefined,
      createdAt: new Date().toISOString(),
      // Add tool results if any
      toolResults: toolResults.length > 0 ? toolResults : undefined
    };
  
    return assistantResponse;
  }

  private getMessagesToSave(assistantResponse: ChatMessage, messages: BedrockMessage[], isNewConversation: boolean): ChatMessage[] {
    // Convert Bedrock messages to your custom ChatMessage format
    const convertedMessages = messages.map(msg => {

      return {
        role: msg.role,
        content: msg.content,
        createdAt: new Date().toISOString()
      } as ChatMessage;
    });

    // Add the assistant response
    convertedMessages.push(assistantResponse);

    // Return all messages or just the last 2 based on isNewConversation
    return isNewConversation ? convertedMessages : convertedMessages.slice(-2);
  }

  private convertMcpToolsToBedrockTools(mcpTools: Tool[]) {
    const bedrockTools = mcpTools.map(tool => {
      return {
        "toolSpec": {
          "name": tool.name,
          "description": tool.description,
          "inputSchema": {
            "json": {
              "type": "object",
              "properties": tool.inputSchema.properties,
              "required": tool.inputSchema.required
            }
          }
        }
      }
    });
    return bedrockTools;
  }

  private async generateConversationName(userInput: string, user: User) {
    const modelId = 'amazon.nova-micro-v1:0';
    const params = {
      modelId,
      system: [{ text: 'Respond with only a title name and nothing else. Do not use quotes in your response.' }],
      messages: [{
        role: 'user',
        content: [{ text: `Look at the following prompt: ${userInput} \n\nYour task: As an AI proficient in summarization, create a short concise title for the given prompt. Ensure the title is under 30 characters.` }]
      } as BedrockMessage],
    };

    const command = new ConverseCommand(params);
    const response = await this.bedrockClient.send(command);
    const inputTokens = response.usage?.inputTokens || 0;
    const outputTokens = response.usage?.outputTokens || 0;

    await this.costService.trackUsage({
      user,
      modelId,
      inputTokens,
      outputTokens
    });

    // Extract the message text from the response
    let titleText = '';
    if (response.output?.message?.content) {
      const content = response.output.message.content;
      if (Array.isArray(content)) {
        // If content is an array, look for text blocks
        for (const block of content) {
          if (block.text) {
            titleText = block.text;
            break;
          }
        }
      } else {
        // For simple string content
        titleText = content as string;
      }
    }

    return titleText;
  }

  private async continueWithToolResult(
    res: Response,
    modelId: string,
    user: User,
    streamContext: { aborted: boolean },
    params: {
      messages: BedrockMessage[]
    }
  ): Promise<ChatMessage> {
    try {
      console.log('Continuing with tool result');

      // Create a new request with the updated messages
      const command = new ConverseStreamCommand({
        modelId: modelId,
        inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
        messages: params.messages,
        toolConfig: {
          tools: this.mcpTools,
          toolChoice: {
            auto: {}
          }
        }
      });

      // Execute the command and process the stream
      const response = await this.bedrockClient.send(command);

      // Process the response stream
      let completeMessage = '';
      let reasoningResponse = '';

      for await (const item of response.stream!) {
        if (streamContext.aborted) {
          console.log('Continuation stream aborted');
          break;
        }

        if (item.contentBlockDelta) {
          if (item.contentBlockDelta.delta?.text) {
            const textContent = item.contentBlockDelta.delta.text;
            completeMessage += textContent;
            res.write(`event: delta\ndata: ${JSON.stringify({ content: textContent })}\n\n`);
          } else if (item.contentBlockDelta.delta?.reasoningContent) {
            const reasoningText = item.contentBlockDelta.delta.reasoningContent.text || '';
            reasoningResponse += reasoningText;
            res.write(`event: reasoning\ndata: ${JSON.stringify({ reasoning: reasoningText })}\n\n`);
          }
        } else if (item.messageStop) {
          // Send final response
          if (reasoningResponse) {
            res.write(`event: fullReasoning\ndata: ${JSON.stringify({
              reasoning: reasoningResponse
            })}\n\n`);
          }

          res.write(`event: complete\ndata: ${JSON.stringify({
            content: completeMessage,
            ...(reasoningResponse ? { reasoning: reasoningResponse } : {})
          })}\n\n`);

        } else if (item.metadata) {
          const inputTokens = item.metadata.usage?.inputTokens || 0;
          const outputTokens = item.metadata.usage?.outputTokens || 0;

          // Track usage
          await this.costService.trackUsage({
            user,
            modelId: modelId,
            inputTokens,
            outputTokens,
          });
        }
      }

      // IMPORTANT: Make sure we're not aborted after tool continuation
      streamContext.aborted = false;
      console.log('Tool continuation complete, setting streamContext.aborted to false');

      return {
        role: 'assistant',
        content: [{ text: completeMessage }],
        reasoning: reasoningResponse || undefined,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in continuation response:', error);

      // Send an error response if the response hasn't been ended
      if (!res.writableEnded) {
        res.write(`event: error\ndata: ${JSON.stringify({
          error: 'Error processing tool result: ' + (error.message || 'Unknown error')
        })}\n\n`);
      }

      // Return a minimal message for database storage
      return {
        role: 'assistant',
        content: [{ text: 'Error processing tool result: ' + (error.message || 'Unknown error') }],
        createdAt: new Date().toISOString()
      };
    } finally {
      // Ensure we mark streamContext as not aborted
      streamContext.aborted = false;
    }
  }

  private getConverseCommandParams(chatRequestDto: ChatRequestDto, user: User, messages: BedrockMessage[]) {

    // Prepare the request parameters for ConverseCommand
    const isToolCapable = chatRequestDto.modelId.includes('us.anthropic.claude')
    return {
      modelId: chatRequestDto.modelId,
      inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
      system: [this.getDefaultSystemMessage(user)],
      messages,
      ...(isToolCapable ? this.getToolConfigForParams() : {})

    };
  }

  private getToolConfigForParams() {
    return {
      toolConfig: {
        tools: this.mcpTools,
        toolChoice: {
          auto: {}
        }
      }
    }
  }

  private initMcpTools() {
    try {
      // Wait for MCP service to connect and initialize
      setTimeout(async () => {
        // Convert MCP tools to a format suitable for Bedrock
        const availableTools = this.mcpService.getAvailableTools();
        this.mcpTools = this.convertMcpToolsToBedrockTools(availableTools);
        console.log(`Initialized ${this.mcpTools.length} MCP tools for AI chat`);
      }, 2000); // Give MCP service some time to connect
    } catch (error) {
      console.error('Failed to initialize MCP tools:', error);
    }
  }

  private setupSSEHeaders(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
  }

  private async initializeConversation(chatRequestDto: ChatRequestDto, user: User, res: Response) {
    const isNewConversation = !chatRequestDto.conversationId;
    const conversationId = chatRequestDto.conversationId || uuidv4();
    const id = chatRequestDto.id || uuidv4();

    const userMessage: BedrockMessage = {
      role: 'user',
      content: [{ text: chatRequestDto.content }]
    };

    let messages: BedrockMessage[] = isNewConversation
      ? [userMessage]
      : [
        ...await this.getPreviousMessages(chatRequestDto.conversationId!, user.emplId, userMessage)
      ];

    if (isNewConversation) {
      res.write(`event: metadata\ndata: ${JSON.stringify({ conversationId })}\n\n`);
      await this.conversationService.createConversation(conversationId, user);
    }

    return { conversationId, messages, isNewConversation };
  }

  private async getPreviousMessages(conversationId: string, emplId: string, userMessage: BedrockMessage): Promise<BedrockMessage[]> {
    const previousMessages = await this.messageService.getMessages(conversationId, emplId);

    // Convert stored messages to Bedrock format
    const formattedMessages = previousMessages.map(message => {
      return {
        role: message.role,
        content: message.content && typeof message.content === 'string'
          ? [{ text: message.content }]
          : message.content
      } as BedrockMessage;
    });

    return [...formattedMessages, userMessage];
  }

  private getDefaultSystemMessage(user: User) {
    return {
      text: `The user's name is: ${user.name}, please follow their instructions carefully. Respond using markdown. If you are asked to draw a diagram, use Mermaid syntax in a \`\`\`mermaid code block. For visualizations, use a \`\`\`vega code block with Vega-lite. Do not draw or visualize unless explicitly requested. Be concise unless instructed otherwise. `
    };
  }
}