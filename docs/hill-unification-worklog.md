# Hill Unification — Worklog & Reference

A record of the effort that unified this studio OS around one **Hill** model.
Companion to [`hill-model.md`](./hill-model.md) (the design spec) — this doc is the
"what actually got built, in what order, and what's left" reference.

**Status:** live in production (Heroku app `sprint-builder`, release **v352**,
https://sprint-builder-e9c813c659ea.herokuapp.com). Additive and reversible
throughout; **no data was destroyed.**

---

## 1. The problem & the shape of the fix

The app had **three parallel implementations of the same idea** — personal tasks
(`admin_ideas`/`admin_tasks`/`admin_milestones`), client sprints (`sprint_drafts`),
and refinement cycles (`refinement_cycles`). All three are the same 3-phase shape:
**scope the climb → the climb → observe & descend** (uphill = figure it out,
downhill = execute what you now understand).

The fix: extract that shape as a first-class **Hill** and collapse ~15 tables into
**6 primitives + a recurrences table + notes + a scheduler registry**, keeping the
legacy tables alongside (backfilled, reused primary keys) so nothing broke and the
new system could be proven in production before anything was retired.

**Object graph** (every parent link optional — capture first, promote later):
```
Hill (= milestone; a span + the 3 phases)
  ├── Idea         (open-ended / uphill)      → Task → Subtask
  └── Deliverable  (concrete output / downhill)→ Task → Subtask
```

---

## 2. The unified schema (in `lib/db.ts` `ensureSchema`)

| Table | Replaces / role |
|---|---|
| `hills` | `admin_milestones` + `sprint_drafts` + `refinement_cycles` (type-discriminated; per-type status retained; `type_data` jsonb for type-specific fields; `phase` derived overlay) |
| `hill_ideas` | `admin_ideas` |
| `hill_deliverables` | `sprint_deliverables` + `refinement_cycle_screens` |
| `hill_tasks` | `admin_tasks` (polymorphic parent: idea **or** deliverable **or** float; retains `focus` ladder, `progress`, subtasks) |
| `hill_events` | task events + changelog + daily updates + comments + refinement notes (one activity stream) |
| `hill_attachments` | task attachments + sprint_links + screen/deliverable attachments (polymorphic) |
| `hill_recurrences` | new — "repeat this hill" blueprint + RRULE-lite cadence |
| `notes` | new — polymorphic text capture (inbox or filed under any subject), full-text indexed |
| `scheduled_jobs` | new — registry/control-panel for the cron jobs |

Reserved hooks: `hills.recurrence_id`, `spawned_from_hill_id`, `origin`,
`accepted_at`, `submitter_email`, `day_key`, `started_at`, `complete_trigger`;
`origin`/`accepted_at`/`dismissed_at` on tasks & deliverables.

**Backfill:** `scripts/backfill-hills.js` (idempotent, `--commit` to write). Reuses
legacy PKs so `admin_tasks.idea_id`/`parent_task_id`/`milestone_id` map across with
no translation. Result: 18 hills, 13 ideas, 24 deliverables, 25 tasks, 211 events,
21 attachments.

---

## 3. What was built (by area)

**Owner dashboard** — `/dashboard/hills`
- List by phase (scope/climb/descend), type filter, rollup counts.
- Detail: ideas/deliverables/tasks tree, create/edit/complete, **drag-reorder**
  (`@dnd-kit`), inline rename + notes, **attachments** (GCS), a **notes strip**.
- APIs under `app/api/admin/hills/**` (list/detail/items/tasks/reorder/attachments/
  deliverables/convert/repeat).

**Today & cadence** — `/dashboard/hills/today`
- Focus ladder (now/today/week) with a global **now-singleton**; day-hill card +
  "start the climb"; per-hill task rollups; done bar.
- Reset: `POST /api/admin/hills/reset?mode=daily|weekly` (personal-scoped,
  non-destructive — clears focus tiers only).

**Other hill surfaces** — Deadlines (`/deadlines`, milestone lens), Activity
(`/activity`, the event feed), **Notes** (`/dashboard/notes`, top-level: capture,
full-text search, All/Inbox/Filed, move-to-hill).

**Intake** — public `/scope` → proposal hill (`lib/hillIntake.ts`) with suggested
items; retired `/intake` + `/intake/updates` (redirect); secured `/api/documents`
(410 without `TYPEFORM_WEBHOOK_SECRET`). **Bridge:** accepting a proposal →
`POST /api/admin/hills/[id]/convert` creates the real `sprint_drafts` /
`refinement_cycles` record. **Live status:** hill detail reads the linked legacy
record and shows its real pipeline status.

**Automations** — morning ritual ("a day is a hill": `/api/cron/morning-hill`,
`lib/dayHill.ts`); recurrence engine (`lib/recurrence.ts` DST-correct next-run,
`/api/cron/spawn-recurrences` deep-clones the source hill,
`/api/admin/hills/[id]/repeat`). **Schedulers control panel**
(`/dashboard/schedulers`): the cron endpoints stamp `last_run` into
`scheduled_jobs`, and the page infers "firing" from real runs (Heroku Scheduler
config isn't app-queryable); Run-now, status toggle, draft jobs.

**Consolidation / cleanup** — retired the legacy tasks dashboard (`/dashboard/tasks*`
redirect into hills; verified `admin_tasks` had not diverged); deleted 9 dead client
files; rewired `app/projects/ProjectTasks.tsx` to live hills (`?projectId=` filter);
removed dead `ai_responses` from code (physical drop parked in
`scripts/drop-ai-responses.sql`).

**Public philosophy page** — `/hills` (design-system doc: 3 phases, principles,
hills at every scale). `/our-approach` → `/hills`.

---

## 4. Release log (v338 → v351)

| Rel | What shipped |
|---|---|
| v338 | Unified schema + backfill + first hills dashboard (the big-bang) |
| v339 | Morning ritual (day-hills, nudge, start-the-climb) |
| v340 | Hill attachments (GCS) |
| v341 | Deadlines view + fix for null-mimetype backfilled-link crash |
| v342 | Drag-reorder |
| v343 | Legacy tasks dashboard retired → hills |
| v344 | Stage A intake bridge (convert proposals) |
| v345 | Recurrence engine |
| v346 | Notes |
| v347 | Stage B — live client status on hills |
| v348 | Dedicated Notes page + dead-code cleanup |
| v349 | Schedulers control panel |
| v350 | ProjectTasks rewired to live hills |
| v351 | `/hills` philosophy page |
| v352 | Billing → hills re-key, Phases 0–2 (additive `hill_id` on the billing satellite + Stripe-metadata stamping + webhook mirrors payments onto the hill timeline) |

---

## 5. What's outstanding

**Requires the studio owner (can't be done from code):**
- **Wire the 4 Heroku Scheduler jobs** — the automations are built but DORMANT until
  scheduled. Use `/dashboard/schedulers` (Run-now to test, copy each command):
  `node scripts/hills-reset.js` (daily) + `--weekly`, `node scripts/morning-hill.js`
  (~6:30a ET), `node scripts/spawn-recurrences.js` (~10 min). Then remove the old
  `daily-reset.js`/`weekly-reset.js` entries (they run on the frozen `admin_tasks`).
- Optionally run `scripts/drop-ai-responses.sql`.

**Billing → hills re-key (v352) — shipped additively, Phases 0–2:**
- **Phase 0 — schema + backfill:** nullable `hill_id` (FK → `hills`) on `sprint_invoices`,
  `deferred_comp_plans`, `refinement_cycles` (`lib/db.ts`); `scripts/backfill-billing-hill-id.js`
  keys historical rows via the same linkage the read-side uses (reused PK, or `type_data.linked_id`).
- **Phase 1 — writers stamp `hill_id`:** converted cycles are born hill-linked (`convert` route);
  every Stripe invoice carries `metadata.hill_id` (`lib/refinementCycleBilling.ts`,
  sprint-invoice `stripe` route); the sprint-invoice row is stamped too.
- **Phase 2 — reader mirrors payments:** on every real status change the Stripe webhook records a
  `billing_*` event on the owning hill's timeline (`lib/hillBilling.ts`, `webhooks/stripe`).
  The webhook's existing match strategies + legacy status updates are **unchanged and still
  authoritative** — the hill writes are best-effort and can never throw, so there's no
  silent-failure trap. Verify in Stripe **test mode** (metadata carries `hill_id`; a test payment
  flips the legacy status *and* lands a `hill_event`).

**Still deferred (high-risk / low-reward — recommend leaving):**
- **Phase 3 — client surfaces off legacy reads** (`/my-sprints`, `/sprints/[id]`, `/shared`,
  `/budget`, `/dashboard/refinement-cycles`). Optional; the bridge + timeline already reflect status.
- **Drop the legacy sprint/refinement/invoice tables.** This is the only step that destroys
  historical revenue data — kept as a frozen archive. Only as a dedicated, backed-up,
  Stripe-tested project with a concrete driver.

**Optional polish:** surface `draft.proposedDeliverables` in the legacy sprint builder;
task-level attachments; board-by-focus view; SMS for the morning nudge; a central
recurrence-management screen.

**Open content decision:** the marketing pages (`landing`/`about`/`how-it-works`/
`packages`/`sprints`/`deliverables`) are still sprint/package-framed. Pending a
call on whether hills is an *umbrella philosophy* (light touch) or a *repositioning*
(bigger rewrite). `/hills` + `/our-approach`→`/hills` are done.

---

## 6. Operational notes & gotchas

- **Heroku deploy:** `git push heroku main` over HTTPS **times out client-side at
  ~9 min** but the remote build/release completes — verify with `heroku releases` /
  `heroku ps`, not the push exit code. Heroku login must be done in a **real TTY**
  (native terminal), not a non-interactive shell (`setRawMode` error).
- **`next build` is the deploy gate** — it runs ESLint + type-check and fails on
  either; always build before pushing (`tsc --noEmit` alone misses lint + some TS
  5.5 narrowing issues).
- **SQL `LIKE` gotcha:** `_` is a single-char wildcard — `title LIKE '__TEST%'` matches
  real rows. Use `LIKE ... ESCAPE '\'` or exact match for cleanup queries. (Nearly
  deleted real hills once; verified none lost.)
- **`sprint_deliverables.deliverable_id` is NOT NULL** (catalog-bound) — free-text
  proposal deliverables can't be inserted there; the bridge carries them in
  `sprint_drafts.draft.proposedDeliverables` instead.
- **`refinement_cycles.project_id` is NOT NULL** — converting a proposal to a
  refinement requires the hill to have a project.
- **Billing stays a satellite** — never fold Stripe columns / the webhook into
  `hills`; they still key on the legacy record id (which == hill id for backfilled
  rows via reused PKs).

---

## 7. Key files

- Schema: `lib/db.ts` (`ensureSchema`)
- Libs: `lib/hillIntake.ts`, `lib/dayHill.ts`, `lib/recurrence.ts`,
  `lib/scheduledJobs.ts`, `lib/hillBilling.ts` (billing → hills bridge)
- Scripts: `scripts/backfill-hills.js`, `scripts/hills-reset.js`,
  `scripts/morning-hill.js`, `scripts/spawn-recurrences.js`,
  `scripts/backfill-billing-hill-id.js`, `scripts/drop-ai-responses.sql`
- UI: `app/dashboard/hills/**`, `app/dashboard/notes/**`,
  `app/dashboard/schedulers/**`, `app/scope/**`, `app/hills/**`
- APIs: `app/api/admin/hills/**`, `app/api/admin/notes/**`,
  `app/api/admin/scheduled-jobs/**`, `app/api/cron/**`, `app/api/hills/intake/**`
- Docs: `docs/hill-model.md` (spec), this file.
