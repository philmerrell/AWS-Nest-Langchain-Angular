import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ModelCreateSchema = z.object({
  modelId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  inputPricePerMillionTokens: z.number().nonnegative(),
  outputPricePerMillionTokens: z.number().nonnegative(),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export class ModelCreateDto extends createZodDto(ModelCreateSchema) {}
