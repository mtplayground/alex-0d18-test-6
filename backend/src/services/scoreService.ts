export const SCORE_SERVICE_LIMITS = {
  maxDurationMs: 86_400_000,
  maxNicknameLength: 16,
  maxScore: 999_999,
  maxSubmissionsPerWindow: 5,
  minLevel: 1,
  minScore: 0,
  rateLimitWindowMs: 60_000,
  totalLevels: 3,
} as const;

export type ScoreServiceErrorCode =
  | 'INVALID_DURATION'
  | 'INVALID_LEVEL'
  | 'INVALID_NICKNAME'
  | 'INVALID_IP_ADDRESS'
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
  durationMs?: number;
  highestLevel?: number;
  ipAddress: string;
  level?: number;
  nickname: string;
  score: number;
};

export type ScoreRecord = {
  createdAt: Date;
  durationMs: number;
  highestLevel: number;
  id: string;
  ipAddress: string;
  nickname: string;
  score: number;
};

export type RankedScore = ScoreRecord & {
  level: number;
  rank: number;
};

export type SubmitScoreResult = {
  entry: RankedScore;
};

export type ScoreCreateArgs = {
  data: {
    durationMs: number;
    highestLevel: number;
    ipAddress: string;
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
  leaderboardEntry: ScoreModelClient;
};

export type ScoreServiceOptions = {
  now?: () => Date;
  rateLimitWindowMs?: number;
  submissionLimit?: number;
};

type NormalizedScoreInput = {
  durationMs: number;
  highestLevel: number;
  ipAddress: string;
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

    await this.enforceRateLimit(normalizedInput.ipAddress);

    const entry = await this.prisma.leaderboardEntry.create({
      data: normalizedInput,
    });
    const higherScoreCount = await this.prisma.leaderboardEntry.count({
      where: {
        highestLevel: entry.highestLevel,
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
        level: entry.highestLevel,
        rank: higherScoreCount + 1,
      },
    };
  }

  private normalizeInput(input: SubmitScoreInput): NormalizedScoreInput {
    const nickname = input.nickname.trim();
    const score = Math.floor(input.score);
    const highestLevel = Math.floor(
      input.highestLevel ?? input.level ?? SCORE_SERVICE_LIMITS.minLevel,
    );
    const durationMs = Math.floor(input.durationMs ?? 0);
    const ipAddress = input.ipAddress.trim();

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
      !Number.isFinite(
        input.highestLevel ?? input.level ?? SCORE_SERVICE_LIMITS.minLevel,
      ) ||
      highestLevel < SCORE_SERVICE_LIMITS.minLevel ||
      highestLevel > SCORE_SERVICE_LIMITS.totalLevels
    ) {
      throw new ScoreServiceError(
        'INVALID_LEVEL',
        `Level must be between ${SCORE_SERVICE_LIMITS.minLevel} and ${SCORE_SERVICE_LIMITS.totalLevels}.`,
      );
    }

    if (
      !Number.isFinite(input.durationMs ?? 0) ||
      durationMs < 0 ||
      durationMs > SCORE_SERVICE_LIMITS.maxDurationMs
    ) {
      throw new ScoreServiceError(
        'INVALID_DURATION',
        `Duration must be between 0 and ${SCORE_SERVICE_LIMITS.maxDurationMs} milliseconds.`,
      );
    }

    if (ipAddress.length === 0 || ipAddress.length > 45) {
      throw new ScoreServiceError(
        'INVALID_IP_ADDRESS',
        'IP address must be present and at most 45 characters.',
      );
    }

    return {
      durationMs,
      highestLevel,
      ipAddress,
      nickname,
      score,
    };
  }

  private async enforceRateLimit(ipAddress: string): Promise<void> {
    const windowStart = new Date(this.now().getTime() - this.rateLimitWindowMs);
    const recentSubmissionCount = await this.prisma.leaderboardEntry.count({
      where: {
        createdAt: {
          gte: windowStart,
        },
        ipAddress,
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
