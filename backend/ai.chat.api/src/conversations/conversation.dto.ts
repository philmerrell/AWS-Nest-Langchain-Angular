import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ConversationSchema = z.object({
  title: z.string().optional(),
  conversationId: z.string().uuid(),
});

export class ConversationDto extends createZodDto(ConversationSchema) {}