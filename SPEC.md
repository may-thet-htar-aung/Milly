# Milly — Second-hand Market Platform Specification

**Status:** Draft for implementation  
**Project type:** Three independent applications with separate repositories  
**Primary currencies:** USD and MMK  
**Payments:** Not integrated in the first release

## How to use this specification

This document is the product and architecture boundary for the entire Milly project. It defines the user-visible feature focus, domain concepts, API/client contracts, non-goals, security expectations, acceptance criteria, and decisions that must remain consistent across web, mobile, and API implementations.

The feature focus is intentionally changeable. When priorities change, update the feature-focus statement, affected requirements, delivery phases, and acceptance criteria together. Do not use this document as a local setup guide or agent instruction manual; those responsibilities belong to the project READMEs and `AGENTS.md`.

### Current feature focus

For v1, Milly focuses on second-hand marketplace discovery and seller-managed listings:

- browse, search, filter, paginate, and inspect active listings;
- display prices in the seller's original USD or MMK currency;
- register, authenticate, and maintain a public seller identity;
- create, publish, edit, reserve, mark sold, and archive listings;
- favorite listings and view saved listings;
- view seller profiles and report listings;
- provide the core experience through web and mobile clients;
- protect moderation operations behind admin authorization.

Payments, checkout, orders, shipping, real-time messaging, notifications, auctions, and identity verification are outside this feature focus unless this specification is explicitly amended.

## 1. Product overview

Milly is a second-hand marketplace where people can discover, publish, and manage listings for used goods. Buyers can browse listings, filter results, inspect item details, save items, and contact sellers. Sellers can create listings, manage listing status, and respond to buyer interest.

The first release is intentionally focused on marketplace discovery and seller/buyer communication. Checkout, payment collection, shipping orchestration, and order fulfillment are out of scope for now.

## 2. Repository structure

Milly is split into three independently deployable projects. Each project must have its own repository, package manifest, environment configuration, CI workflow, and README.

| Project | Responsibility | Suggested repository |
|---|---|---|
| `milly-app` | Web marketplace for desktop and mobile browsers | Separate repository |
| `milly-api` | REST API, authentication, persistence, seed data | Separate repository |
| `milly-mobile` | Native iOS and Android marketplace client | Separate repository |

The root project containing this specification is documentation only and is not required to be a monorepo.

## 3. Goals

- Make second-hand listings easy to publish and discover.
- Support a trustworthy account and seller identity model.
- Provide consistent marketplace functionality on web and mobile.
- Display and filter prices in USD and MMK.
- Keep the API independently consumable by both clients.
- Provide substantial realistic sample data for local development and demos.
- Establish a clean foundation for future messaging, moderation, payments, and shipping.

## 4. Non-goals for v1

- Payment processing or escrow.
- Shopping cart, checkout, or completed orders.
- Shipping labels, delivery tracking, or logistics integrations.
- Real-time chat or push notifications.
- Automated identity verification.
- Auctions, bidding, or price negotiation workflows.
- Multi-vendor payouts.
- Production-grade image hosting provider integration.

## 5. Shared domain concepts

### Users

- `id`
- `name`
- `email`
- `passwordHash`
- `avatarUrl` (optional)
- `phone` (optional)
- `bio` (optional)
- `location` (optional)
- `role`: `USER` or `ADMIN`
- `createdAt`, `updatedAt`

### Categories

Use a hierarchical category model with an optional `parentId`. Initial categories should include:

- Electronics
- Phones and Tablets
- Computers
- Home and Furniture
- Fashion
- Shoes and Accessories
- Vehicles and Parts
- Baby and Kids
- Books and Media
- Sports and Outdoors
- Beauty and Personal Care
- Other

### Listings

- `id`
- `sellerId`
- `categoryId`
- `title`
- `description`
- `priceAmount` — decimal value stored in the listing currency's smallest practical precision
- `currency` — `USD` or `MMK`
- `condition` — `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`, or `POOR`
- `status` — `DRAFT`, `ACTIVE`, `SOLD`, `RESERVED`, or `ARCHIVED`
- `location`
- `latitude`, `longitude` (optional and privacy-conscious)
- `viewCount`
- `publishedAt`
- `createdAt`, `updatedAt`

### Listing images

- `id`
- `listingId`
- `url`
- `sortOrder`
- `altText` (optional)

The API should use an image-storage abstraction. Local development may use seed URLs or local placeholders; the production storage provider can be selected later.

### Favorites

A user can favorite or unfavorite a listing. Enforce a unique constraint on `(userId, listingId)`.

### Reports

Users can report listings or users for moderation. Initial report reasons:

- `SPAM`
- `FRAUD`
- `PROHIBITED_ITEM`
- `INACCURATE_INFORMATION`
- `HARASSMENT`
- `OTHER`

## 6. Currency requirements

- Every listing has exactly one currency: `USD` or `MMK`.
- The UI must show the currency code and a localized formatted amount.
- Users can filter listings by currency.
- Do not silently convert or imply live exchange rates in v1.
- If conversion is added later, it must show the exchange-rate timestamp and clearly distinguish converted values from the seller's original price.
- Prices must be validated as positive values and stored without floating-point loss.

## 7. Authentication and authorization

### Authentication

The API uses JWT authentication with:

- Short-lived access tokens.
- Refresh-token support designed so token rotation can be added without changing client contracts.
- Password hashing using a strong adaptive password-hashing library.
- Email and password registration/login for v1.

The exact token transport may differ by client:

- Web: prefer secure, httpOnly cookies for refresh tokens and memory/query state for access tokens.
- Mobile: store refresh credentials only in Expo SecureStore; never use unencrypted device storage.

### Authorization

- Public users can browse active listings and public seller profiles.
- Authenticated users can create listings, manage their own listings, favorite listings, and submit reports.
- Only the listing owner or an admin can edit, reserve, archive, or mark a listing sold.
- Admins manage marketplace listings, reports, and users. They do not use seller navigation or create listings for themselves.
- Admin listing review tracks seller listings. Admins do not edit a seller's listing or change its seller-owned status from the admin listing page. Admins can hide a listing from the public marketplace; the seller still sees it in their own listings with its existing status.
- Admin-only moderation endpoints must be protected by role checks.

## 8. API specification

### Technical stack

- Node.js with TypeScript.
- Express.
- SQLite for local and initial deployment use.
- Prisma ORM, version 7.
- JWT authentication.
- REST/JSON API.
- Zod or an equivalent schema-validation library for request validation.
- OpenAPI documentation should be generated or maintained before public API release.

### API conventions

- Base path: `/api/v1`.
- JSON responses use consistent envelopes for errors and paginated collections.
- Dates are ISO 8601 UTC strings.
- IDs are opaque strings; UUIDs are recommended.
- List endpoints use `page`, `pageSize`, and stable sorting.
- Default listing sort: newest first.
- API errors include a stable machine-readable `code`, human-readable `message`, and optional `details`.
- CORS origins and rate limits are environment-configured.

### Core endpoints

#### Health

- `GET /health`
- `GET /api/v1/health`

#### Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

#### Users

- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/me` — profile fields. Email and password changes require the current password as authorization.
- `GET /api/v1/users/me/listings`
- `GET /api/v1/users/me/favorites`

#### Categories

- `GET /api/v1/categories`
- `GET /api/v1/categories/:id`

#### Listings

- `GET /api/v1/listings`
- `POST /api/v1/listings`
- `GET /api/v1/listings/:id`
- `PATCH /api/v1/listings/:id`
- `DELETE /api/v1/listings/:id` — archive/delete according to lifecycle rules
- `POST /api/v1/listings/:id/publish`
- `POST /api/v1/listings/:id/reserve`
- `POST /api/v1/listings/:id/mark-sold`
- `POST /api/v1/listings/:id/favorite`
- `DELETE /api/v1/listings/:id/favorite`
- `POST /api/v1/listings/:id/report`

Supported listing query parameters should include:

- `q`
- `categoryId`
- `condition`
- `currency`
- `minPrice`, `maxPrice`
- `location`
- `sellerId`
- `status`
- `sort`: `newest`, `price_asc`, `price_desc`, `most_viewed`
- `page`, `pageSize`

#### Admin/moderation

- `GET /api/v1/admin/reports`
- `PATCH /api/v1/admin/reports/:id`
- `GET /api/v1/admin/listings` — optional `sellerId` limits results to one seller
- `PATCH /api/v1/admin/listings/:id/visibility` — set `hidden` to hide a listing from the public marketplace or show it again, without changing the seller's listing status
- `PATCH /api/v1/admin/listings/:id/status`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id` — seller account detail, including phone, location, and total, active, and archived listing counts
- `PATCH /api/v1/admin/users/:id/status` — set `isActive` to deactivate or reactivate an account

## 9. Web application: `milly-app`

### Stack

- React with TypeScript.
- React Router.
- TanStack React Query for server state, caching, mutations, and invalidation.
- shadcn/ui using preset `b1iABqBwrw`.
- Tailwind CSS as required by the shadcn setup.
- Vite is recommended as the build tool.

### Primary routes

- `/` — home/discovery feed
- `/listings` — searchable and filterable listing results
- `/listings/:id` — listing detail
- `/sell` — create listing
- `/listings/:id/edit` — edit own listing
- `/published-products` — seller's published listings
- `/archive-products` — seller's archived listings
- `/favorites` — saved listings
- `/profile/:id` — public seller profile
- `/account` — current user's profile and settings
- `/my-listings` — seller dashboard titled “Manage Your Product Listings,” grouped into All Listings, Published (active), Drafts, Pending Review (reserved), and Sold
- `/login`
- `/register`
- `/admin` — admin dashboard
- `/admin/listings` — all marketplace listings
- `/admin/listings/:id` — admin listing detail
- `/admin/reports` — admin report queue
- `/admin/reports/:id` — admin report detail
- `/admin/users` — user management
- `/admin/users/:id` — admin user detail
- `/admin/account` — admin account
- Admin navigation is Dashboard, Listings, Reports, Users, and Account. Admins do not use seller navigation.

### Required web experiences

- Responsive navigation with search, category access, authentication state, and sell CTA.
- Listing cards with image, title, condition, location, price, currency, and favorite action.
- Search and filters that are reflected in the URL for shareable results.
- Empty, loading, error, and pagination states for all server-backed screens.
- Listing detail page with image gallery, seller summary, item information, location, and contact-interest CTA.
- Authenticated seller flow for drafting, publishing, editing, reserving, selling, and archiving listings.
- Accessible forms with client and server validation.
- Responsive layout for desktop, tablet, and mobile browser widths.

### Web state rules

- React Query owns server state.
- Local component state owns transient form and UI state.
- Authentication state must not be duplicated in multiple unrelated stores.
- Mutations invalidate affected listing, user, favorite, and dashboard queries.
- Use optimistic updates only for low-risk interactions such as toggling favorites.

## 10. Mobile application: `milly-mobile`

### Stack

- React Native with TypeScript.
- Expo.
- Expo Router is recommended for file-based navigation.
- TanStack React Query for API state, shared query behavior, and mutation handling.
- Expo SecureStore for sensitive authentication storage.

### Mobile navigation

Use a tab-based shell with stack screens where appropriate:

- Home/discover
- Search/categories
- Favorites
- My listings
- Account

Stack screens should include listing detail, seller profile, create/edit listing, login, registration, and report listing.

### Required mobile capabilities

- Browse and search listings.
- Filter by category, currency, condition, price range, and location.
- View listing image galleries.
- Authenticate and maintain a session securely.
- Create and edit listings with image selection.
- Favorite/unfavorite listings.
- Manage listing status.
- Submit reports.
- Handle offline/loading/error states gracefully.

Mobile-specific behavior should include safe-area support, keyboard-aware forms, platform-appropriate permissions, and accessible touch targets.

## 11. Sample data and seeding

The API repository must include a deterministic Prisma seed command that creates enough data for realistic demos and UI development.

Minimum seed target:

- 1 admin account.
- 20 regular users.
- 12 categories, including nested categories.
- At least 100 listings distributed across categories.
- Listings in both USD and MMK.
- Every condition and listing status represented where appropriate.
- At least 2–5 images per active listing using stable placeholder image URLs.
- Favorites and reports for representative user flows.

Seed credentials must be documented for local development and must never be reused in production.

The seed process must be idempotent or provide a clearly documented reset option for local databases.

## 12. Project-level configuration

Each repository should provide:

- `.env.example` with no secrets.
- Development, test, and production configuration guidance.
- Formatting and linting scripts.
- Type checking.
- Unit and integration test commands.
- A CI workflow that installs dependencies, validates formatting, runs type checks, runs tests, and builds the project.
- A README describing setup, environment variables, scripts, and API/client integration.

Recommended shared conventions:

- TypeScript strict mode.
- ESLint and Prettier.
- pnpm unless the team selects another package manager before implementation.
- Conventional commit messages are recommended but not required.

## 13. Quality and security requirements

- Validate every external API input on the server.
- Never return password hashes, refresh-token secrets, or internal security metadata.
- Apply authentication and ownership checks to every private mutation.
- Add rate limiting to authentication and report endpoints.
- Use secure headers and a restrictive production CORS configuration.
- Avoid exposing precise seller location unless the seller explicitly provides it for display.
- Prevent IDOR vulnerabilities by checking ownership server-side.
- Sanitize or safely render user-authored listing text.
- Add tests for authentication, listing ownership, price/currency validation, pagination, favorites, and moderation authorization.
- Log operational errors without logging passwords, tokens, or sensitive personal data.

## 14. Testing strategy

### API

- Unit tests for validation, auth utilities, currency rules, and permission checks.
- Integration tests against a disposable SQLite database.
- Endpoint tests for auth, listing CRUD, search/filtering, favorites, reports, and admin actions.

### Web

- Component tests for listing cards, filters, forms, and auth states.
- Query/mutation tests for critical flows.
- End-to-end coverage for registration/login, browse/search, create listing, favorite, and status management.

### Mobile

- Component tests for core screens and forms.
- Navigation and auth-session tests.
- Device/simulator smoke tests for browsing, listing creation, image selection, and secure logout.

## 15. Delivery phases

### Phase 1 — Foundation

- Create the three repositories.
- Configure TypeScript, linting, formatting, CI, environment files, and API client conventions.
- Implement Prisma schema, migrations, seed data, health checks, and basic auth.

### Phase 2 — Marketplace core

- Implement categories and listing CRUD.
- Implement public listing search/filtering and pagination.
- Build web discovery, detail, auth, and seller flows.
- Build mobile discovery, detail, auth, and seller flows.

### Phase 3 — Trust and polish

- Add favorites, reports, admin moderation, status transitions, and validation hardening.
- Add responsive/accessibility polish, error recovery, analytics hooks, and test coverage.

### Phase 4 — Future extensions

- Messaging and notifications.
- Payment integration.
- Orders, shipping, and seller payouts.
- Currency conversion with an approved exchange-rate source.

## 16. Acceptance criteria for v1

- A new user can register and log in from web and mobile.
- An authenticated user can create a listing with title, description, price, currency, category, condition, location, and images.
- A seller can publish, edit, reserve, mark sold, and archive their own listing.
- A visitor can search, filter, paginate, and view active listings in both USD and MMK.
- A user can favorite/unfavorite a listing and view their favorites.
- A user can view a seller profile and report a listing.
- Admin-protected moderation endpoints and UI prevent unauthorized access.
- The seeded environment contains enough data to exercise all core screens and states.
- API, web, and mobile projects can be installed and run independently from their respective repositories.
- No v1 screen presents payment collection or implies that payment has occurred.

## 17. Open decisions before implementation

These choices are intentionally left flexible and can be confirmed before coding begins:

1. Preferred deployment targets for the API, web app, and mobile builds.
2. Production image-storage provider.
3. Whether seller contact is represented by a phone/email CTA in v1 or deferred until messaging exists.
4. Whether listing location is free text only or includes a controlled city/region dataset.
5. Whether refresh tokens should be persisted in the database for revocation and device/session management.
6. Whether the web app should support social login in a later phase.
