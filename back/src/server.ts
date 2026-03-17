import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const server = createServer(app);

const shutdown = async (signal: string) => {
  logger.info("Received shutdown signal", { signal });

  await prisma.$disconnect();

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10_000).unref();
};

const startServer = async () => {
  await prisma.$connect();

  server.listen(env.PORT, () => {
    logger.info("Server listening", {
      url: `http://localhost:${env.PORT}`,
      nodeEnv: env.NODE_ENV,
    });
  });
};

startServer().catch(async (error) => {
  logger.error("Server failed to start", {
    error,
  });
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
