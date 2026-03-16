import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/api.js";
import { docsRouter } from "./routes/docs.js";
import { healthRouter } from "./routes/health.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(helmet());
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
  console.error("Unhandled application error", error);

  res.status(500).json({
    message: "Internal server error",
  });
});
