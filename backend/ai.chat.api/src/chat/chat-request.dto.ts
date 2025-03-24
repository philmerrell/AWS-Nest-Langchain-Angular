
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ChatRequestSchema = z.object({
  role: z.string(),
  modelId: z.string(),
  content: z.string(),
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

export class ChatRequestDto extends createZodDto(ChatRequestSchema) {}

