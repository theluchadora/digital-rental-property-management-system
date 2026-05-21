import "dotenv/config";
import app from "./app";
import { initWebSocket } from "./websocket/wsServer";
import http from "http";
import { startCronJobs } from "./jobs/cron";
import logger from "./utils/logger";

const server = http.createServer(app);
initWebSocket(server);
startCronJobs();

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});