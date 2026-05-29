import {
  SCORE_SERVICE_LIMITS,
  ScoreService,
  ScoreServiceError,
  type ScorePrismaClient,
  type ScoreRecord,
} from '../scoreService.js';

type MockScorePrismaClient = {
  leaderboardEntry: {
    count: jest.Mock<
      Promise<number>,
      Parameters<ScorePrismaClient['leaderboardEntry']['count']>
    >;
    create: jest.Mock<
      Promise<ScoreRecord>,
      Parameters<ScorePrismaClient['leaderboardEntry']['create']>
    >;
  };
};

const NOW = new Date('2026-05-29T12:00:00.000Z');
const IP_ADDRESS = '198.51.100.7';

const createMockPrisma = (): MockScorePrismaClient => ({
  leaderboardEntry: {
    count: jest.fn<
      Promise<number>,
      Parameters<ScorePrismaClient['leaderboardEntry']['count']>
    >(),
    create: jest.fn<
      Promise<ScoreRecord>,
      Parameters<ScorePrismaClient['leaderboardEntry']['create']>
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

    prisma.leaderboardEntry.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(7);
    prisma.leaderboardEntry.create.mockResolvedValueOnce({
      createdAt,
      durationMs: 91_000,
      highestLevel: 2,
      id: 'score-1',
      ipAddress: IP_ADDRESS,
      nickname: 'Ace',
      score: 1200,
    });

    await expect(
      service.submitScore({
        durationMs: 91_000.2,
        ipAddress: ` ${IP_ADDRESS} `,
        level: 2.9,
        nickname: '  Ace  ',
        score: 1200.75,
      }),
    ).resolves.toEqual({
      entry: {
        createdAt,
        durationMs: 91_000,
        highestLevel: 2,
        id: 'score-1',
        ipAddress: IP_ADDRESS,
        level: 2,
        nickname: 'Ace',
        rank: 8,
        score: 1200,
      },
    });
    expect(prisma.leaderboardEntry.count).toHaveBeenNthCalledWith(1, {
      where: {
        createdAt: {
          gte: new Date(NOW.getTime() - SCORE_SERVICE_LIMITS.rateLimitWindowMs),
        },
        ipAddress: IP_ADDRESS,
      },
    });
    expect(prisma.leaderboardEntry.create).toHaveBeenCalledWith({
      data: {
        durationMs: 91_000,
        highestLevel: 2,
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: 1200,
      },
    });
    expect(prisma.leaderboardEntry.count).toHaveBeenNthCalledWith(2, {
      where: {
        highestLevel: 2,
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
        ipAddress: IP_ADDRESS,
        nickname: '',
        score: 100,
      },
    },
    {
      code: 'INVALID_NICKNAME',
      input: {
        ipAddress: IP_ADDRESS,
        nickname: 'a'.repeat(SCORE_SERVICE_LIMITS.maxNicknameLength + 1),
        score: 100,
      },
    },
    {
      code: 'INVALID_SCORE',
      input: {
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: -1,
      },
    },
    {
      code: 'INVALID_LEVEL',
      input: {
        ipAddress: IP_ADDRESS,
        level: SCORE_SERVICE_LIMITS.totalLevels + 1,
        nickname: 'Ace',
        score: 100,
      },
    },
    {
      code: 'INVALID_DURATION',
      input: {
        durationMs: SCORE_SERVICE_LIMITS.maxDurationMs + 1,
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: 100,
      },
    },
    {
      code: 'INVALID_IP_ADDRESS',
      input: {
        ipAddress: '',
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
    expect(prisma.leaderboardEntry.create).not.toHaveBeenCalled();
    expect(prisma.leaderboardEntry.count).not.toHaveBeenCalled();
  });

  it('rejects scores above the configured maximum before hitting Prisma', async () => {
    const prisma = createMockPrisma();
    const service = createService(prisma);

    await expect(
      service.submitScore({
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: SCORE_SERVICE_LIMITS.maxScore + 1,
      }),
    ).rejects.toBeInstanceOf(ScoreServiceError);
    await expect(
      service.submitScore({
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: SCORE_SERVICE_LIMITS.maxScore + 1,
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_SCORE',
    });
    expect(prisma.leaderboardEntry.count).not.toHaveBeenCalled();
    expect(prisma.leaderboardEntry.create).not.toHaveBeenCalled();
  });

  it('rate-limits repeated submissions from the same IP address', async () => {
    const prisma = createMockPrisma();
    const service = createService(prisma);

    prisma.leaderboardEntry.count.mockResolvedValueOnce(
      SCORE_SERVICE_LIMITS.maxSubmissionsPerWindow,
    );

    await expect(
      service.submitScore({
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: 100,
      }),
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    expect(prisma.leaderboardEntry.count).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date(NOW.getTime() - SCORE_SERVICE_LIMITS.rateLimitWindowMs),
        },
        ipAddress: IP_ADDRESS,
      },
    });
    expect(prisma.leaderboardEntry.create).not.toHaveBeenCalled();
  });

  it('defaults optional highest level and duration fields', async () => {
    const prisma = createMockPrisma();
    const service = createService(prisma);
    const createdAt = new Date('2026-05-29T12:00:01.000Z');

    prisma.leaderboardEntry.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    prisma.leaderboardEntry.create.mockResolvedValueOnce({
      createdAt,
      durationMs: 0,
      highestLevel: 1,
      id: 'score-1',
      ipAddress: IP_ADDRESS,
      nickname: 'Ace',
      score: 100,
    });

    await expect(
      service.submitScore({
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: 100,
      }),
    ).resolves.toMatchObject({
      entry: {
        level: 1,
        rank: 1,
      },
    });
    expect(prisma.leaderboardEntry.count).toHaveBeenCalledTimes(2);
    expect(prisma.leaderboardEntry.count).toHaveBeenNthCalledWith(2, {
      where: {
        highestLevel: 1,
        OR: expect.any(Array),
      },
    });
    expect(prisma.leaderboardEntry.create).toHaveBeenCalledWith({
      data: {
        durationMs: 0,
        highestLevel: 1,
        ipAddress: IP_ADDRESS,
        nickname: 'Ace',
        score: 100,
      },
    });
  });
});
