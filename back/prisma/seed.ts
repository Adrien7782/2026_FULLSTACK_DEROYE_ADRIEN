import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the catalog");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const genres = [
  { name: "Science-Fiction", slug: "science-fiction" },
  { name: "Aventure", slug: "aventure" },
  { name: "Drame", slug: "drame" },
  { name: "Thriller", slug: "thriller" },
  { name: "Animation", slug: "animation" },
  { name: "Mystere", slug: "mystere" },
];

const films = [
  {
    slug: "interstellar",
    title: "Interstellar",
    synopsis:
      "Dans un futur en crise, une equipe traverse un trou de ver pour trouver un nouveau foyer a l'humanite.",
    releaseYear: 2014,
    durationMinutes: 169,
    genres: ["science-fiction", "aventure", "drame"],
  },
  {
    slug: "arrival",
    title: "Arrival",
    synopsis:
      "Une linguiste tente d'etablir le dialogue avec des visiteurs extraterrestres avant qu'un conflit mondial n'eclate.",
    releaseYear: 2016,
    durationMinutes: 116,
    genres: ["science-fiction", "drame", "mystere"],
  },
  {
    slug: "prisoners",
    title: "Prisoners",
    synopsis:
      "Apres la disparition de deux fillettes, un pere et un inspecteur s'engagent dans une enquete sombre et obsessionnelle.",
    releaseYear: 2013,
    durationMinutes: 153,
    genres: ["thriller", "drame", "mystere"],
  },
  {
    slug: "spider-man-into-the-spider-verse",
    title: "Spider-Man: Into the Spider-Verse",
    synopsis:
      "Miles Morales decouvre qu'il n'est pas le seul Spider-Man et doit apprendre a prendre sa place parmi les heros.",
    releaseYear: 2018,
    durationMinutes: 117,
    genres: ["animation", "aventure", "science-fiction"],
  },
  {
    slug: "blade-runner-2049",
    title: "Blade Runner 2049",
    synopsis:
      "Un blade runner decouvre un secret ancien qui menace l'ordre fragile entre humains et replicants.",
    releaseYear: 2017,
    durationMinutes: 164,
    genres: ["science-fiction", "thriller", "drame"],
  },
  {
    slug: "the-prestige",
    title: "The Prestige",
    synopsis:
      "Deux illusionnistes rivaux s'affrontent dans une obsession de depassement ou chaque tour a un cout.",
    releaseYear: 2006,
    durationMinutes: 130,
    genres: ["drame", "thriller", "mystere"],
  },
];

async function seed() {
  for (const genre of genres) {
    await prisma.genre.upsert({
      where: {
        slug: genre.slug,
      },
      update: {
        name: genre.name,
      },
      create: genre,
    });
  }

  for (const film of films) {
    await prisma.media.upsert({
      where: {
        slug: film.slug,
      },
      update: {
        title: film.title,
        synopsis: film.synopsis,
        type: "film",
        status: "published",
        releaseYear: film.releaseYear,
        durationMinutes: film.durationMinutes,
        videoPath: null,
        posterPath: `posters/${film.slug}.svg`,
        backdropPath: null,
        genres: {
          set: [],
          connect: film.genres.map((slug) => ({ slug })),
        },
      },
      create: {
        slug: film.slug,
        title: film.title,
        synopsis: film.synopsis,
        type: "film",
        status: "published",
        releaseYear: film.releaseYear,
        durationMinutes: film.durationMinutes,
        videoPath: null,
        posterPath: `posters/${film.slug}.svg`,
        backdropPath: null,
        genres: {
          connect: film.genres.map((slug) => ({ slug })),
        },
      },
    });
  }
}

seed()
  .then(async () => {
    console.info("[seed] catalog seeded");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[seed] failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
