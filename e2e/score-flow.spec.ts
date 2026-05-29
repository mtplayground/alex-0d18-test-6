import { expect, test, type Page, type Route } from "@playwright/test";

type ScoreEntry = {
  createdAt: string;
  level: number;
  nickname: string;
  rank: number;
  score: number;
};

type ScoreSubmission = {
  highestLevel?: unknown;
  level?: unknown;
  nickname?: unknown;
  score?: unknown;
};

type E2EGame = {
  scene: {
    getScenes(active?: boolean): Array<{
      scene: {
        key: string;
      };
    }>;
    getScene(key: string): {
      children: {
        list: Array<{
          text?: unknown;
        }>;
      };
    };
    start(key: string, data?: unknown): void;
  };
};

declare global {
  interface Window {
    __alexE2EGame?: E2EGame;
  }
}

const TEST_NICKNAME = "E2E Ace";
const TEST_SCORE = 42_420;

test("main menu to score submission to leaderboard visibility", async ({
  page,
}) => {
  const entries: ScoreEntry[] = [];

  await page.route("**/api/scores**", async (route) => {
    await handleScoresRoute(route, entries);
  });

  await page.goto("/");
  await waitForScene(page, "MainMenuScene");

  await clickGamePoint(page, 0.5, 0.72);
  await waitForScene(page, "GameScene");

  await page.evaluate((score) => {
    window.__alexE2EGame?.scene.start("ResultScene", {
      currentLevel: 3,
      outcome: "victory",
      score,
      totalLevels: 3,
    });
  }, TEST_SCORE);

  const nicknameInput = page.getByPlaceholder("Enter nickname");
  await expect(nicknameInput).toBeVisible();
  await nicknameInput.fill(TEST_NICKNAME);
  await nicknameInput.press("Enter");

  await expect
    .poll(() => entries.length, {
      message: "score submission should reach the scores API",
    })
    .toBe(1);
  expect(entries[0]).toMatchObject({
    level: 3,
    nickname: TEST_NICKNAME,
    score: TEST_SCORE,
  });
  await expectSceneText(page, "ResultScene", "Rank #1");

  await clickGamePoint(page, 0.5, 0.92);
  await waitForScene(page, "MainMenuScene");

  await clickGamePoint(page, 0.5, 0.83);
  await waitForScene(page, "LeaderboardScene");

  await clickGamePoint(page, 0.73, 0.214);
  await expectLeaderboardText(page, TEST_NICKNAME);
  await expectLeaderboardText(page, TEST_SCORE.toString());
});

const handleScoresRoute = async (
  route: Route,
  entries: ScoreEntry[],
): Promise<void> => {
  const request = route.request();

  if (request.method() === "POST") {
    const submission = request.postDataJSON() as ScoreSubmission;
    const nickname =
      typeof submission.nickname === "string"
        ? submission.nickname.trim()
        : TEST_NICKNAME;
    const score =
      typeof submission.score === "number" ? Math.floor(submission.score) : 0;
    const submittedLevel =
      typeof submission.highestLevel === "number"
        ? submission.highestLevel
        : submission.level;
    const level =
      typeof submittedLevel === "number" && Number.isFinite(submittedLevel)
        ? Math.floor(submittedLevel)
        : 1;
    const entry: ScoreEntry = {
      createdAt: new Date().toISOString(),
      level,
      nickname,
      rank: 1,
      score,
    };

    entries.splice(0, entries.length, entry);

    await route.fulfill({
      body: JSON.stringify({
        entry,
      }),
      contentType: "application/json",
      status: 201,
    });
    return;
  }

  if (request.method() === "GET") {
    const url = new URL(request.url());
    const level = Number(url.searchParams.get("level") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "50");

    await route.fulfill({
      body: JSON.stringify({
        entries: entries
          .filter((entry) => entry.level === level)
          .slice(0, Number.isFinite(limit) ? limit : 50),
      }),
      contentType: "application/json",
      status: 200,
    });
    return;
  }

  await route.fallback();
};

const waitForScene = async (page: Page, sceneKey: string): Promise<void> => {
  await page.waitForFunction((key) => {
    return window.__alexE2EGame?.scene
      .getScenes(true)
      .some((scene) => scene.scene.key === key);
  }, sceneKey);
};

const clickGamePoint = async (
  page: Page,
  xRatio: number,
  yRatio: number,
): Promise<void> => {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error("Game canvas is not visible.");
  }

  await page.mouse.click(
    box.x + box.width * xRatio,
    box.y + box.height * yRatio,
  );
};

const expectLeaderboardText = async (
  page: Page,
  expectedText: string,
): Promise<void> => {
  await expectSceneText(page, "LeaderboardScene", expectedText);
};

const expectSceneText = async (
  page: Page,
  sceneKey: string,
  expectedText: string,
): Promise<void> => {
  await page.waitForFunction(
    (text) => {
      const scene = window.__alexE2EGame?.scene.getScene(text.sceneKey);

      return scene?.children.list.some((child) => {
        return (
          typeof child.text === "string" &&
          child.text.includes(text.expectedText)
        );
      });
    },
    { expectedText, sceneKey },
  );
};
