"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.openDb = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
// Open database connection
async function openDb() {
    return (0, sqlite_1.open)({
        filename: path_1.default.join(__dirname, '../../data/database.sqlite'),
        driver: sqlite3_1.default.Database
    });
}
exports.openDb = openDb;
// For backward compatibility, create a db object that mimics better-sqlite3
exports.db = {
    exec: async (sql) => {
        const database = await openDb();
        await database.exec(sql);
        await database.close();
    },
    prepare: (sql) => {
        // This is a simplified wrapper - you may need to adjust based on your usage
        return {
            run: async (...params) => {
                const database = await openDb();
                const stmt = await database.prepare(sql);
                const result = await stmt.run(...params);
                await database.close();
                return result;
            },
            get: async (...params) => {
                const database = await openDb();
                const stmt = await database.prepare(sql);
                const result = await stmt.get(...params);
                await database.close();
                return result;
            },
            all: async (...params) => {
                const database = await openDb();
                const stmt = await database.prepare(sql);
                const result = await stmt.all(...params);
                await database.close();
                return result;
            }
        };
    }
};
exports.default = exports.db;
