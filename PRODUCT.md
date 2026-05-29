# alex-0d18-test-6

## Snapshot

`alex-0d18-test-6` is a TypeScript monorepo for a browser-based vertical scrolling shooter. The frontend is a Phaser 3 game built with Vite. The backend is an Express service that serves the compiled frontend, exposes health and score APIs, and persists leaderboard data in PostgreSQL through Prisma.

## Current Features

- Phaser scene flow: boot, preload, main menu, gameplay, result, and leaderboard scenes.
- Main menu starts the game, opens the leaderboard, and shows best score plus highest unlocked level from `localStorage`.
- Gameplay includes player movement, shooting, weapon upgrades, bombs, shield pickup, HP/lives, invulnerability windows, enemy waves, bosses, pickups, HUD, collisions, and three escalating levels.
- Result scene records local progress, accepts a 1-16 character nickname, submits score data, and displays the returned rank.
- Leaderboard scene shows Top 50 scores and supports switching between levels.
- Frontend API client wraps score `fetch` calls with `submitScore` and `getLeaderboard`, structured errors, response normalization, and abort-signal support.
- Frontend bootstrap registers global error and unhandled rejection handlers and shows a simple fatal startup fallback if the game cannot mount.
- Backend exposes `POST /api/scores` to validate and store score submissions and return rank.
- Backend exposes `GET /api/scores` to return Top 50 leaderboard entries, optionally filtered by level.
- Basic anti-cheat is server-side: score/level/duration caps, per-IP submission rate limiting, and normalized sensitive-term nickname filtering.
- Self-hosting is documented in `README.md`; root `npm run start` launches the compiled backend through `scripts/start.sh`.

## Architecture

- Root uses npm workspaces: `frontend` and `backend`.
- `frontend/` contains the Phaser/Vite client.
- `frontend/src/game/scenes/` owns scene orchestration and transitions.
- `frontend/src/game/entities/` owns sprites and gameplay actors.
- `frontend/src/game/systems/` owns reusable game systems such as HUD, pools, collisions, waves, bosses, saves, scrolling background, and pickups.
- `frontend/src/game/data/` owns level and wave configuration.
- `frontend/src/game/state/` owns lightweight runtime game state and pure state transitions.
- `frontend/src/api/` owns browser API client code.
- `backend/` contains the Express TypeScript server.
- `backend/src/middleware/` owns centralized HTTP error serialization and Express error/not-found handlers.
- `backend/src/lib/logger.ts` owns structured server logging with basic sensitive-field redaction.
- `backend/prisma/schema.prisma` defines the PostgreSQL datasource and `LeaderboardEntry` model.
- Prisma migrations create leaderboard storage, indexes, and database-level checks for score, highest level, and duration.
- `scripts/start.sh` loads `.env.production` when present, defaults to `0.0.0.0:8080`, verifies the compiled backend exists, refreshes Prisma Client, and starts the backend.

## Validation

- Backend unit tests use Jest for score service, score schema behavior, and HTTP error serialization.
- Frontend unit tests use Vitest for API client, global error handling, localStorage save logic, bullet pattern helpers, collision helpers, and game-state transitions.
- Playwright E2E covers the flow from main menu to game, simulated victory, score submission, rank display, and leaderboard visibility.

## Conventions

- Product name stays `alex-0d18-test-6` unless `PRODUCT.md` and issue context change it.
- Gameplay configuration is kept in typed TypeScript data/modules rather than hardcoded inside entity behavior where practical.
- Runtime browser progress uses `localStorage`; persistent backend state uses PostgreSQL via `DATABASE_URL`.
- Web servers bind to `0.0.0.0:8080` unless a future issue changes that.
- `npm run build` generates Prisma Client, then builds the frontend and backend.
- `npm run start` starts the compiled backend from the repository root; the backend serves the built frontend.
- Backend routes should pass validation, domain, and unexpected failures through the shared HTTP error middleware.
- Server logs should use the shared logger instead of direct `console.*` calls in backend application code.
- Build outputs, dependencies, local tokens, and local environment files stay out of version control.
