# Milly Web App

The shared product boundary and web requirements live in [`../SPEC.md`](../SPEC.md). This README is for web setup and developer-facing integration notes. Contributor and agent rules are in [`../AGENTS.md`](../AGENTS.md).

The independent React marketplace client for Milly.

## Stack

- React 19 and TypeScript
- React Router
- TanStack React Query
- shadcn/ui configuration using preset `b1iABqBwrw`
- Vite

## Local setup

```bash
pnpm install
Copy-Item .env.example .env
pnpm dev
```

The web app starts at `http://localhost:5173` and expects the API at `http://localhost:4000/api/v1`.

## Current client surface

- Home discovery feed and category shortcuts
- Search, URL-backed filters, sort, currency, condition, and price range
- Listing details and image gallery
- Public seller profiles
- Register, login, refresh-session handling, and logout
- Favorites
- My listings
- Create listing form with USD/MMK pricing

Payments and real-time messaging are intentionally not included yet.
