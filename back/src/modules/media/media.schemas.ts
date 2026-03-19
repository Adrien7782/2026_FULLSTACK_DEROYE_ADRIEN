import { z } from "zod";

export const mediaTypeSchema = z.enum(["film", "series"]);
export const mediaVisibilitySchema = z.enum(["published", "draft", "all"]);

export const createMediaBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  synopsis: z.string().trim().min(1).max(2000),
  releaseYear: z.number().int().min(1888).max(2100).optional(),
  durationMinutes: z.number().int().min(1).max(999).optional(),
  genreIds: z.array(z.string().uuid()).optional(),
  status: z.enum(["draft", "published"]).default("published"),
});

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
  status: mediaVisibilitySchema.optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export const mediaGenresQuerySchema = z.object({
  type: mediaTypeSchema.default("film"),
  status: mediaVisibilitySchema.optional(),
});

export const mediaSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});
