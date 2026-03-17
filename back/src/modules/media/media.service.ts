import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/errors.js";
import type { z } from "zod";
import type { mediaGenresQuerySchema, mediaListQuerySchema } from "./media.schemas.js";

type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
type MediaGenresQuery = z.infer<typeof mediaGenresQuerySchema>;

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
  releaseYear: true,
  durationMinutes: true,
  posterUrl: true,
  backdropUrl: true,
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
  releaseYear: media.releaseYear,
  durationMinutes: media.durationMinutes,
  posterUrl: media.posterUrl,
  backdropUrl: media.backdropUrl,
  createdAt: media.createdAt,
  genres: media.genres,
});

const buildPublishedWhere = (query: MediaListQuery) =>
  ({
    status: "published",
    type: query.type,
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

export const listCatalogMedia = async (query: MediaListQuery) => {
  const where = buildPublishedWhere(query);
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
    },
  };
};

export const listCatalogGenres = async (query: MediaGenresQuery) => {
  const genres = await prisma.genre.findMany({
    where: {
      medias: {
        some: {
          type: query.type,
          status: "published",
        },
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
            where: {
              type: query.type,
              status: "published",
            },
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

export const getMediaDetail = async (slug: string) => {
  const media = await prisma.media.findFirst({
    where: {
      slug,
      status: "published",
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
