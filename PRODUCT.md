# alex-0d18-test-6

## Snapshot

`alex-0d18-test-6` is a TypeScript monorepo for a browser-based vertical scrolling shooter foundation. The frontend is a Phaser 3 game built with Vite, and the backend is an Express service that can serve the compiled frontend and expose API endpoints.

## Current Features

- Phaser scene flow: `BootScene` -> `PreloadScene` -> `MainMenuScene` -> `GameScene`.
- Main menu with loaded visual assets and a start action into gameplay.
- Gameplay scene with a player plane sprite.
- Player movement with arrow keys and WASD, clamped inside the game bounds.
- Spacebar shooting with a preallocated bullet object pool and off-screen bullet recycling.
- HUD showing health, score, and lives from game state.
- Vertically scrolling starfield background using tiled Phaser layers.
- Express backend with `/healthz`.
- Backend static serving for `frontend/dist`.
- Prisma configured for PostgreSQL through `DATABASE_URL`; the schema currently has no application models.

## Architecture

- Root uses npm workspaces: `frontend` and `backend`.
- `frontend/` contains the Phaser/Vite client.
- `frontend/src/game/scenes/` owns scene orchestration.
- `frontend/src/game/entities/` owns player and bullet sprites.
- `frontend/src/game/systems/` owns reusable systems such as HUD, bullet pooling, and scrolling background.
- `frontend/src/game/state/` owns lightweight gameplay state.
- `backend/` contains the Express TypeScript server.
- `backend/prisma/schema.prisma` declares the PostgreSQL datasource and Prisma Client generator.

## Conventions

- Persistent state must use PostgreSQL via `DATABASE_URL`; no SQLite, JSON-file, or in-memory persistence.
- Web servers bind to `0.0.0.0:8080` unless a future issue changes that.
- `npm run build` builds the frontend and backend.
- `npm run start` starts the compiled backend, which serves the built frontend.
- Build outputs, dependencies, local tokens, and local environment files stay out of version control.
