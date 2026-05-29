export const SCORE_SERVICE_LIMITS = {
  leaderboardLimit: 50,
  maxDurationMs: 86_400_000,
  maxNicknameLength: 16,
  maxScore: 999_999,
  maxSubmissionsPerWindow: 5,
  minLevel: 1,
  minScore: 0,
  rateLimitWindowMs: 60_000,
  totalLevels: 3,
} as const;

const DEFAULT_BLOCKED_NICKNAME_TERMS = [
  'admin',
  'administrator',
  'gm',
  'moderator',
  'official',
  'system',
  '客服',
  '官方',
  '管理员',
] as const;

export type ScoreServiceErrorCode =
  | 'BLOCKED_NICKNAME'
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

export type ListScoresInput = {
  level?: number;
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

export type ListScoresResult = {
  entries: RankedScore[];
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

export type ScoreFindManyArgs = {
  orderBy: Array<Record<string, unknown>>;
  take: number;
  where?: Record<string, unknown>;
};

export type ScoreModelClient = {
  count(args: ScoreCountArgs): Promise<number>;
  create(args: ScoreCreateArgs): Promise<ScoreRecord>;
  findMany(args: ScoreFindManyArgs): Promise<ScoreRecord[]>;
};

export type ScorePrismaClient = {
  leaderboardEntry: ScoreModelClient;
};

export type ScoreServiceOptions = {
  blockedNicknameTerms?: readonly string[];
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
  private readonly blockedNicknameTerms: string[];
  private readonly now: () => Date;
  private readonly rateLimitWindowMs: number;
  private readonly submissionLimit: number;

  constructor(
    private readonly prisma: ScorePrismaClient,
    options: ScoreServiceOptions = {},
  ) {
    this.blockedNicknameTerms = this.normalizeBlockedNicknameTerms(
      options.blockedNicknameTerms ?? DEFAULT_BLOCKED_NICKNAME_TERMS,
    );
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

  async listTopScores(input: ListScoresInput = {}): Promise<ListScoresResult> {
    const level = this.normalizeOptionalLevel(input.level);
    const entries = await this.prisma.leaderboardEntry.findMany({
      orderBy: [
        {
          score: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
      take: SCORE_SERVICE_LIMITS.leaderboardLimit,
      ...(level === undefined
        ? {}
        : {
            where: {
              highestLevel: level,
            },
          }),
    });

    return {
      entries: entries.map((entry, index) => ({
        ...entry,
        level: entry.highestLevel,
        rank: index + 1,
      })),
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

    if (this.isBlockedNickname(nickname)) {
      throw new ScoreServiceError(
        'BLOCKED_NICKNAME',
        'Nickname contains a blocked term.',
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

  private normalizeOptionalLevel(
    level: number | undefined,
  ): number | undefined {
    if (level === undefined) {
      return undefined;
    }

    const normalizedLevel = Math.floor(level);

    if (
      !Number.isFinite(level) ||
      normalizedLevel < SCORE_SERVICE_LIMITS.minLevel ||
      normalizedLevel > SCORE_SERVICE_LIMITS.totalLevels
    ) {
      throw new ScoreServiceError(
        'INVALID_LEVEL',
        `Level must be between ${SCORE_SERVICE_LIMITS.minLevel} and ${SCORE_SERVICE_LIMITS.totalLevels}.`,
      );
    }

    return normalizedLevel;
  }

  private normalizeBlockedNicknameTerms(terms: readonly string[]): string[] {
    return Array.from(
      new Set(
        terms
          .map((term) => this.normalizeNicknameForFiltering(term))
          .filter((term) => term.length > 0),
      ),
    );
  }

  private isBlockedNickname(nickname: string): boolean {
    const normalizedNickname = this.normalizeNicknameForFiltering(nickname);

    return this.blockedNicknameTerms.some((term) =>
      normalizedNickname.includes(term),
    );
  }

  private normalizeNicknameForFiltering(value: string): string {
    return value.toLowerCase().replace(/[\s._-]+/gu, '');
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
