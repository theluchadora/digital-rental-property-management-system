import "dotenv/config";
import app from "./app";
import { initWebSocket } from "./websocket/wsServer";
import http from "http";
import { startCronJobs } from "./jobs/cron";
import logger from "./utils/logger";

const server = http.createServer(app);
initWebSocket(server);
startCronJobs();

const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.fatal(
      { port: PORT },
      `Port ${PORT} is already in use. Stop the other process or change PORT in backend/.env`
    );
  } else {
    logger.fatal({ err }, "Server failed to start");
  }
  process.exit(1);
});

server.listen(PORT, () => {
  logger.info({ port: PORT }, `Server listening on http://localhost:${PORT}`);
  logger.info("API base: /api/v1  |  Health: GET /api/v1/health");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});
