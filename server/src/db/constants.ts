import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

export const DATA_DIRECTORY = path.resolve(currentDirectory, "../../data");
export const DATABASE_PATH =
  process.env.APP_DB_PATH && process.env.APP_DB_PATH.trim()
    ? path.resolve(process.env.APP_DB_PATH)
    : path.join(DATA_DIRECTORY, "app.db");
