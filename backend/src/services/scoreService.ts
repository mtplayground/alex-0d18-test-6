export const SCORE_SERVICE_LIMITS = {
  maxNicknameLength: 16,
  maxScore: 999_999,
  maxSubmissionsPerWindow: 5,
  minLevel: 1,
  minScore: 0,
  rateLimitWindowMs: 60_000,
  totalLevels: 3,
} as const;

export type ScoreServiceErrorCode =
  | 'INVALID_LEVEL'
  | 'INVALID_NICKNAME'
  | 'INVALID_SCORE'
  | 'RATE_LIMITED';

export class ScoreServiceError extends Error {
  constructor(
    public readonly code: ScoreServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ScoreServiceError';
  }
}

export type SubmitScoreInput = {
  clientId?: string | null;
  level?: number;
  nickname: string;
  score: number;
};

export type ScoreRecord = {
  createdAt: Date;
  id: string;
  level: number;
  nickname: string;
  score: number;
};

export type RankedScore = ScoreRecord & {
  rank: number;
};

export type SubmitScoreResult = {
  entry: RankedScore;
};

export type ScoreCreateArgs = {
  data: {
    clientId: string | null;
    level: number;
    nickname: string;
    score: number;
  };
};

export type ScoreCountArgs = {
  where: Record<string, unknown>;
};

export type ScoreModelClient = {
  count(args: ScoreCountArgs): Promise<number>;
  create(args: ScoreCreateArgs): Promise<ScoreRecord>;
};

export type ScorePrismaClient = {
  score: ScoreModelClient;
};

export type ScoreServiceOptions = {
  now?: () => Date;
  rateLimitWindowMs?: number;
  submissionLimit?: number;
};

type NormalizedScoreInput = {
  clientId: string | null;
  level: number;
  nickname: string;
  score: number;
};

export class ScoreService {
  private readonly now: () => Date;
  private readonly rateLimitWindowMs: number;
  private readonly submissionLimit: number;

  constructor(
    private readonly prisma: ScorePrismaClient,
    options: ScoreServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.rateLimitWindowMs =
      options.rateLimitWindowMs ?? SCORE_SERVICE_LIMITS.rateLimitWindowMs;
    this.submissionLimit =
      options.submissionLimit ?? SCORE_SERVICE_LIMITS.maxSubmissionsPerWindow;
  }

  async submitScore(input: SubmitScoreInput): Promise<SubmitScoreResult> {
    const normalizedInput = this.normalizeInput(input);

    await this.enforceRateLimit(normalizedInput.clientId);

    const entry = await this.prisma.score.create({
      data: normalizedInput,
    });
    const higherScoreCount = await this.prisma.score.count({
      where: {
        level: entry.level,
        OR: [
          {
            score: {
              gt: entry.score,
            },
          },
          {
            createdAt: {
              lt: entry.createdAt,
            },
            score: entry.score,
          },
        ],
      },
    });

    return {
      entry: {
        ...entry,
        rank: higherScoreCount + 1,
      },
    };
  }

  private normalizeInput(input: SubmitScoreInput): NormalizedScoreInput {
    const nickname = input.nickname.trim();
    const score = Math.floor(input.score);
    const level = Math.floor(input.level ?? SCORE_SERVICE_LIMITS.minLevel);
    const clientId = input.clientId?.trim() || null;

    if (
      nickname.length === 0 ||
      nickname.length > SCORE_SERVICE_LIMITS.maxNicknameLength
    ) {
      throw new ScoreServiceError(
        'INVALID_NICKNAME',
        `Nickname must be 1-${SCORE_SERVICE_LIMITS.maxNicknameLength} characters.`,
      );
    }

    if (
      !Number.isFinite(input.score) ||
      score < SCORE_SERVICE_LIMITS.minScore ||
      score > SCORE_SERVICE_LIMITS.maxScore
    ) {
      throw new ScoreServiceError(
        'INVALID_SCORE',
        `Score must be between ${SCORE_SERVICE_LIMITS.minScore} and ${SCORE_SERVICE_LIMITS.maxScore}.`,
      );
    }

    if (
      !Number.isFinite(input.level ?? SCORE_SERVICE_LIMITS.minLevel) ||
      level < SCORE_SERVICE_LIMITS.minLevel ||
      level > SCORE_SERVICE_LIMITS.totalLevels
    ) {
      throw new ScoreServiceError(
        'INVALID_LEVEL',
        `Level must be between ${SCORE_SERVICE_LIMITS.minLevel} and ${SCORE_SERVICE_LIMITS.totalLevels}.`,
      );
    }

    return {
      clientId,
      level,
      nickname,
      score,
    };
  }

  private async enforceRateLimit(clientId: string | null): Promise<void> {
    if (!clientId) {
      return;
    }

    const windowStart = new Date(this.now().getTime() - this.rateLimitWindowMs);
    const recentSubmissionCount = await this.prisma.score.count({
      where: {
        clientId,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    if (recentSubmissionCount >= this.submissionLimit) {
      throw new ScoreServiceError(
        'RATE_LIMITED',
        'Too many score submissions. Try again later.',
      );
    }
  }
}
