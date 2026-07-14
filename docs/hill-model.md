# The Hill Model — unifying the studio OS

> Status: **draft spec** (settled in conversation, not yet implemented).
> Purpose: collapse the three parallel "work-cycle" systems (personal admin tasks,
> client sprints, refinement cycles) into one shared concept — a **Hill** — so the
> studio owner has a single dashboard for studio *and* life, and the codebase stops
> re-implementing the same shape three times.

---

## 1. The concept

A **Hill** is a unit of focused work with a variable span (a day, a week, a month, a
quarter, a year) that moves through three phases:

1. **Scope the climb** — look at the hill, estimate the distance, name what you're
   trying to clarify/resolve/decide. Produces a span + a set of open questions and
   candidate work. It's a *bet*, not a checklist.
2. **The climb** — the work. Problem-finding and resolving until you've clarified what
   you set out to. Success ≠ "all tasks done"; success = "reached clarity (or clearly
   documented why we couldn't)." Unexpected blockers get named in notes.
3. **Observe & descend** — recognize you've hit peak clarity for this go, look at what
   you can now see, and wrap up / communicate / document the progress.

This is the same "Uphill → Downhill" shape already hardcoded in `lib/sprintProcess.ts`
and drawn by `app/refinement-cycle/HillSlider.tsx`. We're **extracting** a metaphor that
already lives in the code three times, not inventing one.

The owner's personal dashboard becomes: *"my active hills across every span"* — year
hills rolling down into quarter hills, week hills, and today's climb — the same nesting
the current `milestone → idea → task` hierarchy already expresses.

---

## 2. Object graph (settled)

```
Hill  (optional; = today's milestone; has a span + the 3 phases)
  ├── Idea         ← open-ended / exploratory / internal — "figure out / decide X"  (UPHILL)
  │     └── Task
  │           └── Subtask
  └── Deliverable  ← a concrete output/artifact to ship                              (DOWNHILL)
        └── Task
              └── Subtask
```

**Every parent link is optional. Capture first, organize later; promote upward when you decide.**

- A **Task** can float with no idea and no deliverable (raw capture / inbox).
- An **Idea** or **Deliverable** can exist with no hill (loose backlog).
- You **promote** upward over time: task → idea/deliverable → hill.

Node meanings:

| Node | What it is | Phase affinity | Today's table |
|---|---|---|---|
| **Hill** | The climb container. `= milestone`. Optional span + target date. | all three | `admin_milestones` (+ `sprint_drafts`, `refinement_cycles` as typed hills) |
| **Idea** | Problem-finding / internal / exploratory container | uphill (scope) | `admin_ideas` |
| **Deliverable** | A known output to produce and hand off | downhill (descend) | `sprint_deliverables`, `refinement_cycle_screens` (+ `deliverables` library) |
| **Task / Subtask** | The leaf unit of climbing | the climb | `admin_tasks` (self-ref subtasks) |

A personal life-hill is mostly **ideas**; a client-work hill is mostly **deliverables** —
but they are **structurally identical**, so one dashboard renders both.

---

## 3. Phase, progress, status, done

### Progress — keep 0–100 (unchanged)
No separate "clarity" axis. The three phases **are** the 0–100: a fully-climbed hill
(all three phases complete) = 100%. Reuses the existing `admin_tasks.progress` mechanic
and the Today-view progress bars as-is.

### Phase — a derived overlay, not a new enum
`scope / climb / descend` is **computed from the existing per-type status**, purely for the
unified dashboard lens. It never replaces or gates any current status logic.

### Status — retained per type (do NOT collapse)
The unified `hills` table is **type-discriminated** (`hills.type`), and each type keeps its
**existing** status vocabulary verbatim:

| Hill type | Retained status set (unchanged) | Source |
|---|---|---|
| `personal` | `active` / `backburner` / `archived` (+ `completed`) | `admin_ideas` / `admin_milestones` |
| `sprint` | `draft → scheduled → in_progress → complete` (+ `archived`) | `sprint_drafts` |
| `refinement_cycle` | `submitted → accepted → awaiting_deposit → in_progress → awaiting_payment → delivered` (+ `declined`, `expired`) | `refinement_cycles` |

The phase overlay maps onto these (e.g. sprint `draft/scheduled` → *scope*, `in_progress` →
*climb*, `complete` → *descend*; refinement `submitted/accepted` → *scope*, `in_progress` →
*climb*, `awaiting_payment/delivered` → *descend*).

### Blockers — not a feature
A blocker is just a note or a final update on the hill. No blocked-state, flag, or field.

### Done — manual for now
"Done" = status set to the type's terminal complete value, **triggered manually by the admin**.
Architecture leaves room for auto-complete triggers later (a date/time, or N tasks complete)
via a `complete_trigger` column defaulting to `'manual'` — but we do not build auto-triggers now.

### Carry-forward (future)
Because a hill can descend with tasks still open ("clarity, not completion"), unfinished
work may be carried into a next hill. Reserve a nullable `spawned_from_hill_id` for this;
not required for v1.

---

## 4. Billing guardrail (firm)

Two of the three systems are entangled with Stripe + email hooks. **Do not fold billing
into `hills`.** Keep billing as a **satellite** keyed by `hill_id`:

- `sprint_invoices`, `deferred_comp_plans`, and the refinement Stripe columns
  (`stripe_deposit_invoice_id`, `stripe_final_invoice_id`, `invoice_payments` linkage) stay
  in their own tables/shape, just re-pointed at `hill_id`.
- The webhook that reconciles payments (via `invoice_payments`, per the 2026-01-28+ Stripe
  API change) **must be updated in lockstep** with any column move — a half-migrated webhook
  fails *silently* the day billing goes live again, not loudly now.

There are **no live clients** currently, so temporary breakage during the migration is
acceptable — *except* the silent-reconciliation trap above, which is why billing stays a
loosely-coupled satellite rather than getting absorbed.

> **Implemented (v352).** The satellite is now `hill_id`-keyed without being absorbed: a
> nullable `hill_id` on `sprint_invoices` / `deferred_comp_plans` / `refinement_cycles`, Stripe
> invoices stamped with `metadata.hill_id`, and the webhook mirroring each real payment onto the
> hill's timeline as a `billing_*` `hill_event`. Crucially the webhook's existing invoice-match
> strategies and legacy status updates are **unchanged** — the hill writes are best-effort and
> can never throw, so the silent-reconciliation trap is avoided. See `lib/hillBilling.ts` and the
> worklog for the phase breakdown.

---

## 5. Table-collapse mapping (keep / rename / merge / new)

Migration philosophy: **big-bang unify the work lifecycle, keep billing as a satellite.**

### Hills (unify 3 → 1)
| Today | Action | Notes |
|---|---|---|
| `admin_milestones` | **→ `hills`** (`type='personal'`) | base of the unified table |
| `sprint_drafts` | **→ `hills`** (`type='sprint'`) | type-specific fields (the `draft` jsonb blob, snapshots, contract/invoice status) go to `hills.type_data jsonb`; common fields (title, dates, status, project_id, share_token) promote to columns |
| `refinement_cycles` | **→ `hills`** (`type='refinement_cycle'`) | brief fields (`whats_working`/`whats_not_working`/`success_looks_like`), delivery artifacts, check-in → `type_data`; Stripe columns → billing satellite |
| — | **new** `hills.type`, `hills.progress`, `hills.span_granularity`, `hills.complete_trigger` (`'manual'`), `hills.spawned_from_hill_id` (nullable), derived `phase` | |

### Ideas
| Today | Action | Notes |
|---|---|---|
| `admin_ideas` | **keep → `ideas`**, add nullable `hill_id` | already has `status` (active/backburner/archived), `project_id`; the `milestone_id` link becomes `hill_id` |

### Deliverables
| Today | Action | Notes |
|---|---|---|
| `deliverables` (library) | **keep** as reusable catalog/templates | source for instances |
| `sprint_deliverables` | **→ `deliverables_instances`** under a hill | carries versions, complexity, `type_data`, `delivery_url` |
| `refinement_cycle_screens` | **→ `deliverables_instances`** under a hill | `added_by` (client/admin), `admin_note` |
| — | **new** nullable `hill_id` on instances | |

### Tasks (polymorphic parent)
| Today | Action | Notes |
|---|---|---|
| `admin_tasks` | **keep → `tasks`**; change parent to **polymorphic** | today `idea_id` only → allow `idea_id` **OR** `deliverable_id` (both nullable, so a task can float); keep `parent_task_id` subtree, `focus`, `progress`, `attachments` |

### Activity / history (collapse 5 → 1)
| Today | Action |
|---|---|
| `admin_task_events`, `sprint_draft_changelog`, `sprint_daily_updates`, `sprint_comments`, `refinement_cycle_notes` | **→ one `hill_events`** polymorphic activity/notes stream (subject = hill/idea/deliverable/task; kind = event/note/update/comment/changelog) |

### Attachments (collapse ~5 → 1)
| Today | Action |
|---|---|
| task `attachments` jsonb, `sprint_links`, `refinement_cycle_screen_attachments`, `refinement_cycle_note_attachments`, `refinement_cycle_deliverable_screenshots` | **→ one polymorphic `hill_attachments`** (subject_type + subject_id) |

### Billing (satellite — do NOT merge)
| Today | Action |
|---|---|
| `sprint_invoices`, `deferred_comp_plans`, refinement Stripe columns, `invoice_payments`, webhook | **keep shape, re-key to `hill_id`**; update webhook in lockstep |

**Net:** ~15 tables → ~6 shared primitives (`hills`, `ideas`, `deliverables_instances`,
`tasks`, `hill_events`, `hill_attachments`) + billing satellite.

---

## 6. Cadence

The daily/weekly **reset/archive** (`scripts/daily-reset.js`, `weekly-reset.js`) and the
sprint **day 1–10 counter** are the same idea — a "span tick." Unify them as one
span-aware cadence over `hills`, preserving the existing `focus` ladder
(`'' → week → today → now`, with `now` globally singular) for the personal daily flow.

---

## 7. What's explicitly NOT changing

- The 0–100 progress mechanic and Today-view progress bars.
- Any per-type status vocabulary (retained verbatim).
- Billing table shapes and the Stripe webhook contract (satellite, re-keyed only).
- The `focus` ladder and daily/weekly reset semantics.

## 8. Extensibility (reserved hooks — built later)

Future features — scheduled auto-creation of hills, "repeat this hill weekly at 9am",
suggested/AI-added tasks, and streaks — are all **additive** on this model. The hooks are
reserved now so none of them needs a migration on the hot `hills`/`hill_tasks` tables later.

> **Realized: the morning ritual ("a day is a hill").** The first payoff of these hooks.
> A **day-hill** is a personal hill representing one calendar day (`hills.day_key`), created
> each morning in the *scope* phase by `POST /api/cron/morning-hill` (`lib/dayHill.ts`,
> `scripts/morning-hill.js` on the cron rail). It emails the owner a calm "let's start today's
> hill" nudge; **"start the climb"** stamps `hills.started_at` and moves the day-hill
> *scope → climb*. Morning = scope, the day = climb, evening = descend. (SMS channel still TODO.)

**Recurrence — `hill_recurrences` table (its own queryable entity, not `type_data`).**
Holds *what to spawn* (clone a `source_hill_id`, or expand a `template` jsonb blueprint)
and *when* (RRULE-lite: `freq` / `interval` / `at_time` / `by_weekday` / `by_monthday` /
`timezone` / `starts_on` / `ends_on`). It lives in a real table — not a jsonb blob —
specifically so a scheduler can query `WHERE active AND next_run_at <= now()` on an index.
Spawned hills point back via `hills.recurrence_id` (which series) and the existing
`hills.spawned_from_hill_id` (lineage).

**Scheduler — reuse the existing cron rail.** `scripts/daily-reset.js` /
`weekly-reset.js` already fire on Heroku Scheduler against a `CRON_SECRET`-protected
endpoint. Auto-create is a sibling job (e.g. `/api/cron/spawn-hills`) that instantiates due
recurrences — no new infrastructure. `hills.complete_trigger` (default `'manual'`) likewise
reserves date- or task-count-based auto-completion.

**Suggest-then-commit — `origin` on tasks & deliverables.** Because tasks/deliverables can
float with no parent (capture-first), a "suggested" item is just one that isn't committed
yet. `origin` (`manual` | `suggested` | `ai` | `recurring`) records how it was created;
`accepted_at` / `dismissed_at` capture the user's decision while scoping the hill.

**Streaks — derived, with an optional cache.** A streak is "consecutive completed instances
of a recurrence." Every completion already writes to `hill_events`, so a streak is a query
over the series keyed by `recurrence_id`; `hill_recurrences.current_streak` /
`longest_streak` / `last_completed_at` are cache columns for cheap reads.

| Future feature | Reserved hook | Migration on hot tables? |
|---|---|---|
| Auto-create hills on a schedule | `hill_recurrences` + a cron endpoint | none |
| "Repeat this hill weekly at X" | RRULE fields + `hills.recurrence_id` | none |
| Suggested / AI / recurring items | `origin`, `accepted_at`, `dismissed_at` | none |
| Streaks | query `hill_events` by `recurrence_id` (+ cache cols) | none |

## 9. Implementation status (as of 2026-07-12, prod release v346)

Deployed to Heroku (`sprint-builder`) incrementally; every step additive and reversible.

**Shipped & live**
- **Schema + backfill** — 6 primitives (`hills`, `hill_ideas`, `hill_deliverables`, `hill_tasks`,
  `hill_events`, `hill_attachments`) + `hill_recurrences` + `notes`, backfilled from legacy
  (reused PKs). Extensibility hooks in place.
- **Owner dashboard** `/dashboard/hills` — list by phase, detail (ideas/deliverables/tasks,
  subtasks), create/edit/complete, **drag-reorder**, **attachments** (hill-level), **notes strip**.
- **Today** `/dashboard/hills/today` — focus ladder (now/today/week), now-singleton, day-hill
  card + "start the climb". **Deadlines** (milestones lens). **Activity** feed. **Notes** inbox
  (`/dashboard/hills/notes`, full-text search, file-under-anything).
- **Focus reset** `/api/admin/hills/reset` (personal-scoped, non-destructive).
- **Intake** — public `/scope` → proposal hill; retired `/intake` + `/intake/updates` (redirect);
  `/api/documents` secured (410 without secret). **Stage A bridge**: accepted proposal → real
  `sprint_drafts` / `refinement_cycles` via `/api/admin/hills/[id]/convert`.
- **Automations** — morning ritual (`/api/cron/morning-hill`), generic recurrence engine
  (`/api/cron/spawn-recurrences`, `/api/admin/hills/[id]/repeat`).
- **Legacy tasks dashboard retired** — `/dashboard/tasks*` redirect into hills (data intact).

**Requires the studio owner (cannot be done from code)**
- **Heroku Scheduler jobs** — the automations are built but DORMANT until scheduled:
  `node scripts/hills-reset.js` (daily) + `--weekly`, `node scripts/morning-hill.js` (~6:30a ET),
  `node scripts/spawn-recurrences.js` (~10 min). Until then, the Today focus never auto-clears,
  no morning day-hill appears, and recurrences never fire. (Legacy `daily/weekly-reset.js` still
  run on the frozen `admin_tasks` — harmless; retire them once the hills jobs are added.)
- **`scripts/drop-ai-responses.sql`** — physical drop of the dead table (optional).

**Deliberately deferred (high-risk / low-reward)**
- **Client-execution rewire (Stages B/C)** — sprints/refinement execution still run on legacy
  tables. Hills mirror + bridge them; they are not rewired.
  - **Billing re-key (was Stage C): DONE additively in v352.** `hill_id` now flows through the
    billing satellite and the Stripe webhook records payments on the hill timeline (see §4).
    Legacy tables are retained as a frozen archive — dropping them (the only destructive step)
    stays deferred.
- **Drop legacy tables** — only after a backup + explicit sign-off.

**Minor gaps / polish**
- Stage A stores a sprint's proposed deliverables in `draft.proposedDeliverables` but the legacy
  sprint builder doesn't surface them yet.
- Task-level attachments (only hill-level built); board-by-focus view; SMS for the morning nudge
  (needs a provider); a central recurrence-management view.
- **Dead code, safe to delete once confident in the cut-over**: `app/dashboard/tasks/{TasksClient,
  today/TodayClient, milestones/MilestonesClient, activity/ActivityClient, [ideaId]/IdeaDetailClient}.tsx`
  and `app/intake/{IntakeClient, updates/UpdatesIntakeClient}.tsx` (all unimported — pages redirect).
  Kept for now as a reversible revert path.
