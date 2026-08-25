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

# 4. Generate the Prisma client
npm run prisma:generate

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

## Environment variables

| Variable       | Description                              | Default       |
| -------------- | ---------------------------------------- | ------------- |
| `NODE_ENV`     | `development` \| `production` \| `test`  | `development` |
| `PORT`         | HTTP port the API listens on             | `3000`        |
| `DATABASE_URL` | PostgreSQL connection string for Prisma  | —             |

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
| `npm run test:e2e`        | End-to-end tests                       |

## Project structure

```
prisma/               Prisma schema (models arrive in later steps)
prisma.config.ts      Prisma CLI configuration
src/
  config/             Environment variable validation
  health/             Health GraphQL query
  prisma/             PrismaService (PostgreSQL access via driver adapter)
  generated/          Generated Prisma client (git-ignored)
  schema.gql          Generated GraphQL schema (git-ignored)
docker-compose.yml    Local PostgreSQL
```
