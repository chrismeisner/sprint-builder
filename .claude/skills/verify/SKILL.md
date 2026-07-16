---
name: verify
description: Run this Next.js app against a throwaway local Postgres to observe a change end-to-end, without touching the production database.
---

# Verifying form-intake

Next.js 14 (app router) + Postgres (`pg`). No test suite exists — `next build`
is the deploy gate (it runs ESLint + type-check and fails on either).

## Read this first: `.env.local` points at PRODUCTION

`DATABASE_URL` in `.env.local` is the live Heroku/RDS database, and prod Stripe
is in **LIVE mode**. Next.js auto-loads `.env.local`, so simply exporting a
different `DATABASE_URL` is not enough to trust — park the file for the run:

```bash
cp .env.local "$SP/env.local.backup"      # $SP = your scratchpad
mv .env.local "$SP/.env.local.PARKED"
# ... run ...
mv "$SP/.env.local.PARKED" .env.local     # ALWAYS restore
md5 -q .env.local                          # compare against the backup
```

With it parked, confirm no env file can supply prod: `ls -a | grep '^\.env'`
should print nothing. Never drive write endpoints against prod; never let
billing code reach live Stripe.

## Throwaway Postgres

Postgres 17 is installed via Homebrew (no Docker daemon on this machine).
Two gotchas, both of which will bite you:

1. **SSL is mandatory.** `createPool()` in `lib/db.ts` sets `ssl` unconditionally
   (with `rejectUnauthorized: false`), so a plain local server fails with
   *"The server does not support SSL connections."* Give it a self-signed cert.
2. **The socket path must be short.** A scratchpad path blows the 103-byte
   Unix-socket limit; put the socket in `$(mktemp -d /tmp/pgv.XXXX)`.

```bash
export PATH=/opt/homebrew/opt/postgresql@17/bin:$PATH
export PGDATA=$SP/pgdata
initdb -D "$PGDATA" -U postgres --auth=trust
openssl req -new -x509 -days 2 -nodes -text \
  -out "$PGDATA/server.crt" -keyout "$PGDATA/server.key" -subj "/CN=localhost"
chmod 600 "$PGDATA/server.key"
SOCK=$(mktemp -d /tmp/pgv.XXXX)
pg_ctl -D "$PGDATA" -l "$SP/pg.log" \
  -o "-p 55432 -k $SOCK -c listen_addresses=localhost -c ssl=on \
      -c ssl_cert_file=$PGDATA/server.crt -c ssl_key_file=$PGDATA/server.key" start
psql -h localhost -p 55432 -U postgres -c "CREATE DATABASE formintake_verify;"
```

### `ensureSchema()` cannot bootstrap a virgin database

Pre-existing ordering bug: `sprint_deliverables` (`lib/db.ts` ~:310) has an FK to
`deliverables`, which isn't created until ~:388. On a fresh DB `ensureSchema()`
aborts there with *relation "deliverables" does not exist*. Prod is unaffected —
it evolved incrementally. Pre-create the table, then `ensureSchema()` runs clean
(`CREATE TABLE IF NOT EXISTS` skips it):

```sql
CREATE TABLE IF NOT EXISTS deliverables (
  id text PRIMARY KEY, name text NOT NULL, description text, category text,
  categories text[] NOT NULL DEFAULT '{}'::text[], points numeric(3,1) DEFAULT 1.0,
  scope text, format text, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

If you hit the same error for another table, pre-create that one too and re-run.

## Launch

```bash
npx next build                 # the deploy gate; must pass
cat > "$SP/env.verify" <<'EOF'
DATABASE_URL=postgres://postgres@localhost:55432/formintake_verify
NODE_ENV=production
AUTH_SECRET=verify-only-not-a-real-secret-000000000000
NEXTAUTH_SECRET=verify-only-not-a-real-secret-000000000000
EOF
set -a; . "$SP/env.verify"; set +a
npx next start -p 3111 > "$SP/app.log" 2>&1 &
```

`ensureSchema()` runs on the first DB-backed request, not at boot. Errors are
swallowed into generic 500s — **the real cause is only in `$SP/app.log`**, so
tail it on any 500.

## Drive it

Admin surfaces need auth and return 403/redirect unauthenticated. Public
endpoints are the cheap way in (e.g. `POST /api/scope`). To check what an admin
page would show without logging in, run its SQL directly with `psql` — the
dashboard queries are inline in the `page.tsx` files.

Screenshots (no Playwright/Puppeteer installed; Chrome is):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --screenshot="$SP/shot.png" --window-size=900,1400 http://localhost:3111/<path>
```

## Teardown

```bash
pkill -f "next start -p 3111"
pg_ctl -D "$PGDATA" stop
mv "$SP/.env.local.PARKED" .env.local   # never skip this
rm -rf "$PGDATA" "$SOCK"
```
