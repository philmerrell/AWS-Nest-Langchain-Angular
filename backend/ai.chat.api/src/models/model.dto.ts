// src/models/model-with-pricing.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ModelWithPricingSchema = z.object({
  // Model properties
  modelId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  
  // Pricing properties
  inputPricePerMillionTokens: z.number().nonnegative(),
  outputPricePerMillionTokens: z.number().nonnegative(),
  effectiveDate: z.string().optional().default(() => new Date().toISOString()),
  
  // Audit fields
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export class ModelWithPricingDto extends createZodDto(ModelWithPricingSchema) {}