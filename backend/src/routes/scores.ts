import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import {
  ListScoresQuerySchema,
  SubmitScoreRequestSchema,
} from '../schemas/scoreSchemas.js';
import { logger } from '../lib/logger.js';
import { HttpError, createValidationError } from '../middleware/errors.js';
import { ScoreService, ScoreServiceError } from '../services/scoreService.js';

export const scoresRouter = Router();

const scoreService = new ScoreService(prisma);

scoresRouter.get(
  '/',
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const query = ListScoresQuerySchema.parse(request.query);
      const result = await scoreService.listTopScores(query);
      logger.info('Leaderboard scores listed.', {
        count: result.entries.length,
        level: query.level ?? 'all',
      });

      response.json({
        entries: result.entries.map((entry) => ({
          createdAt: entry.createdAt,
          durationMs: entry.durationMs,
          highestLevel: entry.highestLevel,
          id: entry.id,
          level: entry.level,
          nickname: entry.nickname,
          rank: entry.rank,
          score: entry.score,
        })),
      });
    } catch (error) {
      handleScoreRouteError(error, next, 'Invalid score request.');
    }
  },
);

scoresRouter.post(
  '/',
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const submission = SubmitScoreRequestSchema.parse(request.body);
      const result = await scoreService.submitScore({
        ...submission,
        ipAddress: getRequestIp(request),
      });
      logger.info('Score submitted.', {
        highestLevel: result.entry.highestLevel,
        rank: result.entry.rank,
        score: result.entry.score,
      });

      response.status(201).json({
        entry: {
          createdAt: result.entry.createdAt,
          durationMs: result.entry.durationMs,
          highestLevel: result.entry.highestLevel,
          id: result.entry.id,
          level: result.entry.level,
          nickname: result.entry.nickname,
          rank: result.entry.rank,
          score: result.entry.score,
        },
      });
    } catch (error) {
      handleScoreRouteError(error, next, 'Invalid score submission.');
    }
  },
);

const handleScoreRouteError = (
  error: unknown,
  next: NextFunction,
  validationMessage: string,
): void => {
  if (error instanceof z.ZodError) {
    next(createValidationError(validationMessage, error));
    return;
  }

  if (error instanceof ScoreServiceError) {
    next(new HttpError(getScoreServiceStatus(error), error.message, error.code));
    return;
  }

  next(error);
};

const getRequestIp = (request: Request): string => {
  const forwardedFor = request.header('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.ip || request.socket.remoteAddress || 'unknown';
};

const getScoreServiceStatus = (error: ScoreServiceError): number => {
  if (error.code === 'RATE_LIMITED') {
    return 429;
  }

  return 400;
};
