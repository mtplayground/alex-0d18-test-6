import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, getLeaderboard, submitScore } from '../scores';

const jsonResponse = (payload: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
    ...init,
  });

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

const mockFetch = (response: Response): FetchMock => {
  const fetchMock = vi.fn<typeof fetch>();
  fetchMock.mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('scores api client', () => {
  it('submits scores and normalizes the returned rank entry', async () => {
    const fetchMock = mockFetch(
      jsonResponse({
        entry: {
          createdAt: '2026-05-29T22:00:00.000Z',
          durationMs: 120000,
          highestLevel: 2,
          id: 'score-1',
          level: 2,
          nickname: 'Ace',
          rank: 4,
          score: 9000,
        },
      }),
    );

    await expect(
      submitScore({
        durationMs: 120000,
        level: 2,
        nickname: 'Ace',
        score: 9000,
      }),
    ).resolves.toEqual({
      entry: {
        createdAt: '2026-05-29T22:00:00.000Z',
        durationMs: 120000,
        highestLevel: 2,
        id: 'score-1',
        level: 2,
        nickname: 'Ace',
        rank: 4,
        score: 9000,
      },
      rank: 4,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/scores', {
      body: JSON.stringify({
        durationMs: 120000,
        level: 2,
        nickname: 'Ace',
        score: 9000,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  });

  it('loads leaderboard entries with an optional level query', async () => {
    const fetchMock = mockFetch(
      jsonResponse({
        entries: [
          {
            createdAt: '2026-05-29T22:00:00.000Z',
            durationMs: 80000,
            highestLevel: 3,
            id: 'score-1',
            nickname: 'Ace',
            rank: 1,
            score: 12000,
          },
        ],
      }),
    );

    await expect(getLeaderboard({ level: 3, limit: 10 })).resolves.toEqual([
      {
        createdAt: '2026-05-29T22:00:00.000Z',
        durationMs: 80000,
        highestLevel: 3,
        id: 'score-1',
        level: 3,
        nickname: 'Ace',
        rank: 1,
        score: 12000,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/api/scores?level=3');
  });

  it('supports loading the unfiltered leaderboard', async () => {
    const fetchMock = mockFetch(jsonResponse({ entries: [] }));

    await expect(getLeaderboard()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/scores');
  });

  it('passes abort signals to score requests', async () => {
    const controller = new AbortController();
    const fetchMock = mockFetch(
      jsonResponse({
        entry: {
          nickname: 'Ace',
          rank: 1,
          score: 100,
        },
      }),
    );

    await submitScore(
      {
        nickname: 'Ace',
        score: 100,
      },
      {
        signal: controller.signal,
      },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/scores',
      expect.objectContaining({
        signal: controller.signal,
      }),
    );

    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(jsonResponse({ entries: [] }));

    await getLeaderboard({
      level: 2,
      signal: controller.signal,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/scores?level=2', {
      signal: controller.signal,
    });
  });

  it('throws structured API errors from JSON error responses', async () => {
    mockFetch(
      jsonResponse(
        {
          code: 'BLOCKED_NICKNAME',
          details: [{ message: 'nickname rejected', path: ['nickname'] }],
          error: 'Nickname contains a blocked term.',
        },
        { status: 400 },
      ),
    );

    await expect(
      submitScore({
        nickname: 'Admin',
        score: 100,
      }),
    ).rejects.toMatchObject({
      code: 'BLOCKED_NICKNAME',
      details: [{ message: 'nickname rejected', path: ['nickname'] }],
      message: 'Nickname contains a blocked term.',
      status: 400,
    });
  });

  it('wraps network failures in ApiClientError', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockRejectedValue(new TypeError('failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getLeaderboard()).rejects.toBeInstanceOf(ApiClientError);
    await expect(getLeaderboard()).rejects.toMatchObject({
      message: 'Unable to reach the score service.',
      status: null,
    });
  });
});
