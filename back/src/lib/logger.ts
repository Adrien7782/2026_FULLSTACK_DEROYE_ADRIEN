import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createLogger, format, transports } from "winston";
import type TransportStream from "winston-transport";
import { env } from "../config/env.js";

const buildConsoleFormat = () => {
  if (env.NODE_ENV === "development") {
    return format.combine(
      format.colorize(),
      format.timestamp(),
      format.printf(({ level, message, timestamp, ...meta }) => {
        const metadata = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} ${level}: ${message}${metadata}`;
      }),
    );
  }

  return format.json();
};

const loggerTransports: TransportStream[] = [
  new transports.Console({ format: buildConsoleFormat() }),
];

if (env.LOGS_FILE) {
  const directory = dirname(env.LOGS_FILE);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  loggerTransports.push(
    new transports.File({
      filename: env.LOGS_FILE,
      format: format.json(),
    }),
  );
}

export const logger = createLogger({
  level: env.LOG_LEVEL,
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.splat()),
  transports: loggerTransports,
});
