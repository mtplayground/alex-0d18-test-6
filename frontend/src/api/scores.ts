export type ScoreSubmission = {
  durationMs?: number;
  highestLevel?: number;
  level?: number;
  nickname: string;
  score: number;
};

export type ApiRequestOptions = {
  signal?: AbortSignal;
};

export type SubmittedScoreEntry = {
  createdAt: string | null;
  durationMs: number | null;
  highestLevel: number | null;
  id: string | null;
  level: number | null;
  nickname: string;
  rank: number;
  score: number;
};

export type SubmitScoreResult = {
  entry: SubmittedScoreEntry | null;
  rank: number | null;
};

export type LeaderboardEntry = {
  createdAt: string | null;
  durationMs: number | null;
  highestLevel: number | null;
  id: string | null;
  level: number | null;
  nickname: string;
  rank: number;
  score: number;
};

export type GetLeaderboardOptions = {
  level?: number;
  limit?: number;
  signal?: AbortSignal;
};

export type ApiErrorDetail = {
  message: string;
  path: Array<number | string>;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
    public readonly code: string | null = null,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type ScoreSubmissionResponse = {
  entry?: unknown;
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
  options: ApiRequestOptions = {},
): Promise<SubmitScoreResult> => {
  const requestInit: RequestInit = {
    body: JSON.stringify(submission),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  };

  if (options.signal) {
    requestInit.signal = options.signal;
  }

  const payload = await requestJson<ScoreSubmissionResponse>(
    SCORES_ENDPOINT,
    requestInit,
  );
  const entry = normalizeSubmittedScoreEntry(payload.entry);

  return {
    entry,
    rank: entry?.rank ?? getRank(payload),
  };
};

export const getLeaderboard = async (
  options: GetLeaderboardOptions = {},
): Promise<LeaderboardEntry[]> => {
  const limit = normalizePositiveInteger(
    options.limit,
    DEFAULT_LEADERBOARD_LIMIT,
  );
  const searchParams = new URLSearchParams();

  if (options.level !== undefined) {
    searchParams.set(
      'level',
      Math.max(1, Math.floor(options.level)).toString(),
    );
  }

  const endpoint = searchParams.size
    ? `${SCORES_ENDPOINT}?${searchParams.toString()}`
    : SCORES_ENDPOINT;
  const payload = await requestJson<LeaderboardResponse | unknown[]>(
    endpoint,
    options.signal ? { signal: options.signal } : undefined,
  );

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

const requestJson = async <Payload>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Payload> => {
  let response: Response;

  try {
    response =
      init === undefined ? await fetch(input) : await fetch(input, init);
  } catch {
    throw new ApiClientError('Unable to reach the score service.');
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  try {
    return (await response.json()) as Payload;
  } catch {
    throw new ApiClientError(
      'Score service returned an invalid response.',
      response.status,
    );
  }
};

const getRank = (payload: ScoreSubmissionResponse): number | null => {
  const entry = getRecord(payload.entry);
  const rawRank = entry?.rank ?? payload.rank ?? payload.ranking;

  if (typeof rawRank !== 'number' || !Number.isFinite(rawRank)) {
    return null;
  }

  return Math.max(1, Math.floor(rawRank));
};

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const normalizeSubmittedScoreEntry = (
  value: unknown,
): SubmittedScoreEntry | null => {
  const entry = normalizeLeaderboardEntry(value, 0);

  if (!entry) {
    return null;
  }

  return {
    ...entry,
    rank: entry.rank,
  };
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
    durationMs: getNumber(record.durationMs),
    highestLevel: getNumber(record.highestLevel),
    id: getString(record.id),
    level: getNumber(
      record.level ?? record.highestLevel ?? record.currentLevel,
    ),
    nickname:
      getString(record.nickname ?? record.name ?? record.playerName) ??
      'UNKNOWN',
    rank: getNumber(record.rank ?? record.ranking) ?? index + 1,
    score,
  };
};

const createApiError = async (response: Response): Promise<ApiClientError> => {
  const payload = await readJsonObject(response);
  const message =
    getString(payload?.error) ??
    getString(payload?.message) ??
    `Score service request failed with status ${response.status}.`;
  const code = getString(payload?.code);
  const details = normalizeApiErrorDetails(payload?.details);

  return new ApiClientError(message, response.status, code, details);
};

const readJsonObject = async (
  response: Response,
): Promise<Record<string, unknown> | null> => {
  try {
    const payload = (await response.json()) as unknown;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return null;
    }

    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
};

const normalizeApiErrorDetails = (value: unknown): ApiErrorDetail[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((detail) => {
      if (!detail || typeof detail !== 'object') {
        return null;
      }

      const record = detail as Record<string, unknown>;
      const message = getString(record.message);
      const path = Array.isArray(record.path)
        ? record.path.filter(
            (part): part is number | string =>
              typeof part === 'number' || typeof part === 'string',
          )
        : [];

      if (!message) {
        return null;
      }

      return {
        message,
        path,
      };
    })
    .filter((detail): detail is ApiErrorDetail => Boolean(detail));
};

const normalizePositiveInteger = (
  value: number | undefined,
  fallback: number,
): number => {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
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
