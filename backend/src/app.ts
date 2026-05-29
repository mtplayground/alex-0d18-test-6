import type { ErrorRequestHandler, RequestHandler } from 'express';
import express from 'express';
import { healthRouter } from './routes/health.js';
import { scoresRouter } from './routes/scores.js';
import { mountFrontendStatic } from './static/frontend.js';

const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: 'Not Found',
  });
};

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  console.error(error);

  response.status(500).json({
    error: 'Internal Server Error',
  });
};

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
