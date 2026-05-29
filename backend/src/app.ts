import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { healthRouter } from './routes/health.js';
import { scoresRouter } from './routes/scores.js';
import { mountFrontendStatic } from './static/frontend.js';

export const createApp = (): express.Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use('/healthz', healthRouter);
  app.use('/api/scores', scoresRouter);
  mountFrontendStatic(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
