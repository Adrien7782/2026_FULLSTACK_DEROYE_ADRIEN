import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import { getVideoDuration } from "../media/media.upload.js";
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
      releaseYear: true, posterPath: true, seriesDirPath: true, createdAt: true, updatedAt: true,
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
    hasDirPath: !!media.seriesDirPath,
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

// ─── Directory scan ──────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
// Title is optional: S1 or S1_Titre_de_la_saison
const SEASON_PATTERN = /^S(\d+)(?:_(.+))?$/i;
// Title is optional: EP1.mp4 or EP1_Titre_de_l_episode.mp4
const EPISODE_PATTERN = /^EP(\d+)(?:_(.+))?\.(mp4|webm|mov|m4v)$/i;

export type ScannedEpisode = { number: number; title: string; relativePath: string; durationMinutes: number | null };
export type ScannedSeason = { number: number; title: string | null; episodes: ScannedEpisode[] };
export type SeriesDirectoryScan = {
  posterRelativePath: string | null;
  seasons: ScannedSeason[];
};

const resolveScanDir = (dirPath: string) =>
  isAbsolute(dirPath) ? resolve(dirPath) : resolve(env.DATA_DIRECTORY, dirPath);

export const scanSeriesDirectory = (dirPath: string): SeriesDirectoryScan => {
  const absDir = resolveScanDir(dirPath);

  if (!existsSync(absDir)) throw new ApiError(400, `Répertoire introuvable : ${dirPath}`);
  if (!statSync(absDir).isDirectory()) throw new ApiError(400, `Ce chemin n'est pas un répertoire : ${dirPath}`);

  const entries = readdirSync(absDir, { withFileTypes: true });

  let posterRelativePath: string | null = null;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name).toLowerCase();
    const nameBase = basename(entry.name, extname(entry.name)).toLowerCase();
    if (nameBase === "poster" && IMAGE_EXTENSIONS.has(ext)) {
      posterRelativePath = relative(env.DATA_DIRECTORY, join(absDir, entry.name)).replace(/\\/g, "/");
      break;
    }
  }

  const seasons: ScannedSeason[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sm = SEASON_PATTERN.exec(entry.name);
    if (!sm) continue;

    const seasonAbsDir = join(absDir, entry.name);
    const episodes: ScannedEpisode[] = [];

    for (const epEntry of readdirSync(seasonAbsDir, { withFileTypes: true })) {
      if (!epEntry.isFile()) continue;
      const em = EPISODE_PATTERN.exec(epEntry.name);
      if (!em) continue;
      const epNumber = parseInt(em[1], 10);
      const epTitle = em[2] ? em[2].replace(/_/g, " ") : `Épisode ${epNumber}`;
      const absEpPath = join(seasonAbsDir, epEntry.name);
      const relPath = relative(env.DATA_DIRECTORY, absEpPath).replace(/\\/g, "/");
      const durationMinutes = getVideoDuration(absEpPath);
      episodes.push({ number: epNumber, title: epTitle, relativePath: relPath, durationMinutes });
    }

    const seasonNumber = parseInt(sm[1], 10);
    const seasonTitle = sm[2] ? sm[2].replace(/_/g, " ") : null;
    episodes.sort((a, b) => a.number - b.number);
    seasons.push({ number: seasonNumber, title: seasonTitle, episodes });
  }

  seasons.sort((a, b) => a.number - b.number);
  return { posterRelativePath, seasons };
};

export const importSeriesFromDirectory = async (
  dirPath: string,
  input: CreateSeriesInput,
) => {
  const absDir = resolveScanDir(dirPath);
  const scan = scanSeriesDirectory(dirPath);

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
      posterPath: scan.posterRelativePath,
      seriesDirPath: absDir,
      ...(input.genreIds?.length
        ? { genres: { connect: input.genreIds.map((id) => ({ id })) } }
        : {}),
      serie: {
        create: {
          seasons: {
            create: scan.seasons.map((s) => ({
              number: s.number,
              title: s.title,
              episodes: {
                create: s.episodes.map((e) => ({
                  number: e.number,
                  title: e.title,
                  videoPath: e.relativePath,
                  durationMinutes: e.durationMinutes,
                  status: input.status,
                })),
              },
            })),
          },
        },
      },
    },
    select: {
      id: true, slug: true, title: true, status: true,
      serie: {
        select: {
          seasons: { select: { number: true, title: true, _count: { select: { episodes: true } } } },
        },
      },
    },
  });

  return { media, scan };
};

export const refreshSeriesFromDirectory = async (slug: string) => {
  const media = await prisma.media.findFirst({
    where: { slug, type: "series" },
    select: { id: true, seriesDirPath: true, serie: { select: { id: true } } },
  });
  if (!media?.serie) throw new ApiError(404, "Série introuvable");
  if (!media.seriesDirPath) throw new ApiError(400, "Cette série n'a pas de répertoire source associé");

  const scan = scanSeriesDirectory(media.seriesDirPath);

  if (scan.posterRelativePath) {
    await prisma.media.update({ where: { id: media.id }, data: { posterPath: scan.posterRelativePath } });
  }

  let addedSeasons = 0;
  let addedEpisodes = 0;

  for (const ss of scan.seasons) {
    let season = await prisma.season.findUnique({
      where: { serieId_number: { serieId: media.serie.id, number: ss.number } },
      select: { id: true, title: true },
    });
    if (!season) {
      season = await prisma.season.create({
        data: { serieId: media.serie.id, number: ss.number, title: ss.title },
        select: { id: true, title: true },
      });
      addedSeasons++;
    } else if (ss.title !== null && ss.title !== season.title) {
      await prisma.season.update({
        where: { id: season.id },
        data: { title: ss.title },
      });
    }
    for (const se of ss.episodes) {
      const existing = await prisma.episode.findUnique({
        where: { seasonId_number: { seasonId: season.id, number: se.number } },
        select: { id: true, title: true },
      });
      if (!existing) {
        await prisma.episode.create({
          data: { seasonId: season.id, number: se.number, title: se.title, videoPath: se.relativePath, durationMinutes: se.durationMinutes, status: "published" },
        });
        addedEpisodes++;
      } else if (se.title !== existing.title) {
        await prisma.episode.update({
          where: { id: existing.id },
          data: { title: se.title, durationMinutes: se.durationMinutes },
        });
      }
    }
  }

  return { addedSeasons, addedEpisodes };
};

export const renameSeason = async (slug: string, seasonNumber: number, title: string) => {
  const media = await prisma.media.findFirst({
    where: { slug, type: "series" },
    select: { serie: { select: { id: true } } },
  });
  if (!media?.serie) throw new ApiError(404, "Série introuvable");

  const season = await prisma.season.findUnique({
    where: { serieId_number: { serieId: media.serie.id, number: seasonNumber } },
    select: { id: true },
  });
  if (!season) throw new ApiError(404, `Saison ${seasonNumber} introuvable`);

  return prisma.season.update({
    where: { id: season.id },
    data: { title },
    select: { id: true, number: true, title: true },
  });
};

export const updateSeriesMeta = async (
  slug: string,
  input: { title?: string; synopsis?: string; releaseYear?: number | null; status?: "draft" | "published" | "archived"; genreIds?: string[] },
) => {
  const media = await prisma.media.findFirst({ where: { slug, type: "series" }, select: { id: true } });
  if (!media) throw new ApiError(404, "Série introuvable");

  const updated = await prisma.media.update({
    where: { id: media.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.synopsis !== undefined ? { synopsis: input.synopsis } : {}),
      ...(input.releaseYear !== undefined ? { releaseYear: input.releaseYear } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.genreIds !== undefined ? { genres: { set: input.genreIds.map((id) => ({ id })) } } : {}),
    },
    select: { id: true, slug: true, title: true, synopsis: true, releaseYear: true, status: true, genres: { select: { id: true, name: true, slug: true } } },
  });
  return updated;
};

export const renameEpisode = async (episodeId: string, title: string) => {
  const episode = await prisma.episode.findUnique({ where: { id: episodeId }, select: { id: true } });
  if (!episode) throw new ApiError(404, "Épisode introuvable");
  return prisma.episode.update({
    where: { id: episodeId },
    data: { title },
    select: { id: true, number: true, title: true },
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
