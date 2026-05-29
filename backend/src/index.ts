import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadConfig, type RuntimeConfig } from './config/env.js';
import { logger } from './lib/logger.js';

const loadRuntimeConfig = (): RuntimeConfig => {
  try {
    return loadConfig();
  } catch (error) {
    logger.error('Backend environment configuration is invalid.', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
};

const config = loadRuntimeConfig();
const app = createApp();
const server = createServer(app);

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error('Backend server port is already in use.', {
      host: config.host,
      port: config.port,
    });
  } else {
    logger.error('Backend server failed.', {
      message: error.message,
      stack: error.stack,
    });
  }

  process.exit(1);
});

server.listen(config.port, config.host, () => {
  logger.info('Backend server listening.', {
    host: config.host,
    nodeEnv: config.nodeEnv,
    port: config.port,
  });
});

const shutdown = (signal: NodeJS.Signals): void => {
  logger.info('Backend server shutting down.', {
    signal,
  });

  server.close((error) => {
    if (error) {
      logger.error('Backend server shutdown failed.', {
        message: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }

    logger.info('Backend server shutdown complete.', {
      signal,
    });
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
