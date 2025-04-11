export interface TextContentBlock {
    text: string;
  }
  
  export interface ToolUseContentBlock {
    toolUse: {
      toolUseId: string;
      name: string;
      input: any;
    };
  }
  
  // Union type for all content block types
  export type ContentBlock = TextContentBlock | ToolUseContentBlock;
  
  // Tool result tracking
  export interface ToolResult {
    toolUseId: string;
    name: string;
    input: any;
    result: string;
    status: 'success' | 'error';
  }
  
  // Updated Message interface
  export interface Message {
    id?: string;
    content: ContentBlock[];
    createdAt?: string;
    reasoning?: string;
    role: 'system' | 'user' | 'assistant';
    usage?: {
      inputTokens: number;
      outputTokens: number;
    };
    toolResults?: ToolResult[];
  }
  
  export interface Conversation {
    conversationId: string;
    name: string;
    createdAt?: string;
    isStarred?: boolean;
  }
  
  export interface CustomInstruction {
    id: string;
    name: string;
    description: string;
    content: string;
  }
  
  export interface Model {
    modelId: string;
    enabled: boolean;
    updatedAt: string;
    createdAt: string;
    description: string;
    outputPricePerMillionTokens: number;
    inputPricePerMillionTokens: number;
    name: string;
    sortOrder: number;
    isDefault: boolean;
  }
  
  export type Role = 'assistant' | 'user' | 'system';