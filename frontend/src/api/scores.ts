export type ScoreSubmission = {
  nickname: string;
  score: number;
};

export type SubmitScoreResult = {
  rank: number | null;
};

export type LeaderboardEntry = {
  rank: number;
  nickname: string;
  score: number;
  level: number | null;
  createdAt: string | null;
};

export type GetLeaderboardOptions = {
  level: number;
  limit?: number;
};

type ScoreSubmissionResponse = {
  entry?: {
    rank?: unknown;
  };
  rank?: unknown;
  ranking?: unknown;
};

type LeaderboardResponse = {
  entries?: unknown;
  scores?: unknown;
};

const SCORES_ENDPOINT = '/api/scores';
const DEFAULT_LEADERBOARD_LIMIT = 50;

export const submitScore = async (
  submission: ScoreSubmission,
): Promise<SubmitScoreResult> => {
  const response = await fetch(SCORES_ENDPOINT, {
    body: JSON.stringify(submission),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = (await response.json()) as ScoreSubmissionResponse;

  return {
    rank: getRank(payload),
  };
};

export const getLeaderboard = async ({
  level,
  limit = DEFAULT_LEADERBOARD_LIMIT,
}: GetLeaderboardOptions): Promise<LeaderboardEntry[]> => {
  const searchParams = new URLSearchParams({
    level: Math.max(1, Math.floor(level)).toString(),
    limit: Math.max(1, Math.floor(limit)).toString(),
  });

  const response = await fetch(`${SCORES_ENDPOINT}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = (await response.json()) as LeaderboardResponse | unknown[];
  const rawEntries = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.entries)
      ? payload.entries
      : Array.isArray(payload.scores)
        ? payload.scores
        : [];

  return rawEntries
    .slice(0, limit)
    .map((entry, index) => normalizeLeaderboardEntry(entry, index))
    .filter((entry): entry is LeaderboardEntry => Boolean(entry));
};

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: unknown };

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Fall back to a generic message below when the server returns no JSON body.
  }

  return 'Score submission failed.';
};

const getRank = (payload: ScoreSubmissionResponse): number | null => {
  const rawRank = payload.entry?.rank ?? payload.rank ?? payload.ranking;

  if (typeof rawRank !== 'number' || !Number.isFinite(rawRank)) {
    return null;
  }

  return Math.max(1, Math.floor(rawRank));
};

const normalizeLeaderboardEntry = (
  value: unknown,
  index: number,
): LeaderboardEntry | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const score = getNumber(record.score);

  if (score === null) {
    return null;
  }

  return {
    createdAt: getString(record.createdAt),
    level: getNumber(record.level ?? record.currentLevel),
    nickname:
      getString(record.nickname ?? record.name ?? record.playerName) ??
      'UNKNOWN',
    rank: getNumber(record.rank ?? record.ranking) ?? index + 1,
    score,
  };
};

const getNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.floor(value);
};

const getString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
};
