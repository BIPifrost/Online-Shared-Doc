import type { Server as HttpServer } from "node:http";
import {
  YJS_WEBSOCKET_PATH,
  createYjsWebSocketServer,
  handleYjsUpgrade
} from "../modules/yjs/index.js";
import { logger } from "../services/logger.js";

export function attachYjsWebsocketServer(httpServer: HttpServer) {
  const wss = createYjsWebSocketServer();

  httpServer.on("upgrade", (request, socket, head) => {
    handleYjsUpgrade(wss, request, socket, head);
  });

  logger.info("Yjs collaboration service attached", {
    module: "yjs",
    path: YJS_WEBSOCKET_PATH
  });

  return wss;
}
