import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";
import { Router } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../lib/errors.js";
import {
  episodeParamsSchema,
  saveEpisodeProgressSchema,
  seriesSlugParamsSchema,
} from "./series.schemas.js";
import {
  getEpisode,
  getEpisodeProgress,
  getSeriesDetail,
  getSerieResumeEpisode,
  saveEpisodeProgress,
} from "./series.service.js";

export const seriesRouter = Router();

seriesRouter.get("/:slug/resume", async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Non authentifié");
  const { slug } = seriesSlugParamsSchema.parse(req.params);
  const episodeId = await getSerieResumeEpisode(slug, req.auth.user.id);
  res.json({ episodeId });
});

seriesRouter.get("/:slug", async (req, res) => {
  const { slug } = seriesSlugParamsSchema.parse(req.params);
  const detail = await getSeriesDetail(slug, req.auth?.user.role);
  res.json(detail);
});

seriesRouter.get("/episodes/:id", async (req, res) => {
  const { id } = episodeParamsSchema.parse(req.params);
  const episode = await getEpisode(id, req.auth?.user.role);
  res.json({ episode });
});

seriesRouter.get("/episodes/:id/stream", async (req, res) => {
  const { id } = episodeParamsSchema.parse(req.params);
  const episode = await getEpisode(id, req.auth?.user.role);

  if (!episode.videoPath) throw new ApiError(404, "Aucun fichier vidéo disponible");

  const filePath = join(env.DATA_DIRECTORY, episode.videoPath);
  let stat: ReturnType<typeof statSync>;
  try {
    stat = statSync(filePath);
  } catch {
    throw new ApiError(404, "Fichier vidéo introuvable sur le disque");
  }

  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    });
    createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });
    createReadStream(filePath).pipe(res);
  }
});

seriesRouter.get("/episodes/:id/progress", async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Non authentifié");
  const { id } = episodeParamsSchema.parse(req.params);
  const progress = await getEpisodeProgress(req.auth.user.id, id);
  res.json({ progress });
});

seriesRouter.post("/episodes/:id/progress", async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Non authentifié");
  const { id } = episodeParamsSchema.parse(req.params);
  const body = saveEpisodeProgressSchema.parse(req.body);
  await saveEpisodeProgress(
    req.auth.user.id,
    id,
    body.positionSeconds,
    body.durationSeconds,
    body.completed,
  );
  res.status(204).end();
});
