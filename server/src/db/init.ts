import { DATABASE_PATH } from "./constants.js";
import { openDatabase } from "./connection.js";
import { initializeSchema } from "./schema.js";
import { logger } from "../services/logger.js";

export function initializeDatabase() {
  try {
    const database = openDatabase();
    initializeSchema(database);

    logger.info("Database initialized", {
      module: "database",
      path: DATABASE_PATH
    });

    return database;
  } catch (error) {
    logger.error("Database initialization failed", {
      module: "database",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
