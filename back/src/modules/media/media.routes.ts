import { Router } from "express";

export const mediaRouter = Router();

mediaRouter.get("/", (_req, res) => {
  res.status(200).json({
    module: "media",
    status: "scaffolded",
  });
});
