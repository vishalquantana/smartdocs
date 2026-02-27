import { createApp } from './app.js';
import { config, validateConfig } from './config.js';
import { runMigrations } from './db/migrate.js';

async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Run database migrations
    await runMigrations();

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.port, () => {
      console.log(`\n🚀 SmartDocs server running on http://localhost:${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
