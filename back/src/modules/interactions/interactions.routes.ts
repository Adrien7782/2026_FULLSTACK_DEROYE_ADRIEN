import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../../lib/errors.js";
import {
  toggleFavorite, listFavorites, getFavoriteStatus,
  toggleWatchlist, listWatchlist, getWatchlistStatus,
  upsertRating, deleteRating, getRating, getMediaAverageRating,
  upsertPlayback, getPlayback, listHistory,
} from "./interactions.service.js";

export const interactionsRouter = Router();

const mediaIdSchema = z.string().uuid("mediaId invalide");
const ratingBodySchema = z.object({ value: z.number().int().min(1).max(5) });
const playbackBodySchema = z.object({
  positionSeconds: z.number().min(0),
  durationSeconds: z.number().positive().optional(),
});

// ─── Favoris ────────────────────────────────────────────────────────────────

interactionsRouter.post("/favorites/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const result = await toggleFavorite(req.auth!.user.id, mediaId);
  res.json(result);
});

interactionsRouter.get("/favorites", async (req, res) => {
  const items = await listFavorites(req.auth!.user.id);
  res.json({ items });
});

interactionsRouter.get("/favorites/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const result = await getFavoriteStatus(req.auth!.user.id, mediaId);
  res.json(result);
});

// ─── Watchlist ───────────────────────────────────────────────────────────────

interactionsRouter.post("/watchlist/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const result = await toggleWatchlist(req.auth!.user.id, mediaId);
  res.json(result);
});

interactionsRouter.get("/watchlist", async (req, res) => {
  const items = await listWatchlist(req.auth!.user.id);
  res.json({ items });
});

interactionsRouter.get("/watchlist/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const result = await getWatchlistStatus(req.auth!.user.id, mediaId);
  res.json(result);
});

// ─── Notes ──────────────────────────────────────────────────────────────────

interactionsRouter.put("/ratings/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const { value } = ratingBodySchema.parse(req.body);
  const rating = await upsertRating(req.auth!.user.id, mediaId, value);
  res.json({ value: rating.value });
});

interactionsRouter.delete("/ratings/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  await deleteRating(req.auth!.user.id, mediaId);
  res.status(204).end();
});

interactionsRouter.get("/ratings/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const result = await getRating(req.auth!.user.id, mediaId);
  res.json(result);
});

interactionsRouter.get("/ratings/:mediaId/average", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const result = await getMediaAverageRating(mediaId);
  res.json(result);
});

// ─── Playback ────────────────────────────────────────────────────────────────

interactionsRouter.put("/playback/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const { positionSeconds, durationSeconds } = playbackBodySchema.parse(req.body);
  await upsertPlayback(req.auth!.user.id, mediaId, positionSeconds, durationSeconds);
  res.status(204).end();
});

interactionsRouter.get("/playback/:mediaId", async (req, res) => {
  const mediaId = mediaIdSchema.parse(req.params.mediaId);
  const result = await getPlayback(req.auth!.user.id, mediaId);
  res.json(result);
});

interactionsRouter.get("/history", async (req, res) => {
  const items = await listHistory(req.auth!.user.id);
  res.json({ items });
});
