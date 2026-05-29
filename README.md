# alex-0d18-test-6

This repository is organized as a monorepo with separate frontend and backend workspaces.

## Structure

- `frontend/`: browser game client built with Phaser 3, TypeScript, and Vite.
- `backend/`: API and web server. A later issue will initialize the Express and TypeScript service here.
- `.env.example`: documented environment variables for local development and deployment.

## Development Notes

- Persistent state must use PostgreSQL via `DATABASE_URL`; do not hardcode database connection strings.
- Web services should bind to `0.0.0.0` and use port `8080` unless a later issue specifies otherwise.
- Keep generated dependencies and build outputs out of version control.

## Frontend Commands

- `npm run dev:frontend`: start the Vite development server on `0.0.0.0:8080`.
- `npm run build:frontend`: type-check and build the frontend.
- `npm run lint:frontend`: run ESLint for the frontend workspace.
- `npm run format:frontend`: check frontend formatting with Prettier.

## Planned Issue Order

1. Repository structure and monorepo layout.
2. Frontend Phaser 3 + TypeScript + Vite scaffold.
3. Backend Express + TypeScript scaffold.
4. PostgreSQL + Prisma integration.
5. Backend static serving for frontend build output.
