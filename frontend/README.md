# CharityHub Frontend

Minimal Next.js frontend for CharityHub: a digital business card plus the
campaign pages, all served live by the CharityHub GraphQL API in
[`../backend`](../backend).

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS

## Pages

| Route             | Content                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `/`               | Business card: name, role, introduction, technology stack, GitHub/LinkedIn |
| `/campaigns`      | All campaigns: image, title, description, target, collected, progress, status |
| `/campaigns/[id]` | Campaign details, progress, donation form, recent donations                |

## Running locally

The quickest way is the full stack in Docker from the repository root:
`docker compose up --build` (frontend on http://localhost:3001). To run the
frontend from source instead:

1. Start the backend (see the backend README): PostgreSQL via Docker, migrations,
   seed, then `npm run start:dev` — the API listens on `http://localhost:3000/graphql`.
2. Configure and start the frontend:

```bash
cp .env.local.example .env.local   # GRAPHQL_URL=http://localhost:3000/graphql
npm install
npm run dev                        # http://localhost:3001
```

## How it talks to the API

- No mocked data: every page queries the real GraphQL API (`campaigns`,
  `campaign`, `donations`, `me`) from Server Components, so the backend URL is
  never exposed to the browser and no CORS configuration is needed.
- Mutations (`login`, `register`, `createDonation`) run through Next.js Server
  Actions. After signing in, the JWT is stored in an **httpOnly cookie** and
  forwarded as `Authorization: Bearer …` on server-side requests only.
- Donating requires an account (the API's `createDonation` is authenticated).
  With the seeded database you can sign in as `user@charityhub.dev` /
  `User1234!`, or create a new account from the campaign page.
- Money values are decimal strings end-to-end; the frontend only formats them
  for display.

## Environment variables

| Variable      | Description                       | Default                         |
| ------------- | --------------------------------- | ------------------------------- |
| `GRAPHQL_URL` | CharityHub GraphQL endpoint (server-side) | `http://localhost:3000/graphql` |
