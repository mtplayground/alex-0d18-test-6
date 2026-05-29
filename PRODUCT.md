# alex-0d18-test-6

## Snapshot

`alex-0d18-test-6` is a TypeScript monorepo for a browser-based vertical scrolling shooter. The frontend is a Phaser 3 game built with Vite, and the backend is an Express service that serves the compiled frontend and exposes health/API surfaces.

## Current Features

- Phaser scene flow: boot, preload, main menu, gameplay, and result scenes.
- Main menu shows persistent best score and highest unlocked level from `localStorage`.
- Player plane movement with arrow keys/WASD, spacebar firing, and `B` bomb activation.
- Player health model with 3 lives, HP, one-hit shield absorption, short invulnerability, and flashing feedback after damage.
- Weapon levels: single shot, three-shot spread, and five-shot spread.
- Bombs clear active enemies and enemy bullets on screen.
- Enemy system with straight, zigzag, and dive enemies, each with distinct movement and shooting behavior.
- Phaser Arcade Physics collision handling for player/enemy contact, player/enemy bullets, boss contact, boss bullets, and pickup collection.
- Timed wave scripting driven by TypeScript configuration.
- Three level configurations with escalating wave sequences, boss encounters, and automatic level progression.
- Boss entity with high health, boss health bar UI, half-health phase transition, and multiple bullet patterns.
- Result scene for game over and full 3-level victory, showing score and updating saved progress.
- Pickup system with weapon upgrade, shield, and bomb drops from destroyed enemies.
- HUD for score, HP, lives, shield state, weapon level, bomb count, level, and boss health.
- Express backend with `/healthz` and static serving for `frontend/dist`.
- Prisma configured for PostgreSQL through `DATABASE_URL`; the schema currently has no application models.

## Architecture

- Root uses npm workspaces: `frontend` and `backend`.
- `frontend/` contains the Phaser/Vite client.
- `frontend/src/game/scenes/` owns scene orchestration and transitions.
- `frontend/src/game/entities/` owns sprites and gameplay actors such as player, bullets, enemies, boss, and pickups.
- `frontend/src/game/systems/` owns reusable game systems such as HUD, pools, collisions, waves, bosses, saves, scrolling background, and pickups.
- `frontend/src/game/data/` owns level and wave configuration.
- `frontend/src/game/state/` owns lightweight runtime game state and pure state transitions.
- `backend/` contains the Express TypeScript server.
- `backend/prisma/schema.prisma` declares the PostgreSQL datasource and Prisma Client generator.

## Conventions

- Product name stays `alex-0d18-test-6` unless `PRODUCT.md` and issue context change it.
- Gameplay configuration is kept in typed TypeScript data/modules rather than hardcoded inside entity behavior where practical.
- Runtime browser progress uses `localStorage`; backend persistence, if added later, must use PostgreSQL via `DATABASE_URL`.
- Web servers bind to `0.0.0.0:8080` unless a future issue changes that.
- `npm run build` builds the frontend and backend.
- `npm run start` starts the compiled backend, which serves the built frontend.
- Build outputs, dependencies, local tokens, and local environment files stay out of version control.
