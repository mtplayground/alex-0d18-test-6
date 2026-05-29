import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Express } from 'express';
import express from 'express';

const currentDir = dirname(fileURLToPath(import.meta.url));

export const frontendDistPath = resolve(currentDir, '../../../frontend/dist');

export const mountFrontendStatic = (app: Express): void => {
  app.use(
    express.static(frontendDistPath, {
      index: 'index.html',
      fallthrough: true,
    }),
  );
};
