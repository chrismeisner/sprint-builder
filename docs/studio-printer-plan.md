# Studio Printer — Implementation Plan

Bring the-boss's **remote print bridge** into form-intake so we can enqueue a
receipt from anywhere in the Life OS and it prints on a physical printer sitting
in the studio.

Source of the ported design: `temp/the-boss/` (esp. `docs/online-stage-1-plan.md`,
`server/src/routes/{jobs,printers,agents}.js`, `server/agent-template/agent.js`,
`src/printer.js`).

---

## 1. Architecture (three tiers, server is the only hub)

```
   You, anywhere            form-intake (Heroku)             Studio
  ┌──────────────┐        ┌──────────────────────┐      ┌────────────────────┐
  │ Life OS UI   │ enqueue│ Next.js + Postgres    │ poll │ Mac mini + printer │
  │ "Print" btn  │───────▶│  = source of truth    │◀─────│ print agent (Node) │
  └──────────────┘        └──────────────────────┘ report└────────────────────┘
```

- The studio Mac makes **outbound-only** calls (poll → claim → print → report).
  No inbound ports, no port-forwarding, no static IP. Works behind any router.
- form-intake **already is** the hosted server + Postgres + admin dashboard, so
  the bulk of the "server" side is grafting tables + routes onto what exists.

### What we reuse from the-boss verbatim
- `temp/the-boss/src/printer.js` — all ESC/POS generation. Moves onto the **agent**
  unchanged. This is the one thing that must live next to the USB printer.
- `temp/the-boss/server/agent-template/*` — the downloadable agent bundle
  (`agent.js`, launchd plist, `.command` launchers, `test-connection`, `version.js`).
- The claim protocol SQL (`FOR UPDATE SKIP LOCKED`) — copied into our jobs route.

### What we adapt to form-intake conventions
- **PK type:** the-boss uses `uuid`/`gen_random_uuid()`. We use `text` PKs generated
  with `crypto.randomUUID()` (matches every table in `lib/db.ts`).
- **Schema:** added to `ensureSchema()` in `lib/db.ts` as `CREATE TABLE IF NOT EXISTS`
  blocks — no separate migrations dir (the repo has none).
- **Routing:** Fastify routes become App Router `route.ts` handlers.
- **Admin auth:** `requireAdmin()` (session cookie) instead of an admin bearer key.
- **Agent auth:** new bearer-key check (the-boss's model) — see §4.
- **Reaper + scheduler:** run on **Heroku Scheduler** via `/api/cron/*` (the existing
  `CRON_SECRET`-or-admin pattern), not an in-process `setInterval`.

---

## 2. Database schema (add to `ensureSchema()` in `lib/db.ts`)

Four tables. Text PKs, `IF NOT EXISTS`, same style as the rest of the file.

```sql
-- An always-on machine that owns one or more printers. Authenticates by bearer key.
CREATE TABLE IF NOT EXISTS print_agents (
  id            text PRIMARY KEY,
  name          text NOT NULL,                 -- "studio-mac-mini"
  key_hash      text NOT NULL,                 -- sha256 of the bearer token (see §4)
  last_seen_at  timestamptz,                   -- heartbeat
  agent_version text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- A physical printer, bound to the agent that can reach it.
CREATE TABLE IF NOT EXISTS printers (
  id          text PRIMARY KEY,
  agent_id    text NOT NULL REFERENCES print_agents(id) ON DELETE CASCADE,
  cups_name   text NOT NULL,                   -- "EPSON_TM_T88V" (CUPS queue on the Mac)
  label       text NOT NULL,                   -- "Studio front desk"
  status      text,                            -- last health: idle/attention/offline/...
  status_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_printers_agent ON printers(agent_id);

-- The queue the agent drains. One row = one receipt.
CREATE TABLE IF NOT EXISTS print_jobs (
  id                text PRIMARY KEY,
  printer_id        text NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  payload           jsonb NOT NULL,            -- frozen copy of the receipt (see §6)
  status            text NOT NULL DEFAULT 'pending',
  scheduled_at      timestamptz NOT NULL DEFAULT now(),
  claimed_by        text REFERENCES print_agents(id) ON DELETE SET NULL,
  claimed_at        timestamptz,
  lease_expires_at  timestamptz,
  attempts          int NOT NULL DEFAULT 0,
  max_attempts      int NOT NULL DEFAULT 3,
  error             text,
  printed_at        timestamptz,
  source            text,                      -- 'manual' | 'hill' | 'sprint' | ...
  created_by        text REFERENCES accounts(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT print_jobs_status_check
    CHECK (status IN ('pending','claimed','printing','printed','failed','canceled'))
);
-- Partial index makes the claim query cheap.
CREATE INDEX IF NOT EXISTS idx_print_jobs_claimable
  ON print_jobs (printer_id, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_print_jobs_created ON print_jobs(created_at DESC);

-- Append-only audit trail.
CREATE TABLE IF NOT EXISTS print_job_events (
  id       text PRIMARY KEY,
  job_id   text NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  at       timestamptz NOT NULL DEFAULT now(),
  status   text NOT NULL,
  detail   jsonb
);
CREATE INDEX IF NOT EXISTS idx_print_job_events_job ON print_job_events(job_id);
```

> **Frozen `payload`:** the job captures exactly what to print at enqueue time.
> Later edits to a schedule/source never mutate already-queued jobs.

Optional (Phase 6, scheduled prints): a `print_schedules` table mirroring the-boss's
`schedules` (rule jsonb + `next_fire_at`), materialized by a cron endpoint reusing
`lib/recurrence.ts`. Deferred — not needed for the headline capability.

---

## 3. New files (server side, in form-intake)

```
lib/
  printAuth.ts                 # requireAgent(request) → verify bearer key, load agent
  printJobs.ts                 # enqueuePrintJob(), claim SQL, status transitions, health mapping
app/api/print/
  jobs/route.ts                # POST (admin enqueue), GET (admin list)
  jobs/[id]/route.ts           # PATCH (agent: printing/printed/failed)
  jobs/[id]/cancel/route.ts    # POST (admin cancel a pending job)
  agents/claim/route.ts        # POST (agent: atomic claim)
  agents/heartbeat/route.ts    # POST (agent: liveness + printer health)
  agents/[id]/installer/route.ts # POST (admin: mint key + stream agent .zip)  ← jszip
  printers/route.ts            # GET/POST (admin: list/register)
  printers/[id]/route.ts       # DELETE (admin)
app/api/cron/
  reap-print-jobs/route.ts     # POST (reaper — recover expired claims)
app/dashboard/printers/
  page.tsx                     # admin panel: agents, printers, live queue, Download agent
  PrintersClient.tsx
```

Agent bundle template committed under the repo (vendored, like the-boss):
```
printer-agent/                 # committed template the installer zips up
  agent.js                     # from temp/the-boss/server/agent-template/agent.js
  printer.js                   # from temp/the-boss/src/printer.js (verbatim)
  version.js
  package.json
  start-agent.command
  test-connection.command  test-connection.mjs
  install-service.command  uninstall-service.command
  com.studio.printagent.plist
  README.md
  # .env is NOT committed — generated per-download by the installer route
```

---

## 4. Auth

**Admin routes** (`/api/print/jobs` POST/GET, `/printers`, `/agents/:id/installer`,
cancel): call `await requireAdmin()` at the top, exactly like
`app/api/admin/scheduled-jobs/route.ts`. On throw, return 403.

**Agent routes** (`/api/print/agents/claim`, `/heartbeat`, `/jobs/:id` PATCH): new
helper `lib/printAuth.ts`:

```ts
// requireAgent: read "Authorization: Bearer <token>", sha256 it, match key_hash.
// Returns the agent row or throws. Update last_seen_at on success.
export async function requireAgent(request: NextRequest): Promise<{ id: string; name: string }>;
```

- Key format: `pa_<32 random bytes hex>`. Store only `sha256(token)` in `key_hash`.
  (sha256 is fine here — tokens are high-entropy random, not passwords; no bcrypt needed.)
- Token is issued once, at **installer download** time (§5). Downloading again mints a
  fresh key and overwrites `key_hash`, invalidating the old bundle — so a bundle is
  always either current or dead, never a stale hand-copied key.

**Reaper cron**: `CRON_SECRET` bearer or admin session — copy the guard from
`app/api/cron/spawn-recurrences/route.ts` verbatim.

**Transport:** Heroku terminates TLS, so every call is HTTPS. This closes the hole
the-boss's *local* app left open (its `/api/print-queue/*` was unauthenticated —
acceptable on localhost, not on a public URL).

---

## 5. The claim protocol (the one correctness-critical piece)

`POST /api/print/agents/claim`, body `{ "max": 5 }`. Ported from
`temp/the-boss/server/src/routes/jobs.js:65`, adapted to a `pg` transaction via a
pooled client (`getPool().connect()` + BEGIN/COMMIT), text params:

```sql
UPDATE print_jobs j
SET status = 'claimed', claimed_by = $1, claimed_at = now(),
    lease_expires_at = now() + make_interval(secs => $2),
    attempts = attempts + 1
FROM printers p
WHERE p.id = j.printer_id
  AND j.id IN (
    SELECT j2.id FROM print_jobs j2
    JOIN printers p2 ON p2.id = j2.printer_id
    WHERE p2.agent_id = $1
      AND j2.status = 'pending'
      AND j2.scheduled_at <= now()
    ORDER BY j2.scheduled_at
    FOR UPDATE OF j2 SKIP LOCKED
    LIMIT $3
  )
RETURNING j.*, p.cups_name;
```

`FOR UPDATE SKIP LOCKED` guarantees **exactly one** claimer per job even with
concurrent polls or multiple agents — kills the double-print risk. Each claimed +
transitioned job also inserts a `print_job_events` row.

**Reaper** (`/api/cron/reap-print-jobs`, Heroku Scheduler every ~1 min): any job
stuck `claimed`/`printing` past `lease_expires_at` returns to `pending` (agent
crashed mid-print) — unless `attempts >= max_attempts`, then `failed`. Call
`recordJobRun('reap-print-jobs', 'ok', ...)` so it shows on the schedulers page.

> Irreducible edge: if the agent prints then dies before the `printed` PATCH, the
> reaper re-queues and it may print twice. Acceptable for receipts. Add a
> client-generated idempotency key per attempt later if any use-case can't tolerate it.

---

## 6. Payload contract (job.payload jsonb)

The agent's `renderJob()` (`temp/the-boss/server/agent-template/agent.js:89`) already
switches on `payload.type`. We keep that contract so `printer.js` needs zero changes:

```jsonc
// note
{ "type": "note", "text": "Ship the thing", "cut": "partial" }
// task
{ "type": "task", "title": "Follow up", "dueAt": "2026-07-13T17:00:00Z",
  "notes": "…", "cut": "partial" }
// sheet (stacked sections; titles, dividers, QR, image, weather)
{ "type": "sheet", "sections": [ { "type": "text", "content": "…", "bold": true },
  { "type": "divider" }, { "type": "qr", "url": "https://…" } ],
  "options": { "cut": "partial", "quantity": 1, "topMargin": 1 } }
```

`enqueuePrintJob(printerId, payload, { source, createdBy })` in `lib/printJobs.ts`
validates `type` against the supported set and inserts a `pending` row. Building the
`payload` from Life OS data (a hill, a sprint task) is a pure mapping function per
feature — no printer knowledge needed on the server.

---

## 7. Admin UI — `app/dashboard/printers`

Mirrors the existing dashboard pages (server component fetches, client component for
interactivity; same styling as `app/dashboard/schedulers`).

- **Agents** list with last-seen dot (grey if no heartbeat < 30s) + **"Download agent"**
  button per agent → hits the installer route, downloads a pre-filled `.zip`.
- **Printers** list with live status dot (green idle / amber attention / red offline),
  polling `GET /api/print/printers` every ~8s. Register/delete printers.
- **Queue** — recent `print_jobs` with status, a **"Print test receipt"** button
  (enqueues a `note` payload), and per-job cancel for `pending`.

Add a nav entry to the admin shell (`app/AdminNavShellClient.tsx`).

---

## 8. Installer route — `POST /api/print/agents/[id]/installer`

Admin-only. Ported from the-boss's `installer.js` idea, using the **jszip** pattern
already in `app/sandboxes/miles-proto-*/hub/download/route.ts`:

1. `requireAdmin()`.
2. Mint a fresh token `pa_…`, store `sha256` in `print_agents.key_hash`.
3. `new JSZip()`; add every file from `printer-agent/` (read from disk), plus a
   generated `.env`:
   ```
   SERVER_URL=https://<app-host>
   AGENT_KEY=pa_…
   PRINTERS=EPSON_TM_T88V
   POLL_INTERVAL_MS=5000
   ```
4. `zip.generateAsync({ type: "nodebuffer" })` → return as
   `application/zip` with `Content-Disposition: attachment`.

Bundle is turnkey: unzip on the Mac, `test-connection.command` to verify, then
`install-service.command` to load the launchd agent.

---

## 9. The studio (one-time physical setup)

- **Printer:** Epson TM-T88V (or any ESC/POS receipt printer) on USB; add it as a
  CUPS queue in *System Settings → Printers & Scanners*. Note the queue name.
- **Always-on Mac:** a Mac mini set to never sleep.
- **Agent:** download from the dashboard, unzip, run `test-connection.command`, then
  `install-service.command` (loads `com.studio.printagent.plist`, `KeepAlive=true`,
  `RunAtLoad=true`) so it survives reboots and relaunches on crash. Prints its backlog
  whenever it reconnects.

Env to add on Heroku: none required beyond existing `DATABASE_URL` / `CRON_SECRET`.
(The agent's `SERVER_URL` + `AGENT_KEY` live in its downloaded `.env`, not on Heroku.)

---

## 10. Build order (each step independently testable)

1. **Schema** — add the 4 tables to `ensureSchema()`. Deploy; confirm they exist.
2. **Agent auth + jobs API** — `lib/printAuth.ts`, `POST/GET /api/print/jobs`,
   claim, `PATCH /jobs/:id`. Test entirely with `curl` before any hardware:
   insert an agent + printer row by hand, mint a key, enqueue a job, claim it, PATCH
   it printed.
3. **Reaper** — `/api/cron/reap-print-jobs` + Heroku Scheduler entry. Verify a
   never-acked claimed job returns to `pending`.
4. **Agent bundle** — vendor `printer.js` + `agent.js` into `printer-agent/`; build the
   installer route. Run the agent on the Mac. **End-to-end: `POST /api/print/jobs`
   from a laptop → receipt prints in the studio.** ← headline capability done.
5. **Admin UI** — `app/dashboard/printers` (agents, printers, queue, Download agent,
   test receipt, live status).
6. **Product hooks + (optional) scheduled prints** — "Print" buttons across the Life
   OS (daily hill receipt via existing `cron/morning-hill`, sprint task tickets, quick
   notes), and optionally a `print_schedules` table materialized by cron using
   `lib/recurrence.ts`.

After **step 4** the whole point works: enqueue from anywhere → prints in the studio,
reliably, with crash recovery.

---

## 11. Effort & risk

- **Effort:** small–medium. DB, hosting, auth, cron, dashboard, jszip, and *all* the
  printer code already exist. Real work ≈ 4 tables + ~8 small route handlers + one
  admin panel + vendoring the agent bundle. ~A few focused days to step 4.
- **Main risks, all addressed above:** auth on every route (§4), double-print via the
  claim lease + reaper (§5), and stale keys via download-time minting (§4/§8).
- **Out of scope for v1:** multi-printer routing rules, per-attempt idempotency keys,
  and the scheduled-print rule engine (Phase 6).
```