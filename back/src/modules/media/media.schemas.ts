import { z } from "zod";

export const mediaTypeSchema = z.enum(["film", "series"]);

export const mediaListQuerySchema = z.object({
  type: mediaTypeSchema.default("film"),
  search: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  genre: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export const mediaGenresQuerySchema = z.object({
  type: mediaTypeSchema.default("film"),
});

export const mediaSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});
