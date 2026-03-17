import { Router } from "express";
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
  const payload = await listCatalogMedia(query);

  res.status(200).json(payload);
});

mediaRouter.get("/home", async (_req, res) => {
  const payload = await getCatalogHome();

  res.status(200).json(payload);
});

mediaRouter.get("/genres", async (req, res) => {
  const query = mediaGenresQuerySchema.parse(req.query);
  const payload = await listCatalogGenres(query);

  res.status(200).json(payload);
});

mediaRouter.get("/:slug/poster", async (req, res) => {
  const params = mediaSlugParamsSchema.parse(req.params);
  await sendPosterAsset(params.slug, res);
});

mediaRouter.get("/:slug/stream", async (req, res) => {
  const params = mediaSlugParamsSchema.parse(req.params);
  await sendVideoStream(params.slug, req, res);
});

mediaRouter.get("/:slug", async (req, res) => {
  const params = mediaSlugParamsSchema.parse(req.params);
  const payload = await getMediaDetail(params.slug);

  res.status(200).json(payload);
});
