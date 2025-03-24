import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Path params
export const YearMonthParam = z.object({ yearMonth: z.string().regex(/^\d{4}-\d{2}$/) });
export const YearParam = z.object({ year: z.string().regex(/^\d{4}$/) });
export const DateParam = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

// Pagination & query
export const PaginationQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  lastKey: z.string().optional(),
});

export class YearMonthParamDto extends createZodDto(YearMonthParam) {}
export class YearParamDto extends createZodDto(YearParam) {}
export class DateParamDto extends createZodDto(DateParam) {}
export class PaginationQueryDto extends createZodDto(PaginationQuery) {}
