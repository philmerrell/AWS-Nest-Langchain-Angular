// src/conversations/share-conversation.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ShareConversationSchema = z.object({
  conversationId: z.string().uuid(),
  shareWithEmails: z.array(z.string().email()).optional(),
  isPublic: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export class ShareConversationDto extends createZodDto(ShareConversationSchema) {}

// For generating a shareable link
const GetShareableLinkSchema = z.object({
  sharedConversationId: z.string().uuid(),
});

export class GetShareableLinkDto extends createZodDto(GetShareableLinkSchema) {}