import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import {
  UPLOAD_MAX_IMAGE_BYTES,
  UPLOAD_MAX_VIDEO_BYTES,
  mediaUpload,
  validateReferencedMediaPath,
} from "../media/media.upload.js";
import { createMediaBodySchema } from "../media/media.schemas.js";
import { createMedia } from "../media/media.service.js";
import {
  listAllSuggestions,
  updateSuggestionStatus,
} from "../suggestions/suggestions.service.js";

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

adminRouter.post(
  "/media",
  mediaUpload.fields([
    { name: "video", maxCount: 1 },
    { name: "poster", maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const videoFile = files?.["video"]?.[0];
    const posterFile = files?.["poster"]?.[0];

    try {
      if (videoFile && videoFile.size > UPLOAD_MAX_VIDEO_BYTES) {
        throw new ApiError(
          400,
          `Vidéo trop grande. Maximum: ${env.UPLOAD_MAX_VIDEO_MB} Mo`,
        );
      }
      if (posterFile && posterFile.size > UPLOAD_MAX_IMAGE_BYTES) {
        throw new ApiError(
          400,
          `Image trop grande. Maximum: ${env.UPLOAD_MAX_IMAGE_MB} Mo`,
        );
      }

      const rawGenreIds: unknown = req.body.genreIds;
      const genreIds =
        typeof rawGenreIds === "string" && rawGenreIds.length > 0
          ? (JSON.parse(rawGenreIds) as string[])
          : Array.isArray(rawGenreIds)
            ? (rawGenreIds as string[])
            : undefined;

      const body = createMediaBodySchema.parse({
        title: req.body.title,
        synopsis: req.body.synopsis,
        releaseYear: req.body.releaseYear ? Number(req.body.releaseYear) : undefined,
        durationMinutes: req.body.durationMinutes ? Number(req.body.durationMinutes) : undefined,
        genreIds,
        status: req.body.status,
      });

      const rawVideoSourceMode =
        typeof req.body.videoSourceMode === "string" ? req.body.videoSourceMode : "reference";
      const rawPosterSourceMode =
        typeof req.body.posterSourceMode === "string" ? req.body.posterSourceMode : "reference";
      const videoSourceMode = rawVideoSourceMode === "upload" ? "upload" : "reference";
      const posterSourceMode = rawPosterSourceMode === "upload" ? "upload" : "reference";
      const rawVideoPath = typeof req.body.videoPath === "string" ? req.body.videoPath : "";
      const rawPosterPath = typeof req.body.posterPath === "string" ? req.body.posterPath : "";

      if (videoSourceMode === "reference" && videoFile) {
        await unlink(videoFile.path).catch(() => {});
      }

      if (posterSourceMode === "reference" && posterFile) {
        await unlink(posterFile.path).catch(() => {});
      }

      if (!videoFile && videoSourceMode !== "reference") {
        throw new ApiError(400, "Le fichier video est obligatoire.");
      }

      if (!videoFile && !rawVideoPath.trim()) {
        throw new ApiError(400, "Renseigne un chemin video local ou importe un fichier.");
      }

      if (!posterFile && !rawPosterPath.trim()) {
        throw new ApiError(400, "Renseigne un chemin d'affiche local ou importe un fichier.");
      }

      if (!posterFile && posterSourceMode !== "reference") {
        throw new ApiError(400, "Le fichier affiche est obligatoire.");
      }

      const videoPath =
        videoSourceMode === "upload"
          ? videoFile
            ? `videos/${videoFile.filename}`
            : undefined
          : validateReferencedMediaPath(rawVideoPath, "video");

      const posterPath =
        posterSourceMode === "upload"
          ? posterFile
            ? `posters/${posterFile.filename}`
            : undefined
          : rawPosterPath.trim()
            ? validateReferencedMediaPath(rawPosterPath, "poster")
            : undefined;

      const media = await createMedia({ ...body, videoPath, posterPath });

      res.status(201).json({ media });
    } catch (error) {
      if (videoFile) await unlink(videoFile.path).catch(() => {});
      if (posterFile) await unlink(posterFile.path).catch(() => {});
      throw error;
    }
  },
);

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

// ─── Suppression média ────────────────────────────────────────────────────────

adminRouter.delete("/media/:slug", async (req, res) => {
  const { slug } = req.params;
  const media = await prisma.media.findUnique({ where: { slug } });
  if (!media) throw new ApiError(404, "Média introuvable");

  // Suppression des fichiers physiques (non bloquante)
  if (media.videoPath) {
    await unlink(join(env.DATA_DIRECTORY, media.videoPath)).catch(() => {});
  }
  if (media.posterPath) {
    await unlink(join(env.DATA_DIRECTORY, media.posterPath)).catch(() => {});
  }

  // Suppression en base (cascade sur favoris, watchlist, notes, playback)
  await prisma.media.delete({ where: { slug } });

  res.status(204).end();
});
