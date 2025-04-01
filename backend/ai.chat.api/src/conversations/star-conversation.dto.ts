// backend/ai.chat.api/src/conversations/star-conversation.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const StarConversationSchema = z.object({
  isStarred: z.boolean(),
});

export class StarConversationDto extends createZodDto(StarConversationSchema) {}