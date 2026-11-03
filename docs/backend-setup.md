# Backend setup

The games work without any of this. Until the variables below exist, the portal shows the board as "Em breve" and keeps every result in the browser. This guide lists what has to be configured outside the repository; nothing here has been set up yet for production.

## Environment variables

| Variable | Used by | Where | Value |
| --- | --- | --- | --- |
| `DATABASE_URL` | the app at runtime | Vercel (Production and Preview), `.env.local` | Neon **pooled** connection string (host contains `-pooler`), with `sslmode=require` |
| `DATABASE_URL_UNPOOLED` | `prisma migrate` only | your machine or the CI job that migrates | Neon **direct** connection string. The Neon integration for Vercel creates it with this name. Falls back to `DATABASE_URL` when missing. |
| `COMPETITION_SECRET` | signs run tickets and hashes addresses | Vercel (different values for Production and Preview), `.env.local` | at least 32 characters, e.g. `openssl rand -base64 48`. Changing it invalidates tickets of matches in progress, nothing else. |
| `CRON_SECRET` | protects `/api/cron/cleanup` | Vercel (Production) | at least 16 characters, e.g. `openssl rand -hex 32`. Vercel sends it to the cron job automatically. |

Never prefix these with `NEXT_PUBLIC_`; none of them may reach the browser.

## Production (Vercel + Neon)

1. Create a Neon project. Pick the region closest to the Vercel functions region of the project (or move both to São Paulo: Neon `aws-sa-east-1`, Vercel `gru1`), because every submission is a few round trips to the database.
2. Connect it to the Vercel project through the Neon integration, or add `DATABASE_URL` by hand. For Preview deployments, use a separate Neon branch so tests never touch real players.
3. Add `COMPETITION_SECRET` and `CRON_SECRET` in Vercel → Settings → Environment Variables.
4. Apply the migrations against the production branch from a trusted machine:

   ```bash
   DATABASE_URL_UNPOOLED="<direct connection string>" npm run db:deploy
   ```

   Migrations are not run during the Vercel build on purpose: a Preview build must never change the production schema.
5. Redeploy, then open `/api/status`. It should answer `{"status":"online"}`. `unconfigured` means a variable is missing or the secret is too short; `offline` means the database is unreachable.
6. The daily cleanup runs from `vercel.json` at 07:00 UTC (04:00 in São Paulo). Check Vercel → Cron Jobs after the first deploy.

## Local development

```bash
npm run db:up
```

Starts Postgres 17 in Docker on port 54404 (`compose.yaml`). Then create `.env.local`:

```bash
DATABASE_URL=postgresql://canal404:canal404@localhost:54404/canal404
COMPETITION_SECRET=<output of: openssl rand -base64 48>
```

```bash
npm run db:migrate
```

Applies the migrations (and creates new ones after a schema change). Run `npm run dev` as usual.

## Tests

```bash
npm run test:db
```

Runs the server and database tests against `canal404_test` on the local container (the database is created and migrated automatically; the name must contain `test`). `npm test` runs everything and skips the database tests when `TEST_DATABASE_URL` is not set. CI runs them against a Postgres service and fails if they are skipped. The browser tests for the board run when `/api/status` is online, and CI requires them with `E2E_REQUIRE_DB`.

## Moderation

Hide a player from every board (they still see their own place):

```sql
UPDATE players SET status = 'hidden' WHERE nickname_key = 'patoveloz' AND tag = '0427';
```

Refuse every request from a player: `status = 'banned'`. Undo with `status = 'active'`.

Recent rejected results and why:

```sql
SELECT r.created_at, p.nickname, p.tag, r.game, r.level, r.flags
FROM runs r JOIN players p ON p.id = r.player_id
WHERE r.verification = 'rejected'
ORDER BY r.created_at DESC
LIMIT 50;
```

## Data kept

See [decision 0003](decisions/0003-competition-backend.md#decision): nickname, tag, a hash of the device key, runs and records. No email, name, address or raw address. Rejected runs are deleted after 30 days, old runs that are not records after 90 days, inactive players after two years, and everything about a player immediately when they choose "Sair do placar".
