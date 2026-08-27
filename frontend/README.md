# CharityHub Frontend

Next.js frontend for CharityHub: a digital business card plus a complete UI over
the CharityHub GraphQL API in [`../backend`](../backend) — public campaign pages,
an account page and an admin area for campaign management.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS

## Pages

| Route                   | Who       | Content / API operations                                                                                                                                                                       |
| ----------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                     | Everyone  | Business card: name, role, introduction, technology stack, GitHub/LinkedIn                                                                                                                     |
| `/campaigns`            | Everyone  | All campaigns with progress and status (`campaigns`)                                                                                                                                           |
| `/campaigns/[id]`       | Everyone  | Campaign details and recent donations (`campaign`, `donations`); donation form for signed-in users (`createDonation`); sign-in / registration box for visitors; "Manage campaign" link for admins |
| `/login`                | Everyone  | Sign in or create an account (`login`, `register`); returns to `?next=…` afterwards                                                                                                             |
| `/account`              | Signed in | Profile (`me`) and the complete donation history with totals (`myDonations`)                                                                                                                   |
| `/admin`                | `ADMIN`   | Dashboard: campaign counts, total raised, system status (`health`), every campaign with Edit / Close / Delete (`closeCampaign`, `deleteCampaign`)                                               |
| `/admin/campaigns/new`  | `ADMIN`   | Create a campaign (`createCampaign`)                                                                                                                                                           |
| `/admin/campaigns/[id]` | `ADMIN`   | Edit title / description / target (`updateCampaign`), close or delete the campaign, full donation list with user ids                                                                            |

Who sees what: the header shows **Sign in** to visitors, and the user's name
(→ `/account`) plus **Sign out** once signed in; `ADMIN` accounts also get an
**Admin** link. Protected pages redirect to `/login?next=…`; the admin area shows
an "Administrators only" notice to `USER` accounts. The UI only decides what to
show — the API enforces authentication and the `ADMIN` role on every operation.

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

- No mocked data: every page reads from the real GraphQL API in Server
  Components (`health`, `campaigns`, `campaign`, `donations`, `me`,
  `myDonations`), so the backend URL is never exposed to the browser and no CORS
  configuration is needed.
- Every mutation (`login`, `register`, `createDonation`, `createCampaign`,
  `updateCampaign`, `closeCampaign`, `deleteCampaign`) runs through a Next.js
  Server Action (`src/app/actions.ts`, `src/app/admin/actions.ts`). After signing
  in, the JWT is stored in an **httpOnly cookie** and forwarded as
  `Authorization: Bearer …` on server-side requests only; signing out deletes it.
- The session is resolved once per request (`src/lib/session.ts`, React `cache`)
  and shared by the header and the page. API errors (validation, state rules,
  forbidden) are shown inline in the form that caused them.
- With the seeded database sign in as `user@charityhub.dev` / `User1234!` (donate,
  donation history) or `admin@charityhub.dev` / `Admin123!` (everything, including
  the admin area), or create a new `USER` account from the sign-in page.
- Money values are decimal strings end-to-end; the frontend only formats them
  for display (totals are summed in integer cents, for display only).

## Environment variables

| Variable      | Description                       | Default                         |
| ------------- | --------------------------------- | ------------------------------- |
| `GRAPHQL_URL` | CharityHub GraphQL endpoint (server-side) | `http://localhost:3000/graphql` |
