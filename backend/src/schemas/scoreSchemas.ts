import { z } from 'zod';
import { SCORE_SERVICE_LIMITS } from '../services/scoreService.js';

const IntegerRange = (
  min: number,
  max: number,
  fieldName: string,
): z.ZodNumber =>
  z
    .number({
      invalid_type_error: `${fieldName} must be a number.`,
      required_error: `${fieldName} is required.`,
    })
    .int(`${fieldName} must be an integer.`)
    .min(min, `${fieldName} must be at least ${min}.`)
    .max(max, `${fieldName} must be at most ${max}.`);

export const SubmitScoreRequestSchema = z
  .object({
    durationMs: IntegerRange(
      0,
      SCORE_SERVICE_LIMITS.maxDurationMs,
      'durationMs',
    ).optional(),
    highestLevel: IntegerRange(
      SCORE_SERVICE_LIMITS.minLevel,
      SCORE_SERVICE_LIMITS.totalLevels,
      'highestLevel',
    ).optional(),
    level: IntegerRange(
      SCORE_SERVICE_LIMITS.minLevel,
      SCORE_SERVICE_LIMITS.totalLevels,
      'level',
    ).optional(),
    nickname: z
      .string({
        invalid_type_error: 'nickname must be a string.',
        required_error: 'nickname is required.',
      })
      .trim()
      .min(1, 'nickname must be at least 1 character.')
      .max(
        SCORE_SERVICE_LIMITS.maxNicknameLength,
        `nickname must be at most ${SCORE_SERVICE_LIMITS.maxNicknameLength} characters.`,
      ),
    score: IntegerRange(
      SCORE_SERVICE_LIMITS.minScore,
      SCORE_SERVICE_LIMITS.maxScore,
      'score',
    ),
  })
  .transform((value) => ({
    durationMs: value.durationMs ?? 0,
    highestLevel:
      value.highestLevel ?? value.level ?? SCORE_SERVICE_LIMITS.minLevel,
    nickname: value.nickname,
    score: value.score,
  }));

export type SubmitScoreRequest = z.infer<typeof SubmitScoreRequestSchema>;
