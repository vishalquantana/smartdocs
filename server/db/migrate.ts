import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index.js';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, '../../drizzle');

/**
 * Run database migrations automatically on startup
 */
export async function runMigrations() {
  try {
    if (existsSync(migrationsFolder)) {
      console.log('Running database migrations...');
      migrate(db, { migrationsFolder });
      console.log('Migrations completed successfully');
    } else {
      console.log('No migrations folder found, skipping migrations');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
