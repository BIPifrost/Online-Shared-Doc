import { createServer } from "node:http";
import { createApp } from "./createApp.js";
import { createRealtimeServer } from "../sockets/index.js";
import { attachYjsWebsocketServer } from "../websocket/index.js";

export function createBackendServer() {
  const app = createApp();
  const httpServer = createServer(app);
  const io = createRealtimeServer(httpServer);
  const yjs = attachYjsWebsocketServer(httpServer);

  return {
    app,
    httpServer,
    io,
    yjs
  };
}
