import "dotenv/config";
import app from "./app";
import { initWebSocket } from "./websocket/wsServer";
import http from "http";
import { startCronJobs } from "./jobs/cron";

const server = http.createServer(app);
initWebSocket(server);
startCronJobs();

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});