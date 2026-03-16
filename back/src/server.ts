import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = createServer(app);

const shutdown = async (signal: string) => {
  console.info(`[server] received ${signal}, shutting down`);

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
    console.info(`[server] listening on http://localhost:${env.PORT}`);
  });
};

startServer().catch(async (error) => {
  console.error("[server] failed to start", error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
