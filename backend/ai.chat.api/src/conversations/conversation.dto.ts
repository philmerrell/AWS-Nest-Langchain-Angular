import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ConversationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  conversationId: z.string().uuid(),
});

export class CreateConversationDto extends createZodDto(ConversationSchema) {}