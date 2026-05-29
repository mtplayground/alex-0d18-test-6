import { z } from 'zod';
import {
  HttpError,
  createValidationError,
  serializeHttpError,
} from '../errors.js';

describe('HTTP error serialization', () => {
  it('serializes expected HTTP errors with status, code, and details', () => {
    const error = new HttpError(429, 'Too many requests.', 'RATE_LIMITED', [
      {
        message: 'Slow down.',
        path: ['nickname'],
      },
    ]);

    expect(serializeHttpError(error)).toEqual({
      body: {
        code: 'RATE_LIMITED',
        details: [
          {
            message: 'Slow down.',
            path: ['nickname'],
          },
        ],
        error: 'Too many requests.',
      },
      logLevel: 'warn',
      status: 429,
    });
  });

  it('maps validation errors to structured client responses', () => {
    const schema = z.object({
      nickname: z.string().min(1),
    });
    const parsed = schema.safeParse({
      nickname: '',
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(
        serializeHttpError(
          createValidationError('Invalid score submission.', parsed.error),
        ),
      ).toMatchObject({
        body: {
          code: 'VALIDATION_ERROR',
          details: [
            {
              path: ['nickname'],
            },
          ],
          error: 'Invalid score submission.',
        },
        logLevel: 'warn',
        status: 400,
      });
    }
  });

  it('hides unexpected error details behind a stable response', () => {
    expect(serializeHttpError(new Error('database failed'))).toEqual({
      body: {
        code: 'INTERNAL_SERVER_ERROR',
        error: 'Internal Server Error',
      },
      logLevel: 'error',
      status: 500,
    });
  });
});
