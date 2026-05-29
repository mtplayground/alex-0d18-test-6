import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';

export type ErrorDetail = {
  message: string;
  path: Array<number | string>;
};

export type ErrorResponseBody = {
  code?: string;
  details?: ErrorDetail[];
  error: string;
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export type SerializedHttpError = {
  body: ErrorResponseBody;
  logLevel: 'error' | 'warn';
  status: number;
};

export const createValidationError = (
  message: string,
  error: z.ZodError,
): HttpError =>
  new HttpError(
    400,
    message,
    'VALIDATION_ERROR',
    error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path,
    })),
  );

export const serializeHttpError = (error: unknown): SerializedHttpError => {
  if (error instanceof HttpError) {
    return {
      body: {
        ...(error.code ? { code: error.code } : {}),
        ...(error.details?.length ? { details: error.details } : {}),
        error: error.message,
      },
      logLevel: error.status >= 500 ? 'error' : 'warn',
      status: error.status,
    };
  }

  if (error instanceof z.ZodError) {
    return serializeHttpError(createValidationError('Invalid request.', error));
  }

  return {
    body: {
      code: 'INTERNAL_SERVER_ERROR',
      error: 'Internal Server Error',
    },
    logLevel: 'error',
    status: 500,
  };
};

export const notFoundHandler: RequestHandler = (request, response) => {
  logger.warn('HTTP route not found.', {
    method: request.method,
    path: request.originalUrl,
  });
  response.status(404).json({
    code: 'NOT_FOUND',
    error: 'Not Found',
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  _next,
) => {
  const serializedError = serializeHttpError(error);
  const logFields = {
    code: serializedError.body.code,
    errorName: error instanceof Error ? error.name : typeof error,
    method: request.method,
    path: request.originalUrl,
    status: serializedError.status,
  };

  if (serializedError.logLevel === 'error') {
    logger.error('HTTP request failed.', {
      ...logFields,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn('HTTP request rejected.', logFields);
  }

  response.status(serializedError.status).json(serializedError.body);
};
