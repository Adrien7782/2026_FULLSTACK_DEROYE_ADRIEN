import { z } from "zod";

export const seriesSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const seasonParamsSchema = z.object({
  slug: z.string().min(1),
  seasonNumber: z.coerce.number().int().positive(),
});

export const episodeParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createSeriesBodySchema = z.object({
  title: z.string().min(1).max(200),
  synopsis: z.string().min(1).max(2000),
  releaseYear: z.number().int().min(1888).max(2100).optional(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  genreIds: z.array(z.string().uuid()).optional(),
});

export const createSeasonBodySchema = z.object({
  number: z.number().int().positive(),
  title: z.string().max(200).optional(),
  synopsis: z.string().max(2000).optional(),
});

export const createEpisodeBodySchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1).max(200),
  synopsis: z.string().max(2000).optional(),
  durationMinutes: z.number().int().min(1).max(999).optional(),
  status: z.enum(["draft", "published", "archived"]).default("published"),
});

export const saveEpisodeProgressSchema = z.object({
  positionSeconds: z.number().min(0),
  durationSeconds: z.number().min(0).optional(),
  completed: z.boolean().optional(),
});
