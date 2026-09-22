# AGENTS.md

## Purpose

This file contains repository guidance for coding agents and other automated contributors working on Milly.

Use the documents in this order:

1. `SPEC.md` — product scope, feature focus, domain boundaries, API/client contracts, non-goals, and acceptance criteria.
2. `README.md` — repository orientation and user/developer setup.
3. `api/README.md` and `app/README.md` — project-specific commands and integration details.
4. `AGENTS.md` — contribution rules and validation expectations.

`CLAUDE.md` is a compatibility entry point and points back to this file. Keep this file as the canonical agent guidance.

## Product boundary

Milly is a second-hand marketplace focused on discovery, publishing, and management of listings. The current v1 feature focus is:

- browse, search, filter, and paginate active listings;
- show prices in the seller's original USD or MMK currency;
- authenticate users and maintain seller identity;
- create and manage the lifecycle of a seller's listings;
- favorite listings;
- view public seller profiles;
- report listings and support admin moderation;
- provide the same core capability through web and mobile clients.

Payments, checkout, orders, shipping, real-time messaging, notifications, auctions, and identity verification remain outside the current feature boundary unless `SPEC.md` is explicitly amended.

When a request conflicts with `SPEC.md`, stop and identify the conflict before implementing it. Do not silently expand the product boundary.

## Responsibility split

- Put product requirements, user-visible behavior, domain rules, endpoint contracts, non-goals, acceptance criteria, and deliberate scope changes in `SPEC.md`.
- Put installation, environment variables, commands, local URLs, project structure, and troubleshooting in the relevant `README.md`.
- Put agent/contributor behavior, validation rules, coding conventions, and change-safety guidance here.
- Do not duplicate long feature requirements between SPEC and README. Link to the source of truth instead.

## Repository structure

This workspace currently contains:

- `api/` — Express, TypeScript, Prisma, SQLite, authentication, REST API, seed data, and moderation endpoints.
- `app/` — React, TypeScript, Vite, React Router, and TanStack Query web client.
- `SPEC.md` — shared product and boundary specification.

The mobile client is part of the intended product boundary but is not yet present in this workspace. Do not claim mobile support is complete until a mobile project and its validation workflow exist.

## Engineering rules

- Preserve the API contract in `SPEC.md` when changing either client.
- Keep React Query as the owner of server state and local component state for transient form/UI state.
- Enforce authentication, role checks, and resource ownership on the API; client-side guards are not sufficient.
- Validate every external API input on the server with the existing validation approach.
- Never expose password hashes, refresh-token secrets, or sensitive internal metadata.
- Treat `priceMinor` as an integer and always carry the corresponding `currency`; never perform silent currency conversion.
- Keep seller location privacy-conscious and avoid exposing more precision than the product contract allows.
- Keep payment-like language out of v1 UI and flows.
- Prefer small, reversible changes and preserve unrelated user work in the working tree.
- Do not commit secrets, local databases, generated build output, or credentials.

## Change workflow

Before changing code:

1. Read the relevant section of `SPEC.md` and the applicable project README.
2. Inspect the existing implementation and current git status.
3. Identify whether the change affects the shared API contract, web client, mobile client, seed data, or documentation.
4. Update the source-of-truth document when the change is intentional product scope, behavior, or contract—not merely an implementation detail.

After changing code, run the narrowest relevant checks first, then the project checks:

```text
api: pnpm typecheck
api: pnpm lint
api: pnpm format:check
api: pnpm test
api: pnpm build

app: pnpm typecheck
app: pnpm build
```

If a check cannot run or fails for a pre-existing reason, report it clearly rather than masking it.

## Documentation rules

- Keep `SPEC.md` stable and boundary-oriented. Amend the feature-focus section when priorities change.
- Keep READMEs practical and task-oriented. They should help a developer install, run, and verify the project.
- Keep this file focused on how contributors and agents should work.
- Keep `CLAUDE.md` short and aligned with this file; do not create a second conflicting policy source.
