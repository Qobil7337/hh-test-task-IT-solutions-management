# CharityHub API

Backend for the CharityHub charity platform.

**Stack:** Node.js · TypeScript · NestJS · GraphQL (Apollo, code-first) · Prisma · PostgreSQL · Docker

## Requirements

- Node.js 20+
- Docker (for the local PostgreSQL database)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Generate the Prisma client and apply migrations
npm run prisma:generate
npm run prisma:migrate

# 5. Run the app
npm run start:dev
```

The GraphQL endpoint (with the Apollo sandbox in non-production) is available at:

```
http://localhost:3000/graphql
```

## Health check

```graphql
query {
  health {
    status
    database
    timestamp
  }
}
```

`status` is the application liveness (`ok`), `database` reports live PostgreSQL
connectivity (`up` / `down`), and `timestamp` is the ISO-8601 time of the check.

## Database (PostgreSQL)

Local PostgreSQL 16 runs in Docker, defined in [docker-compose.yml](docker-compose.yml).
Credentials, database name, and port come from the `POSTGRES_*` variables in `.env`
(Docker Compose loads it automatically); data is persisted in the named Docker
volume `charityhub_postgres_data`, so it survives container restarts and recreation.

```bash
# Start (detached); --wait blocks until the healthcheck passes
docker compose up -d --wait

# Status and logs
docker compose ps
docker compose logs -f postgres

# Open a psql shell inside the container
docker compose exec postgres psql -U charityhub -d charityhub

# Stop (keeps data)
docker compose down

# Stop and DELETE all data (removes the volume)
docker compose down -v
```

The application connects through Prisma using `DATABASE_URL`, which must match the
`POSTGRES_*` values. Connectivity is observable in two places: the startup log
(`Connected to PostgreSQL`) and the `health` query's `database` field.

## Prisma

- [prisma/schema.prisma](prisma/schema.prisma) — data model (domain models arrive in
  later steps) and client generator. The client is generated into `src/generated/prisma`
  (git-ignored), so `npm run prisma:generate` must be run after cloning and after
  every schema change.
- [prisma.config.ts](prisma.config.ts) — Prisma CLI configuration (schema location,
  migrations path, datasource URL from `.env`).
- [src/prisma/prisma.service.ts](src/prisma/prisma.service.ts) — `PrismaService`
  extends the generated `PrismaClient` and connects to PostgreSQL through the
  `@prisma/adapter-pg` driver adapter using `DATABASE_URL` from `ConfigService`.
  It connects on module init and disconnects on shutdown. It is provided by the
  global `PrismaModule`, so any feature module can inject it.

### Migrations

Migrations live in `prisma/migrations` and are tracked by Prisma in the
`_prisma_migrations` table.

```bash
# Create + apply a migration after changing schema.prisma (development)
npm run prisma:migrate

# Apply pending migrations without generating new ones (production/CI)
npm run prisma:migrate:deploy

# Show applied/pending migrations
npm run prisma:migrate:status
```

The initial `init` migration is intentionally empty: it establishes the migration
baseline before any domain models exist.

## Authentication

Email + password authentication with bcrypt-hashed passwords and JWT access
tokens ([src/auth/](src/auth/)).

```graphql
mutation {
  register(input: { name: "Alice", email: "alice@example.com", password: "secret-password" }) {
    accessToken
    user { id email role }
  }
}

mutation {
  login(input: { email: "alice@example.com", password: "secret-password" }) {
    accessToken
  }
}

# Protected — requires the header  Authorization: Bearer <accessToken>
query { me { id name email role } }
```

Passwords are stored only as bcrypt hashes; login returns the same error for an
unknown email and a wrong password (no account enumeration). Protected
operations use `JwtAuthGuard`, which verifies the token and loads the current
user (available in resolvers via the `@CurrentUser()` decorator). Role-based
authorization is not implemented yet.

## Environment variables

| Variable            | Description                                        | Default       |
| ------------------- | -------------------------------------------------- | ------------- |
| `NODE_ENV`          | `development` \| `production` \| `test`            | `development` |
| `PORT`              | HTTP port the API listens on                       | `3000`        |
| `POSTGRES_USER`     | PostgreSQL user (docker-compose)                   | `charityhub`  |
| `POSTGRES_PASSWORD` | PostgreSQL password (docker-compose)               | `charityhub`  |
| `POSTGRES_DB`       | PostgreSQL database name (docker-compose)          | `charityhub`  |
| `POSTGRES_PORT`     | Host port PostgreSQL is exposed on (docker-compose)| `5432`        |
| `DATABASE_URL`      | PostgreSQL connection string for Prisma            | —             |
| `JWT_SECRET`        | Secret for signing JWTs (min 16 chars)             | —             |
| `JWT_EXPIRES_IN`    | Access token lifetime (e.g. `15m`, `1h`, `7d`)     | `1h`          |

All variables are validated on startup ([src/config/env.validation.ts](src/config/env.validation.ts));
the app fails fast with a descriptive error if the configuration is invalid.

## Scripts

| Script                    | Description                            |
| ------------------------- | -------------------------------------- |
| `npm run start:dev`       | Start in watch mode                    |
| `npm run build`           | Compile TypeScript to `dist/`          |
| `npm run start:prod`      | Run the compiled build                 |
| `npm run lint`            | ESLint (with autofix)                  |
| `npm run format`          | Prettier                               |
| `npm run prisma:generate` | Regenerate the Prisma client           |
| `npm run prisma:migrate`  | Create/apply migrations (development)  |
| `npm run prisma:migrate:deploy` | Apply pending migrations (production/CI) |
| `npm run prisma:migrate:status` | Show migration status            |
| `npm run test:e2e`        | End-to-end tests                       |

## Project structure

```
prisma/
  schema.prisma       Prisma schema (models arrive in later steps)
  migrations/         Prisma migrations (applied via prisma migrate)
prisma.config.ts      Prisma CLI configuration
src/
  auth/               Authentication (register/login, JWT guard, current user)
  campaign/           Campaign module (service, resolver, GraphQL types)
  common/             Shared helpers (money parsing/validation)
  config/             Environment variable validation
  donation/           Donation module (service, resolver, GraphQL types)
  user/               User module (data access, GraphQL User type)
  health/             Health GraphQL query
  prisma/             PrismaService (PostgreSQL access via driver adapter)
  generated/          Generated Prisma client (git-ignored)
  schema.gql          Generated GraphQL schema (git-ignored)
docker-compose.yml    Local PostgreSQL
```
