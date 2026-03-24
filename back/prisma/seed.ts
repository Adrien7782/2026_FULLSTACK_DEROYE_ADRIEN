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

const series = [
  {
    slug: "arcadia",
    title: "Arcadia",
    synopsis:
      "Dans une cite futuriste gouvernee par une IA toute-puissante, un groupe de rebelles tente de recuperer le libre arbitre humain avant que la memoire collective ne soit effacee.",
    releaseYear: 2022,
    genres: ["science-fiction", "thriller", "drame"],
    seasons: [
      {
        number: 1,
        title: "L'Eveil",
        synopsis: "Les protagonistes decouvrent l'existence du projet Arcadia.",
        episodes: [
          { number: 1, title: "Memoire zero", durationMinutes: 48 },
          { number: 2, title: "Le signal perdu", durationMinutes: 52 },
          { number: 3, title: "Fracture", durationMinutes: 45 },
          { number: 4, title: "L'Archive interdite", durationMinutes: 50 },
          { number: 5, title: "Convergence", durationMinutes: 55 },
        ],
      },
      {
        number: 2,
        title: "La Resistance",
        synopsis: "La rebellion s'organise face a la surveillance totale.",
        episodes: [
          { number: 1, title: "Exil", durationMinutes: 47 },
          { number: 2, title: "Nuit blanche", durationMinutes: 51 },
          { number: 3, title: "Le protocole Omega", durationMinutes: 54 },
          { number: 4, title: "Trahison", durationMinutes: 46 },
          { number: 5, title: "Arcadia brule", durationMinutes: 62 },
        ],
      },
    ],
  },
  {
    slug: "les-labyrinthes",
    title: "Les Labyrinthes",
    synopsis:
      "Une detective obsessionnelle enquete sur une serie de disparitions dans une ville cotiere ou chaque habitant semble cacher un secret inavouable.",
    releaseYear: 2021,
    genres: ["thriller", "mystere", "drame"],
    seasons: [
      {
        number: 1,
        title: "Les Disparus",
        synopsis: "La detective Vera est appelee sur une affaire qui va bouleverser sa vie.",
        episodes: [
          { number: 1, title: "Maree basse", durationMinutes: 50 },
          { number: 2, title: "Sous la surface", durationMinutes: 48 },
          { number: 3, title: "Le temoignage", durationMinutes: 52 },
          { number: 4, title: "Pierres et silences", durationMinutes: 49 },
          { number: 5, title: "Le labyrinthe de sel", durationMinutes: 56 },
          { number: 6, title: "Verite froide", durationMinutes: 58 },
        ],
      },
    ],
  },
  {
    slug: "nova-rangers",
    title: "Nova Rangers",
    synopsis:
      "Une escouade interstellaire composee d'humains et d'aliens doit empecher la propagation d'un virus qui transforme ses victimes en armes de guerre.",
    releaseYear: 2023,
    genres: ["science-fiction", "aventure"],
    seasons: [
      {
        number: 1,
        title: null,
        synopsis: null,
        episodes: [
          { number: 1, title: "Premier contact", durationMinutes: 42 },
          { number: 2, title: "La quarantaine", durationMinutes: 44 },
          { number: 3, title: "Alliance fragile", durationMinutes: 41 },
          { number: 4, title: "Mutation", durationMinutes: 46 },
        ],
      },
    ],
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

  // ── Séries ──────────────────────────────────────────────────────────────────
  for (const serie of series) {
    // Upsert le média
    const media = await prisma.media.upsert({
      where: { slug: serie.slug },
      update: {
        title: serie.title,
        synopsis: serie.synopsis,
        type: "series",
        status: "published",
        releaseYear: serie.releaseYear,
        genres: {
          set: [],
          connect: serie.genres.map((s) => ({ slug: s })),
        },
      },
      create: {
        slug: serie.slug,
        title: serie.title,
        synopsis: serie.synopsis,
        type: "series",
        status: "published",
        releaseYear: serie.releaseYear,
        genres: {
          connect: serie.genres.map((s) => ({ slug: s })),
        },
        serie: { create: {} },
      },
      select: { id: true, serie: { select: { id: true } } },
    });

    // Crée le noeud Serie si absent (migration d'une entrée existante)
    let serieId = media.serie?.id;
    if (!serieId) {
      const created = await prisma.serie.create({
        data: { mediaId: media.id },
        select: { id: true },
      });
      serieId = created.id;
    }

    // Saisons et épisodes
    for (const season of serie.seasons) {
      const dbSeason = await prisma.season.upsert({
        where: { serieId_number: { serieId, number: season.number } },
        update: { title: season.title, synopsis: season.synopsis },
        create: {
          serieId,
          number: season.number,
          title: season.title,
          synopsis: season.synopsis,
        },
        select: { id: true },
      });

      for (const ep of season.episodes) {
        await prisma.episode.upsert({
          where: { seasonId_number: { seasonId: dbSeason.id, number: ep.number } },
          update: { title: ep.title, durationMinutes: ep.durationMinutes, status: "published" },
          create: {
            seasonId: dbSeason.id,
            number: ep.number,
            title: ep.title,
            durationMinutes: ep.durationMinutes,
            status: "published",
            videoPath: null,
          },
        });
      }
    }
  }

  // ── Films ────────────────────────────────────────────────────────────────────
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
