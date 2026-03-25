import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { ApiError, isApiError } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { requestLogger } from "./middleware/request-logger.js";
import { apiRouter } from "./routes/api.js";
import { docsRouter } from "./routes/docs.js";
import { healthRouter } from "./routes/health.js";

export const app = express();

app.disable("x-powered-by");

app.use(requestLogger);
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // Les routes de streaming HTTP Range génèrent des dizaines de requêtes par minute :
    // on les exclut du rate limiter pour ne pas bloquer la lecture vidéo.
    skip: (req) => req.path.endsWith("/stream"),
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use(healthRouter);
app.use(docsRouter);
app.use("/api", apiRouter);

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "StreamAdy backend is running",
    docs: "/docs",
  });
});

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isApiError(error)) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      details: error.flatten(),
    });
    return;
  }

  logger.error("Unhandled application error", {
    error,
  });

  res.status(500).json({
    message: "Internal server error",
  });
});
