// backend/ai.chat.api/src/conversations/rename-conversation.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RenameConversationSchema = z.object({
  name: z.string().min(1).max(100),
});

export class RenameConversationDto extends createZodDto(RenameConversationSchema) {}