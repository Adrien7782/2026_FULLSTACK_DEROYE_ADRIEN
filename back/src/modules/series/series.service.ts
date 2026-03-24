import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/errors.js";
import type { z } from "zod";
import type {
  createEpisodeBodySchema,
  createSeasonBodySchema,
  createSeriesBodySchema,
} from "./series.schemas.js";

type CreateSeriesInput = z.infer<typeof createSeriesBodySchema> & {
  posterPath?: string;
};
type CreateSeasonInput = z.infer<typeof createSeasonBodySchema>;
type CreateEpisodeInput = z.infer<typeof createEpisodeBodySchema> & {
  videoPath?: string;
};
type ViewerRole = "standard" | "admin" | undefined;

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const createSeries = async (input: CreateSeriesInput) => {
  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  for (let attempt = 1; ; attempt++) {
    const existing = await prisma.media.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${attempt}`;
  }

  const media = await prisma.media.create({
    data: {
      slug,
      title: input.title,
      synopsis: input.synopsis,
      type: "series",
      status: input.status,
      releaseYear: input.releaseYear,
      posterPath: input.posterPath,
      ...(input.genreIds?.length
        ? { genres: { connect: input.genreIds.map((id) => ({ id })) } }
        : {}),
      serie: { create: {} },
    },
    select: {
      id: true, slug: true, title: true, synopsis: true, type: true, status: true,
      releaseYear: true, posterPath: true, createdAt: true,
      genres: { select: { id: true, name: true, slug: true } },
      serie: { select: { id: true } },
    },
  });

  return media;
};

export const getSeriesDetail = async (slug: string, viewerRole?: ViewerRole) => {
  const media = await prisma.media.findFirst({
    where: {
      slug,
      type: "series",
      ...(viewerRole === "admin" ? {} : { status: "published" }),
    },
    select: {
      id: true, slug: true, title: true, synopsis: true, type: true, status: true,
      releaseYear: true, posterPath: true, createdAt: true, updatedAt: true,
      genres: { select: { id: true, name: true, slug: true } },
      serie: {
        select: {
          id: true,
          seasons: {
            orderBy: { number: "asc" },
            select: {
              id: true, number: true, title: true, synopsis: true,
              episodes: {
                orderBy: { number: "asc" },
                where: viewerRole === "admin" ? {} : { status: "published" },
                select: {
                  id: true, number: true, title: true, synopsis: true,
                  durationMinutes: true, status: true, videoPath: true, createdAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!media || !media.serie) throw new ApiError(404, "Série introuvable");

  return {
    id: media.id,
    slug: media.slug,
    title: media.title,
    synopsis: media.synopsis,
    type: media.type,
    status: media.status,
    releaseYear: media.releaseYear,
    hasPoster: !!media.posterPath,
    createdAt: media.createdAt,
    updatedAt: media.updatedAt,
    genres: media.genres,
    seasons: media.serie.seasons.map((s) => ({
      id: s.id,
      number: s.number,
      title: s.title,
      synopsis: s.synopsis,
      episodeCount: s.episodes.length,
      episodes: s.episodes.map((e) => ({
        id: e.id,
        number: e.number,
        title: e.title,
        synopsis: e.synopsis,
        durationMinutes: e.durationMinutes,
        status: e.status,
        hasVideo: !!e.videoPath,
        createdAt: e.createdAt,
      })),
    })),
  };
};

export const addSeason = async (seriesSlug: string, input: CreateSeasonInput) => {
  const media = await prisma.media.findFirst({
    where: { slug: seriesSlug, type: "series" },
    select: { serie: { select: { id: true } } },
  });
  if (!media?.serie) throw new ApiError(404, "Série introuvable");

  const existing = await prisma.season.findUnique({
    where: { serieId_number: { serieId: media.serie.id, number: input.number } },
  });
  if (existing) throw new ApiError(409, `La saison ${input.number} existe déjà`);

  return prisma.season.create({
    data: {
      serieId: media.serie.id,
      number: input.number,
      title: input.title,
      synopsis: input.synopsis,
    },
    select: { id: true, number: true, title: true, synopsis: true, createdAt: true },
  });
};

export const addEpisode = async (
  seriesSlug: string,
  seasonNumber: number,
  input: CreateEpisodeInput,
) => {
  const media = await prisma.media.findFirst({
    where: { slug: seriesSlug, type: "series" },
    select: { serie: { select: { id: true } } },
  });
  if (!media?.serie) throw new ApiError(404, "Série introuvable");

  const season = await prisma.season.findUnique({
    where: { serieId_number: { serieId: media.serie.id, number: seasonNumber } },
    select: { id: true },
  });
  if (!season) throw new ApiError(404, `Saison ${seasonNumber} introuvable`);

  const existing = await prisma.episode.findUnique({
    where: { seasonId_number: { seasonId: season.id, number: input.number } },
  });
  if (existing) throw new ApiError(409, `L'épisode ${input.number} existe déjà dans cette saison`);

  return prisma.episode.create({
    data: {
      seasonId: season.id,
      number: input.number,
      title: input.title,
      synopsis: input.synopsis,
      durationMinutes: input.durationMinutes,
      videoPath: input.videoPath,
      status: input.status,
    },
    select: {
      id: true, number: true, title: true, synopsis: true,
      durationMinutes: true, status: true, createdAt: true,
    },
  });
};

export const getEpisode = async (episodeId: string, viewerRole?: ViewerRole) => {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: {
      id: true, number: true, title: true, synopsis: true,
      durationMinutes: true, status: true, videoPath: true,
      season: {
        select: {
          number: true, title: true,
          serie: {
            select: {
              media: { select: { id: true, slug: true, title: true, status: true } },
            },
          },
        },
      },
    },
  });

  if (!episode) throw new ApiError(404, "Épisode introuvable");
  if (viewerRole !== "admin" && episode.status !== "published") {
    throw new ApiError(404, "Épisode introuvable");
  }
  if (viewerRole !== "admin" && episode.season.serie.media.status !== "published") {
    throw new ApiError(403, "Accès refusé");
  }

  return episode;
};

export const saveEpisodeProgress = async (
  userId: string,
  episodeId: string,
  positionSeconds: number,
  durationSeconds?: number,
  completed?: boolean,
) => {
  const episode = await prisma.episode.findUnique({ where: { id: episodeId }, select: { id: true } });
  if (!episode) throw new ApiError(404, "Épisode introuvable");

  return prisma.episodePlaybackProgress.upsert({
    where: { userId_episodeId: { userId, episodeId } },
    create: { userId, episodeId, positionSeconds, durationSeconds, completed: completed ?? false },
    update: {
      positionSeconds,
      ...(durationSeconds !== undefined ? { durationSeconds } : {}),
      ...(completed !== undefined ? { completed } : {}),
    },
  });
};

export const getEpisodeProgress = async (userId: string, episodeId: string) => {
  return prisma.episodePlaybackProgress.findUnique({
    where: { userId_episodeId: { userId, episodeId } },
    select: { positionSeconds: true, durationSeconds: true, completed: true },
  });
};

export const getSerieResumeEpisode = async (slug: string, userId: string) => {
  const media = await prisma.media.findFirst({
    where: { slug, type: "series" },
    select: {
      serie: {
        select: {
          seasons: {
            orderBy: { number: "asc" },
            select: {
              number: true,
              episodes: {
                orderBy: { number: "asc" },
                where: { status: "published" },
                select: {
                  id: true,
                  playbackProgress: {
                    where: { userId },
                    select: { positionSeconds: true, completed: true, updatedAt: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!media?.serie) return null;

  const episodes: Array<{
    id: string;
    progress: { positionSeconds: number; completed: boolean; updatedAt: Date } | undefined;
  }> = [];

  for (const season of media.serie.seasons) {
    for (const ep of season.episodes) {
      episodes.push({ id: ep.id, progress: ep.playbackProgress[0] });
    }
  }

  if (episodes.length === 0) return null;

  const watched = episodes.filter((e) => e.progress !== undefined);
  if (watched.length === 0) return episodes[0].id;

  const mostRecent = watched.reduce((a, b) =>
    a.progress!.updatedAt > b.progress!.updatedAt ? a : b,
  );

  if (!mostRecent.progress!.completed) return mostRecent.id;

  const idx = episodes.findIndex((e) => e.id === mostRecent.id);
  if (idx >= 0 && idx < episodes.length - 1) return episodes[idx + 1].id;

  return mostRecent.id;
};
