import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { config } from '../config.js';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

// Ensure database directory exists
await mkdir(dirname(config.databasePath), { recursive: true });

// Create SQLite connection
const sqlite = new Database(config.databasePath);
sqlite.pragma('journal_mode = WAL');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

export * from './schema.js';
