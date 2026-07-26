# ShuttleStats

Badminton academy score tracker. Admin records doubles match results; the app tracks each
player's individual win/loss record (partners rotate, so stats follow the player, not the team)
and generates shareable standings images.

## Stack

- Next.js (App Router) — frontend + API routes in one app
- MongoDB (Mongoose) — Atlas free tier in production, local `mongod` for development
- `next/og` (`ImageResponse`) — generates the leaderboard/player-card PNGs
- Deploys free on Vercel

## Local development

1. Have a MongoDB instance reachable (local `mongod`, or an Atlas free-tier cluster).
2. Copy `.env.example` to `.env.local` and fill in:
   - `MONGODB_URI` — connection string
   - `ADMIN_PASSWORD` — shared password for the single admin login
   - `SESSION_SECRET` — any long random string (used to sign the login session cookie)
3. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) for the public leaderboard, or
   [http://localhost:3000/login](http://localhost:3000/login) to sign in as admin.

## App structure

- `/` — public leaderboard (no login required)
- `/login` — admin login
- `/admin/players` — add/edit/delete players
- `/admin/matches` — record a doubles match (Team A vs Team B + winner)
- `/admin/report` — generate the shareable leaderboard image and per-player cards
- `/api/*` — route handlers backing the above; `/api/players` and `/api/matches` are
  public for `GET` and admin-only for writes (enforced in `src/proxy.ts`)

Win/loss stats are computed on read from the `Match` collection (`src/lib/stats.ts`) rather
than stored — correct by construction, and cheap at this scale.

## Deploying (free tier)

1. **MongoDB Atlas**: create a free M0 cluster, grab the connection string.
2. **GitHub**: push this repo to a new `shuttle-stats` repo.
3. **Vercel**: import the repo, set the three env vars from `.env.example` in the project
   settings, deploy. Vercel's Hobby plan and Atlas's M0 tier are both free, which is enough
   for this scale (~10 users).
