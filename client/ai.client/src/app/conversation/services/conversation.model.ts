export interface Conversation {
    id: string;
    name: string;
    messages: Message[];
    // model: Model;
    prompt?: string;
    temperature?: number;
    instructions?: CustomInstruction;
    tags?: string[]

}

export interface Message {
    role: Role;
    content: string;
    id: string;
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
