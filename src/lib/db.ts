import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { SCHEMA_SQL } from "./schema";

declare global {
  var meetWithYouDb: DatabaseSync | undefined;
}

function databasePath() {
  const configured = process.env.DATABASE_PATH?.trim();
  if (!configured) return path.join(process.cwd(), "data", "meet-with-you.db");
  if (path.isAbsolute(configured)) return configured;
  return path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function getDb() {
  if (!global.meetWithYouDb) {
    const file = databasePath();
    mkdirSync(path.dirname(file), { recursive: true });
    const db = new DatabaseSync(file);
    db.exec(SCHEMA_SQL);
    global.meetWithYouDb = db;
  }
  return global.meetWithYouDb;
}

export function queryAll<T>(sql: string, params: SQLInputValue[] = []) {
  return getDb().prepare(sql).all(...params) as T[];
}

export function queryOne<T>(sql: string, params: SQLInputValue[] = []) {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, params: SQLInputValue[] = []) {
  const result = getDb().prepare(sql).run(...params);
  return { changes: Number(result.changes), lastInsertRowid: Number(result.lastInsertRowid) };
}

export function transaction<T>(work: () => T) {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
