export type ScoreSubmission = {
  nickname: string;
  score: number;
};

export type SubmitScoreResult = {
  rank: number | null;
};

type ScoreSubmissionResponse = {
  entry?: {
    rank?: unknown;
  };
  rank?: unknown;
  ranking?: unknown;
};

const SCORES_ENDPOINT = '/api/scores';

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
