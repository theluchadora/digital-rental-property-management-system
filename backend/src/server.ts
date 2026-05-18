import "dotenv/config";
import app from "./app";
import { initWebSocket } from "./websocket/wsServer";
import http from "http";

const server = http.createServer(app);
initWebSocket(server);

server.listen(process.env.PORT || 8080, () => {
  console.log(`WebSocket Server running on port ${process.env.PORT || 8080}`);
});

const PORT = process.env.PORT || 8080;


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});