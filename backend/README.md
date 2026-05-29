# Backend

Server workspace built with Express, TypeScript, Zod, and dotenv.

## Scripts

- `npm run dev --workspace backend`: start the TypeScript development server.
- `npm run build --workspace backend`: compile TypeScript into `dist/`.
- `npm run start --workspace backend`: run the compiled server.
- `npm run db:validate --workspace backend`: validate the Prisma schema.
- `npm run db:generate --workspace backend`: generate Prisma Client.
- `npm run db:migrate --workspace backend`: apply committed migrations to PostgreSQL.
- `npm run db:migrate:dev --workspace backend`: create/apply development migrations.
- `npm run lint --workspace backend`: run ESLint.
- `npm run format --workspace backend`: check Prettier formatting.

## Endpoint

- `GET /healthz`: returns process health metadata.

## Database

Prisma is configured for PostgreSQL via `DATABASE_URL`. The initial schema contains no application models.
