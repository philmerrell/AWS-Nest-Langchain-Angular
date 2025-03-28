export interface Conversation {
    conversationId: string;
    name: string;
    createdAt?: string;
}

export interface Message {
    role: Role;
    content: string;
    id?: string;
    reasoning?: string;
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
