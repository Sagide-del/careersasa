import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Open database connection
export async function openDb() {
  return open({
    filename: path.join(__dirname, '../../data/database.sqlite'),
    driver: sqlite3.Database
  });
}

// For backward compatibility, create a db object that mimics better-sqlite3
export const db = {
  exec: async (sql: string) => {
    const database = await openDb();
    await database.exec(sql);
    await database.close();
  },
  prepare: (sql: string) => {
    // This is a simplified wrapper - you may need to adjust based on your usage
    return {
      run: async (...params: any[]) => {
        const database = await openDb();
        const stmt = await database.prepare(sql);
        const result = await stmt.run(...params);
        await database.close();
        return result;
      },
      get: async (...params: any[]) => {
        const database = await openDb();
        const stmt = await database.prepare(sql);
        const result = await stmt.get(...params);
        await database.close();
        return result;
      },
      all: async (...params: any[]) => {
        const database = await openDb();
        const stmt = await database.prepare(sql);
        const result = await stmt.all(...params);
        await database.close();
        return result;
      }
    };
  }
};

export default db;
