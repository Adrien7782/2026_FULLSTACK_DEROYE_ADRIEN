import { performance } from "node:perf_hooks";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = performance.now();

  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - startedAt);

    logger.info("HTTP request completed", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
    });
  });

  next();
};
