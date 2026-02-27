import express from 'express';
import { join, resolve } from 'path';
import { config } from './config.js';

const clientDir = resolve(import.meta.dirname, '..', 'client');

export function createApp() {
  const app = express();

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static file serving for storage
  app.use('/storage', express.static(config.storageDir));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes will be added here
  // app.use('/api/projects', projectsRouter);
  // app.use('/api/jobs', jobsRouter);

  // Landing page at root
  const landingPage = resolve(import.meta.dirname, '..', '..', 'home.html');
  app.get('/', (_req, res) => {
    res.sendFile(landingPage);
  });

  // Serve built React app under /app
  app.use('/app', express.static(clientDir));
  app.get('/app/*', (_req, res) => {
    res.sendFile(join(clientDir, 'index.html'));
  });

  // Error handling
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
