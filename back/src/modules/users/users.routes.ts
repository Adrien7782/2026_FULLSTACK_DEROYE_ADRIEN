import { Router } from "express";

export const usersRouter = Router();

usersRouter.get("/", (_req, res) => {
  res.status(200).json({
    module: "users",
    status: "scaffolded",
  });
});
