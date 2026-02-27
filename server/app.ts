import express from 'express';
import { join } from 'path';
import { config } from './config.js';

export function createApp() {
  const app = express();

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static file serving for storage
  app.use('/storage', express.static(config.storageDir));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes will be added here
  // app.use('/api/projects', projectsRouter);
  // app.use('/api/jobs', jobsRouter);

  // Error handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
