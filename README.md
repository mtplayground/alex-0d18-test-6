# alex-0d18-test-6

This repository is organized as a monorepo with separate frontend and backend workspaces.

## Structure

- `frontend/`: browser game client. A later issue will initialize the Phaser 3, TypeScript, and Vite application here.
- `backend/`: API and web server. A later issue will initialize the Express and TypeScript service here.
- `.env.example`: documented environment variables for local development and deployment.

## Development Notes

- Persistent state must use PostgreSQL via `DATABASE_URL`; do not hardcode database connection strings.
- Web services should bind to `0.0.0.0` and use port `8080` unless a later issue specifies otherwise.
- Keep generated dependencies and build outputs out of version control.

## Planned Issue Order

1. Repository structure and monorepo layout.
2. Frontend Phaser 3 + TypeScript + Vite scaffold.
3. Backend Express + TypeScript scaffold.
4. PostgreSQL + Prisma integration.
5. Backend static serving for frontend build output.
