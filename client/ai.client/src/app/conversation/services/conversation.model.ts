
  
  
  // Update ContentBlock types to include ToolResult
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

  export interface ToolResult {
    toolUseId: string;
    name: string;
    input: any;
    result: string;
    status: 'success' | 'error';
  }
  
  export interface ToolResultContentBlock {
    toolResult: {
      toolUseId: string;
      content: Array<{text?: string; json?: any}>;
      status: 'success' | 'error';
    };
  }
  
  // Union type for all content block types
  export type ContentBlock = 
    | TextContentBlock 
    | ToolUseContentBlock
    | ToolResultContentBlock;
  
  // Updated Message interface
  export interface Message {
    id?: string;
    role: 'user' | 'assistant';
    content: ContentBlock[];
    createdAt?: string;
    reasoning?: string;
    usage?: {
      inputTokens: number;
      outputTokens: number;
    };
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