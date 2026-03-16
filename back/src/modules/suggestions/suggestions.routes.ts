import { Router } from "express";

export const suggestionsRouter = Router();

suggestionsRouter.get("/", (_req, res) => {
  res.status(200).json({
    module: "suggestions",
    status: "scaffolded",
  });
});
