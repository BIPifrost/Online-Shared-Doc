import { createBackendServer } from "./app/createBackendServer.js";
import { getPort } from "./config/env.js";
import { initializeDatabase } from "./db/index.js";
import { logger } from "./services/logger.js";

const port = getPort();
initializeDatabase();
const { httpServer: server } = createBackendServer();

server.listen(port, () => {
  logger.info("Server started", {
    module: "bootstrap",
    port
  });
});

server.on("error", (error) => {
  logger.error("Server failed to start", {
    module: "bootstrap",
    error: error instanceof Error ? error.message : String(error)
  });
  process.exitCode = 1;
});
