import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/errors.js";
import { getVideoDuration, resolveManagedStoragePath, scanFilmDirectory, type FilmDirectoryScan } from "./media.upload.js";
import type { z } from "zod";
import type { createMediaBodySchema, mediaGenresQuerySchema, mediaListQuerySchema } from "./media.schemas.js";

type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
type MediaGenresQuery = z.infer<typeof mediaGenresQuerySchema>;
type CreateMediaBody = z.infer<typeof createMediaBodySchema>;
type ViewerRole = "standard" | "admin" | undefined;

type CreateMediaInput = CreateMediaBody & {
  videoPath?: string;
  posterPath?: string;
};

const genreSelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.GenreSelect;

const mediaCardSelect = {
  id: true,
  catalogIndex: true,
  slug: true,
  title: true,
  synopsis: true,
  type: true,
  status: true,
  releaseYear: true,
  durationMinutes: true,
  videoPath: true,
  posterPath: true,
  backdropPath: true,
  createdAt: true,
  genres: {
    select: genreSelect,
  },
} satisfies Prisma.MediaSelect;

const mediaDetailSelect = {
  ...mediaCardSelect,
  updatedAt: true,
} satisfies Prisma.MediaSelect;

type MediaCardRecord = Prisma.MediaGetPayload<{
  select: typeof mediaCardSelect;
}>;

type MediaDetailRecord = Prisma.MediaGetPayload<{
  select: typeof mediaDetailSelect;
}>;

const mapMediaCard = (media: MediaCardRecord) => ({
  id: media.id,
  catalogIndex: media.catalogIndex,
  slug: media.slug,
  title: media.title,
  synopsis: media.synopsis,
  type: media.type,
  status: media.status,
  releaseYear: media.releaseYear,
  durationMinutes: media.durationMinutes,
  hasVideo: Boolean(media.videoPath),
  hasPoster: Boolean(media.posterPath),
  hasBackdrop: Boolean(media.backdropPath),
  createdAt: media.createdAt,
  genres: media.genres,
});

const resolveStatusFilter = (
  requestedStatus: MediaListQuery["status"] | MediaGenresQuery["status"] | undefined,
  viewerRole: ViewerRole,
) => {
  if (viewerRole !== "admin") {
    return "published" as const;
  }

  return requestedStatus ?? "all";
};

const buildCatalogWhere = (query: MediaListQuery, viewerRole: ViewerRole) => {
  const statusFilter = resolveStatusFilter(query.status, viewerRole);

  return ({
    type: query.type,
    ...(statusFilter !== "all"
      ? {
          status: statusFilter,
        }
      : {}),
    ...(query.search
      ? {
          title: {
            contains: query.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(query.genre
      ? {
          genres: {
            some: {
              slug: query.genre,
            },
          },
        }
      : {}),
  }) satisfies Prisma.MediaWhereInput;
};

export const listCatalogMedia = async (query: MediaListQuery, viewerRole?: ViewerRole) => {
  const resolvedStatus = resolveStatusFilter(query.status, viewerRole);
  const where = buildCatalogWhere(query, viewerRole);
  const records = await prisma.media.findMany({
    where,
    select: mediaCardSelect,
    take: query.limit + 1,
    ...(query.cursor
      ? {
          skip: 1,
          cursor: {
            catalogIndex: query.cursor,
          },
        }
      : {}),
    orderBy: {
      catalogIndex: "desc",
    },
  });

  const hasMore = records.length > query.limit;
  const items = hasMore ? records.slice(0, query.limit) : records;
  const nextCursor = hasMore ? items.at(-1)?.catalogIndex ?? null : null;

  return {
    items: items.map(mapMediaCard),
    pageInfo: {
      hasMore,
      nextCursor,
      limit: query.limit,
    },
    filters: {
      type: query.type,
      search: query.search ?? null,
      genre: query.genre ?? null,
      status: resolvedStatus,
    },
  };
};

export const listCatalogGenres = async (
  query: MediaGenresQuery,
  viewerRole?: ViewerRole,
) => {
  const statusFilter = resolveStatusFilter(query.status, viewerRole);
  const genreMediaWhere = {
    type: query.type,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  } satisfies Prisma.MediaWhereInput;

  const genres = await prisma.genre.findMany({
    where: {
      medias: {
        some: genreMediaWhere,
      },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          medias: {
            where: genreMediaWhere,
          },
        },
      },
    },
  });

  return {
    items: genres.map((genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      mediaCount: genre._count.medias,
    })),
  };
};

export const getCatalogHome = async () => {
  const [recentRecords, genreRecords] = await Promise.all([
    prisma.media.findMany({
      where: {
        status: "published",
        type: "film",
      },
      select: mediaCardSelect,
      take: 7,
      orderBy: {
        catalogIndex: "desc",
      },
    }),
    prisma.genre.findMany({
      where: {
        medias: {
          some: {
            type: "film",
            status: "published",
          },
        },
      },
      orderBy: {
        medias: {
          _count: "desc",
        },
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            medias: {
              where: {
                type: "film",
                status: "published",
              },
            },
          },
        },
      },
    }),
  ]);

  const [spotlight, ...recent] = recentRecords.map(mapMediaCard);

  return {
    spotlight: spotlight ?? null,
    recent,
    genres: genreRecords.map((genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      mediaCount: genre._count.medias,
    })),
  };
};

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const createMedia = async (input: CreateMediaInput) => {
  const baseSlug = slugify(input.title);
  let slug = baseSlug;

  for (let attempt = 1; ; attempt++) {
    const existing = await prisma.media.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${attempt}`;
  }

  // Auto-detect duration from video file if not provided
  let durationMinutes = input.durationMinutes;
  if (!durationMinutes && input.videoPath) {
    try {
      const absPath = resolveManagedStoragePath(input.videoPath);
      durationMinutes = getVideoDuration(absPath) ?? undefined;
    } catch {
      // Ignore path resolution errors — duration stays null
    }
  }

  const media = await prisma.media.create({
    data: {
      slug,
      title: input.title,
      synopsis: input.synopsis,
      type: "film",
      status: input.status,
      releaseYear: input.releaseYear,
      durationMinutes,
      videoPath: input.videoPath,
      posterPath: input.posterPath,
      ...(input.genreIds?.length
        ? { genres: { connect: input.genreIds.map((id) => ({ id })) } }
        : {}),
    },
    select: mediaDetailSelect,
  });

  return {
    ...mapMediaCard(media),
    updatedAt: media.updatedAt,
  };
};

export const importFilmFromDirectory = async (
  dirPath: string,
  input: {
    title: string;
    synopsis: string;
    status: "draft" | "published" | "archived";
    releaseYear?: number;
    genreIds?: string[];
  },
) => {
  const scan = scanFilmDirectory(dirPath);

  if (!scan.videoRelativePath) {
    throw new ApiError(400, "Aucun fichier VIDEO trouvé dans ce répertoire (attendu : VIDEO.mp4 ou similaire)");
  }

  const absVideoPath = resolveManagedStoragePath(scan.videoRelativePath);
  const durationMinutes = getVideoDuration(absVideoPath) ?? undefined;

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
      type: "film",
      status: input.status,
      releaseYear: input.releaseYear,
      durationMinutes,
      videoPath: scan.videoRelativePath,
      posterPath: scan.posterRelativePath ?? undefined,
      filmDirPath: dirPath,
      ...(input.genreIds?.length
        ? { genres: { connect: input.genreIds.map((id) => ({ id })) } }
        : {}),
    },
    select: mediaDetailSelect,
  });

  return {
    media: { ...mapMediaCard(media), updatedAt: media.updatedAt },
    scan,
  };
};

export const updateFilmMeta = async (
  slug: string,
  input: {
    title?: string;
    synopsis?: string;
    releaseYear?: number | null;
    status?: "draft" | "published" | "archived";
    genreIds?: string[];
    dirPath?: string | null;
  },
) => {
  const media = await prisma.media.findFirst({ where: { slug, type: "film" } });
  if (!media) throw new ApiError(404, "Film introuvable");

  let scan: FilmDirectoryScan | null = null;
  const dirUpdate: {
    videoPath?: string;
    posterPath?: string | null;
    durationMinutes?: number | null;
    filmDirPath?: string;
  } = {};

  if (input.dirPath) {
    scan = scanFilmDirectory(input.dirPath);
    if (!scan.videoRelativePath) {
      throw new ApiError(400, "Aucun fichier VIDEO trouvé dans ce répertoire");
    }
    const absVideoPath = resolveManagedStoragePath(scan.videoRelativePath);
    dirUpdate.videoPath = scan.videoRelativePath;
    dirUpdate.posterPath = scan.posterRelativePath;
    dirUpdate.durationMinutes = getVideoDuration(absVideoPath);
    dirUpdate.filmDirPath = input.dirPath;
  }

  const updated = await prisma.media.update({
    where: { slug },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.synopsis !== undefined ? { synopsis: input.synopsis } : {}),
      ...(input.releaseYear !== undefined ? { releaseYear: input.releaseYear } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...dirUpdate,
      ...(input.genreIds !== undefined ? { genres: { set: input.genreIds.map((id) => ({ id })) } } : {}),
    },
    select: { id: true, slug: true, title: true },
  });

  return { media: updated, scan };
};

export const getMediaDetail = async (slug: string, viewerRole?: ViewerRole) => {
  const media = await prisma.media.findFirst({
    where: {
      slug,
      ...(viewerRole === "admin" ? {} : { status: "published" }),
    },
    select: mediaDetailSelect,
  });

  if (!media) {
    throw new ApiError(404, "Media not found");
  }

  const related = await prisma.media.findMany({
    where: {
      id: {
        not: media.id,
      },
      status: "published",
      type: media.type,
      genres: {
        some: {
          slug: {
            in: media.genres.map((genre) => genre.slug),
          },
        },
      },
    },
    select: mediaCardSelect,
    take: 4,
    orderBy: {
      catalogIndex: "desc",
    },
  });

  const detail = mapMediaCard(media);

  return {
    item: {
      ...detail,
      updatedAt: media.updatedAt,
      stats: {
        genreCount: media.genres.length,
        catalogPosition: media.catalogIndex,
      },
    },
    related: related.map(mapMediaCard),
  };
};
