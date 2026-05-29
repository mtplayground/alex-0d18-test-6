# Backend

Server workspace built with Express, TypeScript, Zod, and dotenv.

## Scripts

- `npm run dev --workspace backend`: start the TypeScript development server.
- `npm run build --workspace backend`: compile TypeScript into `dist/`.
- `npm run start --workspace backend`: run the compiled server.
- `npm run lint --workspace backend`: run ESLint.
- `npm run format --workspace backend`: check Prettier formatting.

## Endpoint

- `GET /healthz`: returns process health metadata.
