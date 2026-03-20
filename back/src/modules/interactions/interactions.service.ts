import { prisma } from "../../lib/prisma.js";

// ─── Favoris ────────────────────────────────────────────────────────────────

export const toggleFavorite = async (userId: string, mediaId: string) => {
  const existing = await prisma.favorite.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }
  await prisma.favorite.create({ data: { userId, mediaId } });
  return { favorited: true };
};

export const listFavorites = async (userId: string) => {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      media: {
        select: {
          id: true, slug: true, title: true, type: true, releaseYear: true,
          durationMinutes: true, posterPath: true, status: true,
        },
      },
    },
  });
  return rows.map((r) => ({ ...r.media, favoritedAt: r.createdAt }));
};

export const getFavoriteStatus = async (userId: string, mediaId: string) => {
  const row = await prisma.favorite.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
  });
  return { favorited: !!row };
};

// ─── Watchlist ───────────────────────────────────────────────────────────────

export const toggleWatchlist = async (userId: string, mediaId: string) => {
  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
  });
  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    return { inWatchlist: false };
  }
  await prisma.watchlistItem.create({ data: { userId, mediaId } });
  return { inWatchlist: true };
};

export const listWatchlist = async (userId: string) => {
  const rows = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      media: {
        select: {
          id: true, slug: true, title: true, type: true, releaseYear: true,
          durationMinutes: true, posterPath: true, status: true,
        },
      },
    },
  });
  return rows.map((r) => ({ ...r.media, addedAt: r.createdAt }));
};

export const getWatchlistStatus = async (userId: string, mediaId: string) => {
  const row = await prisma.watchlistItem.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
  });
  return { inWatchlist: !!row };
};

// ─── Notes ──────────────────────────────────────────────────────────────────

export const upsertRating = async (userId: string, mediaId: string, value: number) => {
  const rating = await prisma.rating.upsert({
    where: { userId_mediaId: { userId, mediaId } },
    create: { userId, mediaId, value },
    update: { value },
  });
  return rating;
};

export const deleteRating = async (userId: string, mediaId: string) => {
  await prisma.rating.deleteMany({ where: { userId, mediaId } });
};

export const getRating = async (userId: string, mediaId: string) => {
  const row = await prisma.rating.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
  });
  return { value: row?.value ?? null };
};

export const listMediaRatings = async (mediaSlug: string) => {
  const rows = await prisma.rating.findMany({
    where: { media: { slug: mediaSlug } },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  return rows.map((r) => ({
    userId: r.user.id,
    username: r.user.username,
    avatarUrl: r.user.avatarUrl ?? null,
    value: r.value,
    updatedAt: r.updatedAt,
  }));
};

export const getMediaAverageRating = async (mediaId: string) => {
  const result = await prisma.rating.aggregate({
    where: { mediaId },
    _avg: { value: true },
    _count: { value: true },
  });
  return { average: result._avg.value, count: result._count.value };
};

// ─── Playback ────────────────────────────────────────────────────────────────

export const upsertPlayback = async (
  userId: string,
  mediaId: string,
  positionSeconds: number,
  durationSeconds?: number,
) => {
  const completed = durationSeconds ? positionSeconds / durationSeconds >= 0.9 : false;
  return prisma.playbackProgress.upsert({
    where: { userId_mediaId: { userId, mediaId } },
    create: { userId, mediaId, positionSeconds, durationSeconds, completed },
    update: { positionSeconds, durationSeconds, completed },
  });
};

export const getPlayback = async (userId: string, mediaId: string) => {
  const row = await prisma.playbackProgress.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
  });
  return row ?? { positionSeconds: 0, durationSeconds: null, completed: false };
};

export const listHistory = async (userId: string) => {
  const rows = await prisma.playbackProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      media: {
        select: {
          id: true, slug: true, title: true, type: true, releaseYear: true,
          durationMinutes: true, posterPath: true, status: true,
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.media.id,
    slug: r.media.slug,
    title: r.media.title,
    type: r.media.type,
    releaseYear: r.media.releaseYear,
    durationMinutes: r.media.durationMinutes,
    status: r.media.status,
    hasPoster: !!r.media.posterPath,
    positionSeconds: r.positionSeconds,
    durationSeconds: r.durationSeconds,
    completed: r.completed,
    watchedAt: r.updatedAt,
  }));
};
