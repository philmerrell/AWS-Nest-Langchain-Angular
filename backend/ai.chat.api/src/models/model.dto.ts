// Update src/models/model.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ModelWithPricingSchema = z.object({
  // Existing fields...
  modelId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  
  // Add allowed roles field
  allowedRoles: z.array(z.string()).default([]),
  
  // Pricing properties
  inputPricePerMillionTokens: z.number().nonnegative(),
  outputPricePerMillionTokens: z.number().nonnegative(),
  effectiveDate: z.string().optional().default(() => new Date().toISOString()),
  
  // Audit fields
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export class ModelWithPricingDto extends createZodDto(ModelWithPricingSchema) {}