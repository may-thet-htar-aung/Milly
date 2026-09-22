# Milly

Milly is a second-hand marketplace with an API and web client. The shared product boundary and current v1 feature focus are documented in [`SPEC.md`](SPEC.md).

## Projects

- [`api/`](api/) — REST API, Prisma schema, SQLite database, authentication, seed data, and moderation endpoints.
- [`app/`](app/) — React web client for browsing, listing, profiles, favorites, and account flows.

The mobile client is planned by the specification but is not yet included in this workspace.

## Local development

Install dependencies in each project, copy the project environment example, and follow the project README:

```powershell
Set-Location api
pnpm install
Copy-Item .env.example .env
pnpm db:migrate
pnpm db:generate
pnpm db:seed
pnpm dev
```

In another terminal:

```powershell
Set-Location app
pnpm install
Copy-Item .env.example .env
pnpm dev
```

The API runs at `http://localhost:4000`; the web client runs at `http://localhost:5173`.

For project-specific scripts, environment variables, seed credentials, and troubleshooting, see [`api/README.md`](api/README.md) and [`app/README.md`](app/README.md).

## Contribution guidance

Read [`AGENTS.md`](AGENTS.md) before making repository changes. `AGENTS.md` describes the responsibility split between the specification, READMEs, and agent instructions, along with validation and security expectations. `CLAUDE.md` is a compatibility entry point for Claude-based tooling.

This README is intentionally limited to orientation and setup. Product requirements belong in `SPEC.md`.
