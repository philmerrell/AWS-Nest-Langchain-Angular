
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Define Zod Schema
export const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
      id: z.string().uuid(),
    })
  ),
  model: z.string(),
  temperature: z.number().min(0).max(1), // Ensures temperature is between 0 and 1
});

export class ChatRequestDto extends createZodDto(ChatRequestSchema) {}

export const MessageSchema = z.object({
  role: z.string(),
  content: z.string(),
  id: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

export class MessageDto extends createZodDto(MessageSchema) {}

