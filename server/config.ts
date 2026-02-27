import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
loadEnv();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),

  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Gemini configuration
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',

  // Paths
  storageDir: resolve(process.env.STORAGE_DIR || './storage'),
  databasePath: resolve(process.env.DATABASE_PATH || './data/smartdocs.db'),

  // Turso database
  tursoUrl: process.env.TURSO_URL || '',
  tursoKey: process.env.TURSO_KEY || '',

  // Video processing
  silenceThreshold: parseFloat(process.env.SILENCE_THRESHOLD || '-30'),
  silenceMinDuration: parseFloat(process.env.SILENCE_MIN_DURATION || '1.5'),
};

// Validate required configuration
export function validateConfig() {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  console.log('Configuration loaded:');
  console.log(`  - Port: ${config.port}`);
  console.log(`  - Storage: ${config.storageDir}`);
  console.log(`  - Database: ${config.databasePath}`);
  console.log(`  - Gemini model: ${config.geminiModel}`);
}
