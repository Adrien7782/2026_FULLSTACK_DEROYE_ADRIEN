import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import {
  validateReferencedMediaPath,
  resolveManagedStoragePath,
  scanFilmDirectory,
} from "../media/media.upload.js";
import { createMediaBodySchema } from "../media/media.schemas.js";
import { createMedia, importFilmFromDirectory, updateFilmMeta } from "../media/media.service.js";
import {
  listAllSuggestions,
  updateSuggestionStatus,
} from "../suggestions/suggestions.service.js";
import {
  createSeriesBodySchema,
} from "../series/series.schemas.js";
import {
  createSeries,
  scanSeriesDirectory,
  importSeriesFromDirectory,
  refreshSeriesFromDirectory,
  renameSeason,
  renameEpisode,
  updateSeriesMeta,
} from "../series/series.service.js";

export const adminRouter = Router();

adminRouter.get("/", (req, res) => {
  res.status(200).json({
    module: "admin",
    status: "protected",
    message: `Admin access granted for ${req.auth?.user.username ?? "unknown user"}`,
  });
});

adminRouter.post("/media/validate-path", (req, res) => {
  const rawPath = typeof req.body?.path === "string" ? req.body.path : "";
  const kind = req.body?.kind === "poster" ? "poster" : "video";

  try {
    const normalizedPath = validateReferencedMediaPath(rawPath, kind);
    res.status(200).json({
      found: true,
      message: "Element trouve",
      normalizedPath,
    });
  } catch {
    res.status(200).json({
      found: false,
      message: "Aucun element trouve",
      normalizedPath: null,
    });
  }
});

// Preview a file from DATA_DIRECTORY (admin only — used for poster preview before creation)
adminRouter.get("/preview-asset", (req, res) => {
  const rawPath = typeof req.query.path === "string" ? req.query.path : "";
  if (!rawPath) throw new ApiError(400, "Paramètre path requis");

  const absolutePath = resolveManagedStoragePath(rawPath);
  if (!existsSync(absolutePath)) throw new ApiError(404, "Fichier introuvable");
  if (!statSync(absolutePath).isFile()) throw new ApiError(400, "Pas un fichier");

  const ext = extname(absolutePath).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  };
  res.setHeader("Content-Type", contentTypeMap[ext] ?? "application/octet-stream");
  res.setHeader("Cache-Control", "private, max-age=60");
  createReadStream(absolutePath).pipe(res);
});

adminRouter.post("/media", async (req, res) => {
  const body = createMediaBodySchema.parse({
    title: req.body.title,
    synopsis: req.body.synopsis,
    releaseYear: req.body.releaseYear ? Number(req.body.releaseYear) : undefined,
    genreIds: req.body.genreIds,
    status: req.body.status,
  });

  const rawVideoPath = typeof req.body.videoPath === "string" ? req.body.videoPath.trim() : "";
  const rawPosterPath = typeof req.body.posterPath === "string" ? req.body.posterPath.trim() : "";

  if (!rawVideoPath) throw new ApiError(400, "Le chemin vidéo est obligatoire.");

  const videoPath = validateReferencedMediaPath(rawVideoPath, "video");
  const posterPath = rawPosterPath ? validateReferencedMediaPath(rawPosterPath, "poster") : undefined;

  const media = await createMedia({ ...body, videoPath, posterPath });
  res.status(201).json({ media });
});

// ─── Films ────────────────────────────────────────────────────────────────────

// Get film admin info (filmDirPath)
adminRouter.get("/films/:slug", async (req, res) => {
  const { slug } = req.params;
  const media = await prisma.media.findFirst({
    where: { slug, type: "film" },
    select: { filmDirPath: true },
  });
  if (!media) throw new ApiError(404, "Film introuvable");
  res.json({ filmDirPath: media.filmDirPath });
});

// Scan a film directory path
adminRouter.post("/films/scan-path", (req, res) => {
  const { dirPath } = z.object({ dirPath: z.string().trim().min(1) }).parse(req.body);
  const scan = scanFilmDirectory(dirPath);
  res.json({ scan });
});

// Import a film from a directory path (auto-scan)
adminRouter.post("/films/import-from-dir", async (req, res) => {
  const body = z.object({
    dirPath: z.string().trim().min(1),
    title: z.string().min(1).max(200),
    synopsis: z.string().min(1).max(2000),
    releaseYear: z.number().int().min(1888).max(2100).optional(),
    status: z.enum(["draft", "published", "archived"]).default("published"),
    genreIds: z.array(z.string().uuid()).optional(),
  }).parse(req.body);

  const result = await importFilmFromDirectory(body.dirPath, body);
  res.status(201).json(result);
});

// Update film metadata (+ optional new dir path)
adminRouter.patch("/films/:slug", async (req, res) => {
  const { slug } = req.params;
  const body = z.object({
    title: z.string().min(1).max(200).optional(),
    synopsis: z.string().min(1).max(2000).optional(),
    releaseYear: z.number().int().min(1888).max(2100).nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    genreIds: z.array(z.string().uuid()).optional(),
    dirPath: z.string().trim().min(1).nullable().optional(),
  }).parse(req.body);

  const result = await updateFilmMeta(slug, body);
  res.json(result);
});

// ─── Suggestions ─────────────────────────────────────────────────────────────

adminRouter.get("/suggestions", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const items = await listAllSuggestions(status);
  res.json({ items });
});

adminRouter.patch("/suggestions/:id", async (req, res) => {
  const { id } = req.params;
  const body = z.object({
    status: z.enum(["accepted", "refused", "processed"]),
    adminNote: z.string().trim().max(1000).optional(),
    mediaId: z.string().uuid().optional(),
  }).parse(req.body);
  const suggestion = await updateSuggestionStatus(id, body.status, body.adminNote, body.mediaId);
  res.json({ suggestion });
});

// ─── Utilisateurs ────────────────────────────────────────────────────────────

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, username: true, email: true, role: true,
      avatarUrl: true, createdAt: true,
      _count: { select: { favorites: true, ratings: true, suggestions: true } },
    },
  });
  res.json({ users });
});

adminRouter.patch("/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = z.object({ role: z.enum(["standard", "admin"]) }).parse(req.body);
  if (id === req.auth!.user.id) throw new ApiError(400, "Tu ne peux pas modifier ton propre rôle");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Utilisateur introuvable");
  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, username: true, email: true, role: true, avatarUrl: true, createdAt: true },
  });
  res.json({ user: updated });
});

// ─── Médias (liste admin complète) ───────────────────────────────────────────

adminRouter.get("/media", async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const medias = await prisma.media.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, title: true, type: true, status: true,
      releaseYear: true, durationMinutes: true, posterPath: true, createdAt: true,
      _count: { select: { favorites: true, ratings: true } },
    },
  });
  res.json({
    items: medias.map((m) => ({ ...m, hasPoster: !!m.posterPath, posterPath: undefined })),
  });
});

// ─── Séries ──────────────────────────────────────────────────────────────────

// Scan a directory path and return detected seasons/episodes structure
adminRouter.post("/series/scan-path", async (req, res) => {
  const { dirPath } = z.object({ dirPath: z.string().trim().min(1) }).parse(req.body);
  const scan = scanSeriesDirectory(dirPath);
  res.json({ scan });
});

// Import a series from a directory path (auto-scan)
adminRouter.post("/series/import-from-dir", async (req, res) => {
  const body = z.object({
    dirPath: z.string().trim().min(1),
    title: z.string().min(1).max(200),
    synopsis: z.string().min(1).max(2000),
    releaseYear: z.number().int().min(1888).max(2100).optional(),
    status: z.enum(["draft", "published", "archived"]).default("published"),
    genreIds: z.array(z.string().uuid()).optional(),
  }).parse(req.body);

  const result = await importSeriesFromDirectory(body.dirPath, body);
  res.status(201).json({ serie: result.media, scan: result.scan });
});

// Refresh series from stored directory path (add new seasons/episodes)
adminRouter.post("/series/:slug/refresh", async (req, res) => {
  const { slug } = req.params;
  const result = await refreshSeriesFromDirectory(slug);
  res.json(result);
});

// Rename a season
adminRouter.patch("/series/:slug/seasons/:seasonNumber", async (req, res) => {
  const { slug } = req.params;
  const seasonNumber = Number(req.params.seasonNumber);
  const { title } = z.object({ title: z.string().min(1).max(200) }).parse(req.body);
  const season = await renameSeason(slug, seasonNumber, title);
  res.json({ season });
});

// Rename an episode
adminRouter.patch("/episodes/:episodeId", async (req, res) => {
  const { episodeId } = req.params;
  const { title } = z.object({ title: z.string().min(1).max(200) }).parse(req.body);
  const episode = await renameEpisode(episodeId, title);
  res.json({ episode });
});

// Metadata-only series creation (legacy — series are now imported via /import-from-dir)
adminRouter.post("/series", async (req, res) => {
  const body = createSeriesBodySchema.parse({
    title: req.body.title,
    synopsis: req.body.synopsis,
    releaseYear: req.body.releaseYear ? Number(req.body.releaseYear) : undefined,
    status: req.body.status,
    genreIds: req.body.genreIds,
  });
  const serie = await createSeries({ ...body });
  res.status(201).json({ serie });
});

// Update series metadata
adminRouter.patch("/series/:slug", async (req, res) => {
  const { slug } = req.params;
  const body = z.object({
    title: z.string().min(1).max(200).optional(),
    synopsis: z.string().min(1).max(2000).optional(),
    releaseYear: z.number().int().min(1888).max(2100).nullable().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    genreIds: z.array(z.string().uuid()).optional(),
  }).parse(req.body);
  const serie = await updateSeriesMeta(slug, body);
  res.json({ serie });
});

// ─── Suppression média ────────────────────────────────────────────────────────

adminRouter.delete("/media/:slug", async (req, res) => {
  const { slug } = req.params;
  const media = await prisma.media.findUnique({ where: { slug } });
  if (!media) throw new ApiError(404, "Média introuvable");

  // Suppression en base uniquement — les fichiers restent sur le disque (gérés par l'utilisateur)
  await prisma.media.delete({ where: { slug } });

  res.status(204).end();
});
