export interface Conversation {
    conversationId: string;
    name: string;
    createdAt?: string;
    messages?: Message[]

}

export interface Message {
    role: Role;
    content: string;
    id?: string;
}

export interface CustomInstruction {
    id: string;
    name: string;
    description: string;
    content: string;
}

export interface Model {
    id: string;
    name: string;
}

export type Role = 'assistant' | 'user' | 'system';
