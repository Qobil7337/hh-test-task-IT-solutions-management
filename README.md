# CharityHub

A small, production-style charity platform: a **NestJS + GraphQL API** for
fundraising campaigns and donations (the core of the project), and a minimal
**Next.js** site that doubles as a digital business card and consumes the API.

- Backend: [`backend/`](backend/) — NestJS 11, GraphQL (Apollo Server 5, code-first),
  Prisma 7, PostgreSQL 16, JWT authentication, role-based authorization, tests.
- Frontend: [`frontend/`](frontend/) — Next.js 16 (App Router), React 19, Tailwind CSS.
- Infrastructure: Docker Compose for the whole stack.

## Why this project exists

CharityHub was built as a technical test for a **TypeScript Backend Developer**
position. The goal was to demonstrate, in a small but realistic codebase:

- clean NestJS architecture with thin GraphQL resolvers and business logic in services;
- correct data modelling with Prisma and PostgreSQL, including exact money handling;
- **transactional safety under concurrent donations** — the central technical problem;
- authentication and role-based authorization done the idiomatic NestJS way;
- meaningful unit and end-to-end tests, and a reproducible local environment.

The frontend is intentionally minimal: it proves the API end to end and serves as
an online business card; it is not the focus.

## Architecture

```
                 ┌──────────────────────────────┐
   Browser ───▶  │  Frontend  (Next.js, :3001)  │
                 │  Server Components + Actions │
                 └───────────────┬──────────────┘
                                 │  GraphQL over HTTP (server-side only,
                                 │  JWT forwarded as Bearer header)
                                 ▼
                 ┌──────────────────────────────┐
                 │  Backend  (NestJS, :3000)    │
                 │  /graphql  — Apollo Server   │
                 │  ┌────────────────────────┐  │
                 │  │ Resolvers (thin)       │  │  Guards: JwtAuthGuard → RolesGuard
                 │  │ Services (rules, tx)   │  │  Pipes: ValidationPipe, ParseUUIDPipe
                 │  │ PrismaService          │  │
                 │  └────────────────────────┘  │
                 └───────────────┬──────────────┘
                                 │  Prisma Client (driver adapter, pg)
                                 ▼
                 ┌──────────────────────────────┐
                 │  PostgreSQL 16  (:5432)      │
                 │  users · campaigns · donations
                 └──────────────────────────────┘
```

Request flow for a donation: the browser submits a form → a Next.js Server Action
reads the JWT from an httpOnly cookie → calls `createDonation` on the API → the
resolver delegates to `DonationService`, which runs one database transaction that
locks the campaign row, validates the rules, inserts the donation and updates the
campaign total → the page re-renders with fresh data.

## Technology stack

| Layer      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Runtime    | Node.js (developed on 24; 20+ required), TypeScript (strict) |
| Backend    | NestJS 11, `@nestjs/graphql` + Apollo Server 5 (code-first schema) |
| Data       | Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`), PostgreSQL 16 |
| Auth       | `@nestjs/jwt`, `bcrypt`                                     |
| Validation | `class-validator` / `class-transformer` via a global `ValidationPipe` |
| Testing    | Jest, `@nestjs/testing`, Supertest                          |
| Frontend   | Next.js 16 (App Router, Server Actions), React 19, Tailwind CSS 4 |
| Tooling    | ESLint (type-aware) + Prettier, Docker Compose              |

## Project structure

```
.
├── docker-compose.yml         PostgreSQL + backend + frontend
├── .env.example               Compose-level configuration
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma      User, Campaign, Donation + enums
│   │   ├── migrations/        Prisma Migrate history
│   │   └── seed.ts            Idempotent development seed
│   ├── prisma.config.ts       Prisma CLI config (schema, migrations, seed command)
│   ├── src/
│   │   ├── auth/              register/login, JwtAuthGuard, RolesGuard, @Auth(), @CurrentUser()
│   │   ├── campaign/          CampaignService, CampaignResolver, GraphQL types, DTOs
│   │   ├── donation/          DonationService (transactional), DonationResolver, DTOs
│   │   ├── user/              UserService, GraphQL User type
│   │   ├── health/            health query (app + database status)
│   │   ├── prisma/            PrismaService (global)
│   │   ├── config/            environment validation
│   │   ├── common/            shared money parsing/validation
│   │   ├── generated/         generated Prisma client (git-ignored)
│   │   ├── app.module.ts      module wiring, GraphQL + ValidationPipe setup
│   │   └── main.ts
│   └── test/                  end-to-end tests (real HTTP + real database)
└── frontend/
    ├── Dockerfile
    └── src/
        ├── app/               pages: /, /campaigns, /campaigns/[id]; Server Actions
        ├── components/        cards, progress bar, donation and auth forms
        └── lib/               GraphQL client, typed API calls, cookie helpers
```

## Local development

Prerequisites: Node.js 20+, npm, Docker (for PostgreSQL).

```bash
# 1. Database
docker compose up -d postgres

# 2. Backend  → http://localhost:3000/graphql (Apollo sandbox in development)
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate          # applies migrations (creates them after schema changes)
npm run prisma:seed             # optional development data, see below
npm run start:dev

# 3. Frontend → http://localhost:3001
cd ../frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Useful backend scripts: `npm run lint`, `npm run build`, `npm test`,
`npm run test:e2e` (needs the database), `npm run prisma:migrate:status`.

## Docker setup

The whole stack starts with one command from the repository root:

```bash
cp .env.example .env            # optional — every variable has a development default
docker compose up --build
```

| Service    | URL / port                    | Behaviour                                                        |
| ---------- | ----------------------------- | ---------------------------------------------------------------- |
| `postgres` | `localhost:5432`              | PostgreSQL 16, data persisted in the `charityhub_postgres_data` volume |
| `backend`  | http://localhost:3000/graphql | On start: `prisma migrate deploy` → seed (if `SEED_DATABASE=true`) → API |
| `frontend` | http://localhost:3001         | Production Next.js build; talks to `backend:3000` over the compose network |

Health checks gate the start order (backend waits for PostgreSQL, frontend waits
for a successful `health` query). `docker compose down` keeps the data;
`docker compose down -v` deletes it. The backend image deliberately includes dev
dependencies so migrations and the TypeScript seed can run inside the container — a
production image would be a multi-stage build with production dependencies only.

> **Windows + OneDrive:** if the repository lives in a OneDrive folder with
> *Files On-Demand*, `docker compose build` fails with `invalid file request` because
> Docker cannot read OneDrive placeholder files. Clone outside OneDrive.

## Environment variables

**Docker Compose** (root `.env`, all optional — see [`.env.example`](.env.example)):

| Variable                                              | Description                                   | Default                     |
| ----------------------------------------------------- | --------------------------------------------- | --------------------------- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials and name                 | `charityhub` (all three)    |
| `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`      | Host ports                                    | `5432`, `3000`, `3001`      |
| `NODE_ENV`                                            | Backend mode (`development` enables the sandbox) | `development`            |
| `JWT_SECRET`, `JWT_EXPIRES_IN`                        | JWT signing secret (≥ 16 chars) and lifetime  | dev placeholder, `1h`       |
| `SEED_DATABASE`                                       | Run the development seed on start             | `true`                      |

**Backend** ([`backend/.env.example`](backend/.env.example)) — validated at startup by
[`src/config/env.validation.ts`](backend/src/config/env.validation.ts); the app fails
fast with a descriptive message if anything is missing or invalid:

| Variable         | Description                                          | Default       |
| ---------------- | ---------------------------------------------------- | ------------- |
| `NODE_ENV`       | `development` \| `production` \| `test`              | `development` |
| `PORT`           | HTTP port                                            | `3000`        |
| `DATABASE_URL`   | PostgreSQL connection string                         | required      |
| `JWT_SECRET`     | JWT signing secret, at least 16 characters           | required      |
| `JWT_EXPIRES_IN` | Access token lifetime (`15m`, `1h`, `7d`, …)         | `1h`          |

**Frontend** ([`frontend/.env.local.example`](frontend/.env.local.example)):
`GRAPHQL_URL` — the API endpoint, used server-side only (default
`http://localhost:3000/graphql`).

## Prisma migrations

The schema lives in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma);
history in `backend/prisma/migrations`, tracked by Prisma in the `_prisma_migrations`
table.

```bash
npm run prisma:migrate          # dev: diff schema, create + apply a migration, regenerate client
npm run prisma:migrate:deploy   # prod/CI: apply pending migrations only
npm run prisma:migrate:status   # show applied / pending migrations
```

Two migrations exist: an intentionally empty `init` baseline (established the
migration workflow before any model existed) and `add_domain_models` (users,
campaigns, donations, enums, indexes, foreign keys). The Docker backend runs
`prisma migrate deploy` on every start.

Data model highlights:

- Money columns (`targetAmount`, `collectedAmount`, `amount`) are `DECIMAL(12,2)` —
  exact arithmetic, never floating point. Prisma exposes them as `Decimal` objects.
- `Donation.campaignId` uses `ON DELETE RESTRICT`: campaigns with donations cannot
  be deleted. `Donation.userId` is optional with `ON DELETE SET NULL`: deleting a
  user keeps its donations.
- Indexes follow the query patterns: `(status, createdAt)` on campaigns,
  `(campaignId, createdAt)` and `(userId)` on donations. `users.email` is unique.
- UUID primary keys; `collectedAmount` is denormalised on the campaign and
  maintained transactionally by the donation flow.

## Seed data

```bash
npm run prisma:seed             # backend/ — or automatic in Docker (SEED_DATABASE=true)
```

[`backend/prisma/seed.ts`](backend/prisma/seed.ts) creates an ADMIN and a USER
account (bcrypt-hashed passwords), three campaigns covering every status (active,
fully funded → `COMPLETED`, `CLOSED`) and seven donations. It is **idempotent**:
records have fixed ids (users are matched by email) and are upserted, and campaign
totals are recomputed from the donations in the database, so it can be re-run safely.

| Role  | Email                  | Password    |
| ----- | ---------------------- | ----------- |
| ADMIN | `admin@charityhub.dev` | `Admin123!` |
| USER  | `user@charityhub.dev`  | `User1234!` |

Development-only credentials. Registration through the API always creates `USER`
accounts; admins are provisioned via the seed or SQL.

## GraphQL API examples

Endpoint: `POST http://localhost:3000/graphql` (Apollo sandbox in the browser when
`NODE_ENV=development`). Money is transported as **decimal strings** (`"1500.00"`).

```graphql
# Health — application liveness and live database connectivity
{ health { status database timestamp } }

# Register / login → JWT
mutation { register(input: { name: "Alice", email: "alice@example.com", password: "secret-password" }) { accessToken user { id role } } }
mutation { login(input: { email: "admin@charityhub.dev", password: "Admin123!" }) { accessToken } }

# Protected operations send:  Authorization: Bearer <accessToken>
{ me { id name email role } }

# Campaigns (public reads)
{ campaigns { id title status targetAmount collectedAmount } }
{ campaign(id: "c0000000-0000-4000-8000-000000000001") { title description status collectedAmount } }

# Campaign management (ADMIN only)
mutation { createCampaign(input: { title: "Winter shelter", description: "…", targetAmount: "10000.00" }) { id status } }
mutation { updateCampaign(id: "<id>", input: { title: "New title", targetAmount: "12000.00" }) { id } }
mutation { closeCampaign(id: "<id>") { status } }
mutation { deleteCampaign(id: "<id>") { id } }

# Donations (authenticated)
mutation { createDonation(input: { campaignId: "<id>", amount: "200.00", donorName: "Alice" }) { id amount } }
{ myDonations { amount donorName createdAt } }

# Donations of a campaign (public), newest first
{ donations(campaignId: "<id>") { donorName amount createdAt } }
```

Errors follow NestJS semantics inside the GraphQL `errors` array: not found,
conflict (state rules), bad request (validation), unauthorized, forbidden.

## Authentication

- Passwords are stored only as **bcrypt** hashes (cost 10); the GraphQL `User` type
  has no password field, so hashes can never leave the server.
- `login` returns a signed **JWT** (`sub` = user id) with the lifetime from
  `JWT_EXPIRES_IN`. Unknown email and wrong password produce the *same* error
  message, avoiding account enumeration by message.
- `JwtAuthGuard` reads the `Bearer` token from the GraphQL request, verifies it and
  **loads the user fresh from the database** — so a deleted account's token stops
  working immediately — then exposes the user to resolvers via `@CurrentUser()`.
- Emails are normalised (trimmed, lower-cased); registration is rejected for a
  duplicate email (unique constraint → conflict).
- The frontend keeps the token in an **httpOnly cookie** and only ever uses it
  server-side (Server Components / Server Actions).

## Authorization

Roles: `USER` (default) and `ADMIN`. A single composed decorator wires everything,
so resolvers never repeat guard or role checks:

```ts
@Auth()            // any authenticated user  → JwtAuthGuard
@Auth(Role.ADMIN)  // authenticated + role     → JwtAuthGuard, then RolesGuard
```

`RolesGuard` compares the roles declared via `@Roles()` metadata against the user's
role as loaded from the database (not from the token), so role changes apply at once.

| Operation                                                                  | Access        |
| -------------------------------------------------------------------------- | ------------- |
| `health`, `campaigns`, `campaign`, `donations`, `register`, `login`        | Public        |
| `me`, `createDonation`, `myDonations`                                      | Authenticated |
| `createCampaign`, `updateCampaign`, `closeCampaign`, `deleteCampaign`      | `ADMIN`       |

## Testing

```bash
cd backend
npm test            # unit tests (mocked Prisma)            — 42 tests
npm run test:e2e    # end-to-end against the real database  — 21 tests
```

Unit tests cover the business rules in isolation: campaign create/update/close/delete
rules, donation validation, exceed/complete behaviour, the re-check-after-lock
scenario, login success/failure paths, password hashing, and `RolesGuard`.

End-to-end tests boot the full NestJS app against PostgreSQL and go through real
HTTP: the health query, the complete authentication flow (register, login,
invalid password, unknown user, `me` with/without/with-malformed token, duplicate
email), the authorization matrix (unauthenticated / `USER` / `ADMIN` on every
protected operation, own-donation history), and — most importantly — a real
**concurrency test**: 10 parallel donations of 25.00 against a 100.00 target must
end with exactly 4 accepted, 6 rejected, `collectedAmount` exactly 100.00 and
status `COMPLETED`.

Lint (`npm run lint`, type-aware ESLint + Prettier) and `npm run build` are part of
the workflow; the frontend has its own `lint` and `build`.

## Important business rules

Campaigns

- A campaign must exist before it can be updated, closed or deleted.
- `COMPLETED` and `CLOSED` campaigns cannot be modified or closed again.
- `targetAmount` must be greater than zero (format validated at the DTO, value
  checked with exact decimals in the service).
- `collectedAmount` and `status` are never client-settable: the update input has no
  such fields and the service builds the update from an explicit whitelist.
- A campaign with donations cannot be deleted (database `RESTRICT`, mapped to a
  conflict error).

Donations

- The campaign must exist and be `ACTIVE`; the amount must be greater than zero.
- A donation must not exceed the remaining amount; if it does, **the entire donation
  is rejected** (no partial acceptance). Example: target 10,000 / collected 9,800 —
  a 200 donation completes the campaign, a 500 donation is rejected.
- When `collectedAmount` reaches `targetAmount`, the campaign is automatically
  marked `COMPLETED` in the same transaction.
- The donor's `userId` is taken from the authenticated user, never from the client.

## Donation concurrency strategy

The dangerous interleaving: two donations read `collectedAmount = 9,800` at the same
time, both decide "200 still fits", both write — and the target is overshot.
[`DonationService.create`](backend/src/donation/donation.service.ts) prevents it
with **pessimistic row locking inside one transaction**:

1. `prisma.$transaction(async (tx) => …)` opens an interactive transaction.
2. `SELECT id FROM campaigns WHERE id = $1 FOR UPDATE` takes an exclusive lock on
   that campaign row. A competing donation transaction **blocks here** until the
   first one commits or rolls back — donations to the same campaign are serialised
   by the database; other campaigns are unaffected.
3. Only after acquiring the lock is the campaign re-read, so the checks (exists,
   `ACTIVE`, amount ≤ remaining) run against the latest committed state.
4. The donation row is inserted and the campaign total (plus `COMPLETED` when the
   target is reached) is updated in the same transaction; commit releases the lock.
5. Any rule violation throws, rolling everything back.

Why this over the alternatives: `SERIALIZABLE` isolation needs retry loops for
serialisation failures, and a single conditional `UPDATE` cannot distinguish "not
found" / "not active" / "exceeds remaining" for error reporting. One row lock taken
first is simple, deadlock-free and easy to reason about. The guarantee is verified
by the real-database concurrency e2e test described above.

## Important architectural decisions

- **Thin resolvers, fat services.** Every resolver method is a one-line delegation;
  all rules live in services that are unit-tested with a mocked `PrismaService`.
- **Exact money end to end.** `DECIMAL(12,2)` in PostgreSQL, `Decimal` in the
  service layer, decimal strings over GraphQL; input format enforced by a DTO regex
  (max two fraction digits). No `number` is ever used for money arithmetic.
- **Prisma 7 with the driver adapter** (`@prisma/adapter-pg`, no Rust engine); the
  client is generated into `src/generated` (CommonJS) so Nest, Jest and the seed
  share one build model. `PrismaService` connects on module init but does not crash
  the app if the database is down — the `health` query reports the live state instead.
- **Environment validation without extra libraries** — a small typed validator on
  top of `@nestjs/config` fails fast with all problems listed.
- **Authorization as metadata + guards** (`@Roles`, `RolesGuard`, composed into
  `@Auth`) — the idiomatic NestJS approach, no role checks scattered in resolvers.
- **Database-enforced invariants** where possible: unique email, foreign-key
  `RESTRICT` / `SET NULL`, and the row lock above — not just application code.
- **Frontend talks to the API only from the server** (Server Components and Server
  Actions): no API URL or token in the browser, no CORS configuration needed, and
  the JWT lives in an httpOnly cookie.
- **One Compose file for the whole stack**, with migrations and the idempotent seed
  applied automatically on backend start.

## Known limitations

Deliberately out of scope for this test: pagination, refresh tokens / token
revocation (tokens simply expire), campaign images (the frontend draws a
deterministic placeholder), an admin UI (campaign management is done through the
GraphQL sandbox), rate limiting, and a production-hardened (multi-stage) backend
image.
