# alex-0d18-test-6

This repository is organized as a monorepo with separate frontend and backend workspaces.

## Structure

- `frontend/`: browser game client built with Phaser 3, TypeScript, and Vite.
- `backend/`: API and web server built with Express, TypeScript, Zod, and dotenv.
- `.env.example`: documented environment variables for local development and deployment.

## Development Notes

- Persistent state must use PostgreSQL via `DATABASE_URL`; do not hardcode database connection strings.
- Web services should bind to `0.0.0.0` and use port `8080` unless a later issue specifies otherwise.
- Keep generated dependencies and build outputs out of version control.

## App Commands

- `npm run build`: generate Prisma Client, then build the frontend and backend.
- `npm run start`: start the compiled backend from the repository root. The start script loads `.env.production` when present, defaults to `0.0.0.0:8080`, refreshes Prisma Client, and serves `frontend/dist` through Express.

## Self-Hosting

`alex-0d18-test-6` requires PostgreSQL for persistent leaderboard data. Provide a PostgreSQL `DATABASE_URL` through the environment or a local `.env.production` file. Do not commit real credentials.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create production environment settings:

   ```bash
   cp .env.example .env.production
   ```

   Edit `.env.production` and set:

   - `HOST=0.0.0.0`
   - `PORT=8080`
   - `NODE_ENV=production`
   - `DATABASE_URL=postgresql://...`

3. Prepare the database:

   ```bash
   npm run db:migrate --workspace backend
   ```

4. Build the app:

   ```bash
   npm run build
   ```

5. Start the backend from the repository root:

   ```bash
   npm run start
   ```

   The backend listens on `0.0.0.0:8080` by default, serves the built frontend, and exposes the API under `/api`.

6. Verify the deployment:

   ```bash
   curl http://127.0.0.1:8080/healthz
   ```

The root start script expects `backend/dist/index.js` to exist. Run `npm run build` after dependency changes or source changes before starting production.

## Frontend Commands

- `npm run dev:frontend`: start the Vite development server on `0.0.0.0:8080`.
- `npm run build:frontend`: type-check and build the frontend.
- `npm run lint:frontend`: run ESLint for the frontend workspace.
- `npm run format:frontend`: check frontend formatting with Prettier.

## Backend Commands

- `npm run dev:backend`: start the Express development server.
- `npm run build:backend`: compile backend TypeScript.
- `npm run db:validate --workspace backend`: validate the Prisma schema.
- `npm run db:generate --workspace backend`: generate Prisma Client.
- `npm run db:migrate --workspace backend`: apply committed Prisma migrations.
- `npm run lint:backend`: run ESLint for the backend workspace.
- `npm run format:backend`: check backend formatting with Prettier.

## Planned Issue Order

1. Repository structure and monorepo layout.
2. Frontend Phaser 3 + TypeScript + Vite scaffold.
3. Backend Express + TypeScript scaffold.
4. PostgreSQL + Prisma integration.
5. Backend static serving for frontend build output.
