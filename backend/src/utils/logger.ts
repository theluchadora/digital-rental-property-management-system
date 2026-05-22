import type { Request, Response, NextFunction } from "express";
import pino from "pino";
import pinoHttp from "pino-http";

const isProduction = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
});

/** Logs the moment a request hits the server (before body parsing / handlers). */
export const incomingRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const path = req.originalUrl || req.url;
  const start = Date.now();

  logger.info(
    { method: req.method, path, ip: req.ip },
    `→ ${req.method} ${path}`
  );

  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level](
      { method: req.method, path, status: res.statusCode, ms: Date.now() - start },
      `← ${req.method} ${path} ${res.statusCode} (${Date.now() - start}ms)`
    );
  });

  next();
};

export const httpLogger = pinoHttp({
  logger,
  autoLogging: false,
});

export default logger;
