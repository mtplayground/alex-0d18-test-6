import {
  SCORE_SERVICE_LIMITS,
  ScoreService,
  ScoreServiceError,
  type ScorePrismaClient,
  type ScoreRecord,
} from '../scoreService.js';

type MockScorePrismaClient = {
  score: {
    count: jest.Mock<
      Promise<number>,
      Parameters<ScorePrismaClient['score']['count']>
    >;
    create: jest.Mock<
      Promise<ScoreRecord>,
      Parameters<ScorePrismaClient['score']['create']>
    >;
  };
};

const NOW = new Date('2026-05-29T12:00:00.000Z');

const createMockPrisma = (): MockScorePrismaClient => ({
  score: {
    count: jest.fn<
      Promise<number>,
      Parameters<ScorePrismaClient['score']['count']>
    >(),
    create: jest.fn<
      Promise<ScoreRecord>,
      Parameters<ScorePrismaClient['score']['create']>
    >(),
  },
});

const createService = (prisma = createMockPrisma()): ScoreService =>
  new ScoreService(prisma, {
    now: () => NOW,
  });

describe('ScoreService', () => {
  it('normalizes valid score input, stores it through Prisma, and returns rank', async () => {
    const prisma = createMockPrisma();
    const service = createService(prisma);
    const createdAt = new Date('2026-05-29T12:00:01.000Z');

    prisma.score.count.mockResolvedValueOnce(1).mockResolvedValueOnce(7);
    prisma.score.create.mockResolvedValueOnce({
      createdAt,
      id: 'score-1',
      level: 2,
      nickname: 'Ace',
      score: 1200,
    });

    await expect(
      service.submitScore({
        clientId: ' player-1 ',
        level: 2.9,
        nickname: '  Ace  ',
        score: 1200.75,
      }),
    ).resolves.toEqual({
      entry: {
        createdAt,
        id: 'score-1',
        level: 2,
        nickname: 'Ace',
        rank: 8,
        score: 1200,
      },
    });
    expect(prisma.score.count).toHaveBeenNthCalledWith(1, {
      where: {
        clientId: 'player-1',
        createdAt: {
          gte: new Date(NOW.getTime() - SCORE_SERVICE_LIMITS.rateLimitWindowMs),
        },
      },
    });
    expect(prisma.score.create).toHaveBeenCalledWith({
      data: {
        clientId: 'player-1',
        level: 2,
        nickname: 'Ace',
        score: 1200,
      },
    });
    expect(prisma.score.count).toHaveBeenNthCalledWith(2, {
      where: {
        level: 2,
        OR: [
          {
            score: {
              gt: 1200,
            },
          },
          {
            createdAt: {
              lt: createdAt,
            },
            score: 1200,
          },
        ],
      },
    });
  });

  it.each([
    {
      code: 'INVALID_NICKNAME',
      input: {
        nickname: '',
        score: 100,
      },
    },
    {
      code: 'INVALID_NICKNAME',
      input: {
        nickname: 'a'.repeat(SCORE_SERVICE_LIMITS.maxNicknameLength + 1),
        score: 100,
      },
    },
    {
      code: 'INVALID_SCORE',
      input: {
        nickname: 'Ace',
        score: -1,
      },
    },
    {
      code: 'INVALID_LEVEL',
      input: {
        level: SCORE_SERVICE_LIMITS.totalLevels + 1,
        nickname: 'Ace',
        score: 100,
      },
    },
  ])('rejects invalid input with $code', async ({ code, input }) => {
    const prisma = createMockPrisma();
    const service = createService(prisma);

    await expect(service.submitScore(input)).rejects.toMatchObject({
      code,
    });
    expect(prisma.score.create).not.toHaveBeenCalled();
    expect(prisma.score.count).not.toHaveBeenCalled();
  });

  it('rejects scores above the configured maximum before hitting Prisma', async () => {
    const prisma = createMockPrisma();
    const service = createService(prisma);

    await expect(
      service.submitScore({
        nickname: 'Ace',
        score: SCORE_SERVICE_LIMITS.maxScore + 1,
      }),
    ).rejects.toBeInstanceOf(ScoreServiceError);
    await expect(
      service.submitScore({
        nickname: 'Ace',
        score: SCORE_SERVICE_LIMITS.maxScore + 1,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_SCORE',
    });
    expect(prisma.score.count).not.toHaveBeenCalled();
    expect(prisma.score.create).not.toHaveBeenCalled();
  });

  it('rate-limits repeated submissions from the same client', async () => {
    const prisma = createMockPrisma();
    const service = createService(prisma);

    prisma.score.count.mockResolvedValueOnce(
      SCORE_SERVICE_LIMITS.maxSubmissionsPerWindow,
    );

    await expect(
      service.submitScore({
        clientId: 'player-1',
        nickname: 'Ace',
        score: 100,
      }),
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    expect(prisma.score.count).toHaveBeenCalledWith({
      where: {
        clientId: 'player-1',
        createdAt: {
          gte: new Date(NOW.getTime() - SCORE_SERVICE_LIMITS.rateLimitWindowMs),
        },
      },
    });
    expect(prisma.score.create).not.toHaveBeenCalled();
  });

  it('skips rate-limit checks when no client id is supplied', async () => {
    const prisma = createMockPrisma();
    const service = createService(prisma);
    const createdAt = new Date('2026-05-29T12:00:01.000Z');

    prisma.score.count.mockResolvedValueOnce(0);
    prisma.score.create.mockResolvedValueOnce({
      createdAt,
      id: 'score-1',
      level: 1,
      nickname: 'Ace',
      score: 100,
    });

    await expect(
      service.submitScore({
        nickname: 'Ace',
        score: 100,
      }),
    ).resolves.toMatchObject({
      entry: {
        rank: 1,
      },
    });
    expect(prisma.score.count).toHaveBeenCalledTimes(1);
    expect(prisma.score.count).toHaveBeenCalledWith({
      where: {
        level: 1,
        OR: expect.any(Array),
      },
    });
    expect(prisma.score.create).toHaveBeenCalledWith({
      data: {
        clientId: null,
        level: 1,
        nickname: 'Ace',
        score: 100,
      },
    });
  });
});
