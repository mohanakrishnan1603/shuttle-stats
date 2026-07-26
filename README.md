# ShuttleStats

Badminton academy score tracker. Admin records doubles match results; the app tracks each
player's individual win/loss record (partners rotate, so stats follow the player, not the team)
and generates shareable standings images and detailed PDF reports.

## Stack

- Next.js (App Router) — frontend + API routes in one app
- MongoDB (Mongoose) — Atlas free tier in production, local `mongod` for development
- `next/og` (`ImageResponse`) — generates the leaderboard/player-card PNGs
- `@react-pdf/renderer` — generates the detailed PDF report
- Deploys free on Vercel

## Local development

1. Have a MongoDB instance reachable (local `mongod`, or an Atlas free-tier cluster).
2. Copy `.env.example` to `.env.local` and fill in:
   - `MONGODB_URI` — connection string
   - `SESSION_SECRET` — any long random string (used to sign the login session cookie)
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your first admin login (also how you reset a password later — same command, same
   username):

   ```bash
   npm run create-admin
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000/login](http://localhost:3000/login) and sign in with the
   username/password you just created.

## App structure

Everything requires the admin login — there is no public/unauthenticated page.

- `/login` — admin login (username + password, checked against the `users` collection)
- `/admin/leaderboard` — standings, filterable by month or all-time
- `/admin/players` — add/edit/delete players
- `/admin/matches` — record a doubles match (Team A vs Team B + winner)
- `/admin/report` — generate the shareable leaderboard/player-card images and the detailed PDF
  report, for any month or a custom date range
- `/api/*` — route handlers backing the above, all protected in `src/proxy.ts`

Win/loss stats are computed on read from the `Match` collection (`src/lib/stats.ts`) rather
than stored — correct by construction, and cheap at this scale.

## Deploying (free tier)

1. **MongoDB Atlas**: create a free M0 cluster, grab the connection string, and make sure
   Network Access allows connections from anywhere (`0.0.0.0/0`) since Vercel's IPs aren't
   static.
2. **GitHub**: push this repo.
3. **Vercel**: import the repo, set `MONGODB_URI` and `SESSION_SECRET` in the project
   settings, deploy. Vercel's Hobby plan and Atlas's M0 tier are both free, which is enough
   for this scale (~10 users).
4. **Create the admin login**: run `npm run create-admin` locally with `MONGODB_URI` pointed
   at the same production database (it reads `.env.local` automatically) — this writes
   directly to the same `users` collection the deployed app reads from, no redeploy needed.
