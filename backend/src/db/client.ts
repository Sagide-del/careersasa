import Database from "better-sqlite3";

const SQLITE_PATH = process.env.SQLITE_PATH || "./data/careersasa.db";
export const db = new Database(SQLITE_PATH);

db.pragma("journal_mode = WAL");
