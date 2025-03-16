export interface Conversation {
    id: string;
    name: string;
    messages: Message[];
    model: Model;
    prompt?: string;
    temperature?: number;
    promptTemplate?: Prompt | null;
    tags?: string[]

}

export interface Message {
    role: Role;
    content: string;
    id: string;
    type: string | undefined;
}

export interface Prompt {
    id: string;
    name: string;
    description: string;
    content: string;
    model?: Model;
    folderId: string | null;
    type?: string;
}

export interface Model {
    id: string;
    name: string;
}

export type Role = 'assistant' | 'user' | 'system';
