import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadConfig } from './config/env.js';

const config = loadConfig();
const app = createApp();
const server = createServer(app);

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use.`);
  } else {
    console.error(error);
  }

  process.exit(1);
});

server.listen(config.port, config.host, () => {
  console.log(
    `Backend server listening on http://${config.host}:${config.port} in ${config.nodeEnv} mode.`,
  );
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`Received ${signal}; shutting down backend server.`);

  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
