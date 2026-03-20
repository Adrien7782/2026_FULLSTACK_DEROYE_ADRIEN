import { Router } from "express";
import { listMediaRatings } from "../interactions/interactions.service.js";
import {
  getCatalogHome,
  getMediaDetail,
  listCatalogGenres,
  listCatalogMedia,
} from "./media.service.js";
import { sendPosterAsset, sendVideoStream } from "./media.storage.js";
import {
  mediaGenresQuerySchema,
  mediaListQuerySchema,
  mediaSlugParamsSchema,
} from "./media.schemas.js";

export const mediaRouter = Router();

mediaRouter.get("/", async (req, res) => {
  const query = mediaListQuerySchema.parse(req.query);
  const payload = await listCatalogMedia(query, req.auth?.user.role);

  res.status(200).json(payload);
});

mediaRouter.get("/home", async (_req, res) => {
  const payload = await getCatalogHome();

  res.status(200).json(payload);
});

mediaRouter.get("/genres", async (req, res) => {
  const query = mediaGenresQuerySchema.parse(req.query);
  const payload = await listCatalogGenres(query, req.auth?.user.role);

  res.status(200).json(payload);
});

mediaRouter.get("/:slug/poster", async (req, res) => {
  const params = mediaSlugParamsSchema.parse(req.params);
  await sendPosterAsset(params.slug, res, req.auth?.user.role);
});

mediaRouter.get("/:slug/stream", async (req, res) => {
  const params = mediaSlugParamsSchema.parse(req.params);
  await sendVideoStream(params.slug, req, res, req.auth?.user.role);
});

mediaRouter.get("/:slug/ratings", async (req, res) => {
  const { slug } = mediaSlugParamsSchema.parse(req.params);
  const ratings = await listMediaRatings(slug);
  res.json({ ratings });
});

mediaRouter.get("/:slug", async (req, res) => {
  const params = mediaSlugParamsSchema.parse(req.params);
  const payload = await getMediaDetail(params.slug, req.auth?.user.role);

  res.status(200).json(payload);
});
