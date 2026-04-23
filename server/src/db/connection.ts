import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { DATABASE_PATH } from "./constants.js";

let database: Database.Database | null = null;

export function openDatabase() {
  if (database) {
    return database;
  }

  mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });

  database = new Database(DATABASE_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = OFF");

  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("Database has not been initialized yet.");
  }

  return database;
}

export function closeDatabase() {
  if (database) {
    database.close();
    database = null;
  }
}
