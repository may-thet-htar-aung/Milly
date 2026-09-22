# Milly API

The shared product boundary and API contract live in [`../SPEC.md`](../SPEC.md). This README is for API setup, local development, and integration details. Contributor and agent rules are in [`../AGENTS.md`](../AGENTS.md).

Independent REST API for the Milly second-hand marketplace.

## Stack

- Node.js and TypeScript
- Express 5
- SQLite
- Prisma 7 with `@prisma/adapter-better-sqlite3`
- JWT access and rotating refresh sessions
- Zod request validation

## Local setup

```bash
pnpm install
Copy-Item .env.example .env
pnpm db:migrate --name init
pnpm db:generate
pnpm db:seed
pnpm dev
```

The API starts at `http://localhost:4000`.

Useful checks:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/categories
curl "http://localhost:4000/api/v1/listings?page=1&pageSize=20"
```

## Seed accounts

The explicit seed command creates demo data. It resets the local database first.

- Admin: `admin@milly.local` / `MillyDemo123!`
- Sellers: `seller1@milly.local` through `seller20@milly.local` / `MillyDemo123!`

These credentials are for local development only.

## Price representation

Listing prices use `priceMinor` as an integer to avoid floating-point loss. For USD this represents cents; for MMK it represents whole kyat. The API always returns the listing's `currency` alongside the amount.

## Main routes

This is a quick integration reference; use the specification for the complete contract and acceptance criteria.

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/categories`
- `GET /api/v1/listings`
- `POST /api/v1/listings`
- `GET /api/v1/listings/:id`
- `PATCH /api/v1/listings/:id`
- `POST /api/v1/listings/:id/publish`
- `POST /api/v1/listings/:id/reserve`
- `POST /api/v1/listings/:id/mark-sold`
- `POST /api/v1/listings/:id/favorite`
- `DELETE /api/v1/listings/:id/favorite`
- `POST /api/v1/listings/:id/report`
