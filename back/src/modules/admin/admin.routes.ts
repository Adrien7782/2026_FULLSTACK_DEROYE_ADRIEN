import { Router } from "express";

export const adminRouter = Router();

adminRouter.get("/", (_req, res) => {
  res.status(200).json({
    module: "admin",
    status: "scaffolded",
  });
});
