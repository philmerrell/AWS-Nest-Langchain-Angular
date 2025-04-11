// backend/ai.chat.api/src/mcp/mcp.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Prompt } from '@modelcontextprotocol/sdk/types.js';
import * as path from 'path';


interface ToolResult {
  content: Array<{
    type: string;
    text?: string;
  }>;
  isError?: boolean;
}

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private transport: StdioClientTransport;
  private isConnected = false;
  private readonly logger = new Logger(McpService.name);
  private tools: Tool[] = [];
  private prompts: Prompt[] = [];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connectToWeatherServer();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connectToWeatherServer() {
    try {
      // Configure the transport for the Weather MCP Server
      const nodePath = process.execPath;
      const weatherServerPath = path.resolve(process.cwd(), './dist/src/mcp/weather-server.js');
      
      this.logger.log(`Using Node.js executable at: ${nodePath}`);
      this.logger.log(`Weather server script at: ${weatherServerPath}`);
        
      if (!weatherServerPath) {
        this.logger.warn('MCP_WEATHER_SERVER_PATH not set, skipping MCP server connection');
        return;
      }

      this.transport = new StdioClientTransport({
        command: nodePath,
        args: ['./dist/src/mcp/weather-server.js'],
        env: {
          WEATHER_API_KEY: this.configService.get<string>('WEATHER_API_KEY')|| '',
        },
      });

      // Initialize the client
      this.client = new Client(
        {
          name: 'bsu-weather',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
            prompts: {},
          },
        }
      );

      // Connect the client to the transport
      await this.client.connect(this.transport);
      this.isConnected = true;
      this.logger.log('Successfully connected to Weather MCP Server');

      // Fetch available tools and prompts
      await this.fetchAvailableTools();
      await this.fetchAvailablePrompts();
    } catch (error) {
      this.logger.error(`Failed to connect to Weather MCP Server: ${error.message}`, error.stack);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      try {
        await this.client.close();
        this.isConnected = false;
        this.logger.log('Disconnected from Weather MCP Server');
      } catch (error) {
        this.logger.error(`Error disconnecting from Weather MCP Server: ${error.message}`, error.stack);
      }
    }
  }

  private async fetchAvailableTools() {
    try {
      const result = await this.client.listTools();
      this.tools = result.tools;
      this.logger.log(`Fetched ${this.tools.length} tools from Weather MCP Server`);
    } catch (error) {
      this.logger.error(`Failed to fetch tools: ${error.message}`, error.stack);
    }
  }

  private async fetchAvailablePrompts() {
    try {
      const result = await this.client.listPrompts();
      this.prompts = result.prompts;
      this.logger.log(`Fetched ${this.prompts.length} prompts from Weather MCP Server`);
    } catch (error) {
      this.logger.error(`Failed to fetch prompts: ${error.message}`, error.stack);
    }
  }

  // This method is used by the AI model through the ChatService
  async callTool(toolName: string, args: any): Promise<ToolResult> {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      }) as ToolResult;

      if (result.isError) {
        throw new Error(result.content[0]?.text || 'Unknown error executing tool');
      }

      return result || 'No data returned from tool';
    } catch (error) {
      this.logger.error(`Error calling tool ${toolName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPrompt(promptName: string, args: Record<string, any>): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const result = await this.client.getPrompt({
        name: promptName,
        arguments: args,
      });

      return result.messages;
    } catch (error) {
      this.logger.error(`Error fetching prompt ${promptName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  getAvailableTools(): Tool[] {
    return this.tools;
  }

  getAvailablePrompts(): Prompt[] {
    return this.prompts;
  }

  getClient() {
    return this.client
  }
}