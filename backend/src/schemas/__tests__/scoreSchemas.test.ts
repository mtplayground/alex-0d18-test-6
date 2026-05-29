import { z } from 'zod';
import { SCORE_SERVICE_LIMITS } from '../../services/scoreService.js';
import {
  ListScoresQuerySchema,
  SubmitScoreRequestSchema,
} from '../scoreSchemas.js';

describe('SubmitScoreRequestSchema', () => {
  it('trims nickname and defaults optional level and duration fields', () => {
    expect(
      SubmitScoreRequestSchema.parse({
        nickname: '  Ace  ',
        score: 1200,
      }),
    ).toEqual({
      durationMs: 0,
      highestLevel: SCORE_SERVICE_LIMITS.minLevel,
      nickname: 'Ace',
      score: 1200,
    });
  });

  it('uses highestLevel over level when both are present', () => {
    expect(
      SubmitScoreRequestSchema.parse({
        durationMs: 90000,
        highestLevel: 3,
        level: 2,
        nickname: 'Ace',
        score: 1200,
      }),
    ).toEqual({
      durationMs: 90000,
      highestLevel: 3,
      nickname: 'Ace',
      score: 1200,
    });
  });

  it.each([
    {
      field: 'nickname',
      payload: {
        nickname: '',
        score: 100,
      },
    },
    {
      field: 'nickname',
      payload: {
        nickname: 'a'.repeat(SCORE_SERVICE_LIMITS.maxNicknameLength + 1),
        score: 100,
      },
    },
    {
      field: 'score',
      payload: {
        nickname: 'Ace',
        score: SCORE_SERVICE_LIMITS.maxScore + 1,
      },
    },
    {
      field: 'score',
      payload: {
        nickname: 'Ace',
        score: 100.5,
      },
    },
    {
      field: 'level',
      payload: {
        level: SCORE_SERVICE_LIMITS.totalLevels + 1,
        nickname: 'Ace',
        score: 100,
      },
    },
    {
      field: 'durationMs',
      payload: {
        durationMs: SCORE_SERVICE_LIMITS.maxDurationMs + 1,
        nickname: 'Ace',
        score: 100,
      },
    },
  ])('rejects invalid $field values', ({ field, payload }) => {
    expect(() => SubmitScoreRequestSchema.parse(payload)).toThrow(z.ZodError);

    const result = SubmitScoreRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain(field);
    }
  });
});

describe('ListScoresQuerySchema', () => {
  it.each([
    {
      expected: {},
      query: {},
    },
    {
      expected: {
        level: undefined,
      },
      query: {
        level: '',
      },
    },
    {
      expected: {
        level: 2,
      },
      query: {
        level: '2',
      },
    },
  ])('parses optional level query %#', ({ expected, query }) => {
    expect(ListScoresQuerySchema.parse(query)).toEqual(expected);
  });

  it.each([
    {
      level: '0',
    },
    {
      level: `${SCORE_SERVICE_LIMITS.totalLevels + 1}`,
    },
    {
      level: 'abc',
    },
    {
      level: '2.5',
    },
  ])('rejects invalid level query %#', (query) => {
    expect(() => ListScoresQuerySchema.parse(query)).toThrow(z.ZodError);
  });
});
