import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { SubmitScoreRequestSchema } from '../schemas/scoreSchemas.js';
import { ScoreService, ScoreServiceError } from '../services/scoreService.js';

export const scoresRouter = Router();

const scoreService = new ScoreService(prisma);

scoresRouter.post(
  '/',
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const submission = SubmitScoreRequestSchema.parse(request.body);
      const result = await scoreService.submitScore({
        ...submission,
        ipAddress: getRequestIp(request),
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
      if (error instanceof z.ZodError) {
        response.status(400).json({
          details: error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path,
          })),
          error: 'Invalid score submission.',
        });
        return;
      }

      if (error instanceof ScoreServiceError) {
        response.status(getScoreServiceStatus(error)).json({
          code: error.code,
          error: error.message,
        });
        return;
      }

      next(error);
    }
  },
);

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
