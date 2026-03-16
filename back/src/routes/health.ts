import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      ok: true,
      service: "streamady-back",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
