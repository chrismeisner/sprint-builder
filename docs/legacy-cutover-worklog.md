# Legacy Cut-over Worklog — hills authoritative, drop legacy client tables

Goal: get the studio OS **fully off** the legacy client tables (`sprint_*`,
`refinement_cycle_*`, `sprint_invoices`, `deferred_comp_plans`) by making **hills
authoritative** for client work + billing, then dropping the legacy tables.

Companion to `hill-model.md` (spec) and `hill-unification-worklog.md` (the earlier
unification that made hills a read-only mirror). This doc tracks the final cut-over.

## Decisions (settled with the owner, 2026-07-14)

- **Clean slate:** no active clients, no open/unpaid Stripe invoices. Big-bang cut-over
  is safe — no dual-write window needed.
- **Scope:** full cut-over **including dropping** the legacy tables (gated on a backup).
- **Client-flow shape — Path A + agreements:** a client hill = **priced deliverables +
  real Stripe invoices + a client share view + a retained generated agreement/PDF**.
  **Retired:** the sprint point/complexity **scoring engine**, and the refinement
  **fixed deposit/final dual-invoice ceremony**. Invoicing is generic `hill_invoices`
  rows (any number, any amount), still paid via the Stripe webhook.

## Phases

- **Phase 1 — schema foundation (additive). DONE, build green.**
  - `hill_deliverables` += `price`, `quantity`, `deliverable_category`,
    `deliverable_scope`, `content` (Path-A pricing/scope fields).
  - new **`hill_invoices`** satellite (keyed on `hill_id`): `kind`, `label`, `amount`,
    `invoice_status`, `invoice_url`, `invoice_pdf_url`, `stripe_invoice_id`, `paid_at`,
    `payment_initiated_at`, `legacy_source/id`. Replaces `sprint_invoices` + the
    refinement Stripe columns (deposit/final collapse to 2 rows).
  - `lib/db.ts` createPool: SSL disabled for localhost (enables local dev/test DB).
- **Phase 2 — write engines on hills. DONE, build green.**
  - Deliverable pricing: `items` POST + `deliverables/[id]` PATCH accept `price`/`quantity`/
    `deliverable_scope`/`deliverable_category`/`content`.
  - Detail route (`admin/hills/[id]` GET) returns `invoices` + `billing {scopeTotal,
    amountInvoiced, amountPaid}` (Σ price×qty; satellite rollups).
  - Invoices: `admin/hills/[id]/invoices` (GET/POST), `.../[invoiceId]` (PATCH/DELETE),
    `.../[invoiceId]/stripe` (POST send|void) → `lib/hillInvoicing.ts` (real Stripe invoice,
    metadata `{hill_id, hill_invoice_id}`).
  - Agreement (kept, simplified): `admin/hills/[id]/agreement` (GET/POST generate) +
    `.../agreement/pdf` (POST/DELETE GCS) → `lib/hillAgreement.ts` (fixed-scope markdown from
    priced deliverables; no deferred-comp/points variants).
  - `convert` repurposed → **activate** (status=active, phase=climb; NO legacy row minted).
  - Verified: `next build` exit 0; new SQL smoke-tested on a local subset DB.
- **Phase 3 — re-key Stripe webhook to hills. DONE, build green.**
  `app/api/webhooks/stripe/route.ts` rewritten hill-native (1124 → ~440 lines): matches
  `metadata.hill_invoice_id` → else the `stripe_invoice_id` column on `hill_invoices`; keeps
  the `invoice_payments` recovery hop for metadata-stripped PI/Charge (ACH) events; stamps
  paid/processing timestamps via COALESCE (exactly-once under event fan-out); records a
  `billing_*` `hill_event`; sends the generic invoice paid/processing client+admin emails.
  Verified: matching/idempotency SQL smoke-tested on a local DB; `next build` exit 0.
  **Owner still to do:** run a real payment in **Stripe TEST mode** per the checklist below.
- **Phase 4 — repoint reads. DONE (admin + client), build green.**
  - Admin: hill detail (`HillDetailClient`) shows the `HillBilling` panel + per-deliverable
    pricing; legacy bridge card gone; `convert` → **activate**; detail route Stage-B reads removed.
  - Client: **`app/projects/[id]` rebuilt** — the legacy sprint + refinement sections are one
    **Engagements** section reading client hills (`total` from `hill_deliverables`, invoices from
    `hill_invoices` with hosted pay links + agreement flag); smoke-test sprints retained as their
    own section. Removed 3 now-unused legacy client imports.
  - Redirects: `/dashboard/refinement-cycles` (+ `/new`, `/[id]`→owning hill) → hills;
    `/dashboard/sprint-drafts` → hills; `/my-sprints` → `/projects`; `/sprints/[id]` +
    `/sprints/[id]/process` → the owning hill's project. Deleted 3 orphaned refinement client
    components (their pages now redirect).
  - **Still pending here:** `/shared/sprint/[token]` (public share view — still legacy) and
    `/budget` (deferred-comp calculator — still legacy); both keep working until the drop. And
    the legacy API route trees (`app/api/sprint-drafts/**`, `app/api/refinement-cycles/**`) +
    dead `app/sprints/[id]/*` client components + secondary readers (`profile`,
    `admin/stripe/activity`, `admin/db/status`, `intake-context`, `update-cycles`) remain — clean
    up with the drop.
- **Phase 5 — drop legacy (TODO, gated):** after Phase 4 client repoint + `next build` green
  + full DB backup + explicit owner go — drop `sprint_*` / `refinement_cycle_*` /
  `sprint_invoices` / `deferred_comp_plans`.

## Stripe TEST-mode verification checklist (Phase 3)

Run against a deploy configured with **test-mode** `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`:
1. Create a client hill (type `sprint`) on a project that has an owner account.
2. Add a priced deliverable; add an invoice (label + amount) in the Billing panel.
3. Click **Send** → confirm a Stripe *test* invoice is created and the row flips to `sent`
   with a hosted link + `stripe_invoice_id`.
4. Pay the hosted test invoice (test card `4242…` or the test ACH flow).
5. Confirm the webhook fires and the row flips `sent → processing → paid` (card is usually
   straight to `paid`; ACH shows `processing` first), `paid_at` stamps once, a `billing_paid`
   event lands on the hill timeline, and the client+admin "invoice paid" emails send.
6. **Void** an unpaid invoice → confirm it voids in Stripe + flips to `voided`.
7. Confirm metadata on the Stripe invoice carries `hill_id` + `hill_invoice_id`.

## Verification harness

Local Postgres DB `form_intake_dev` (SSL off for localhost). Develop/verify Phases 2–4
against it + Stripe **test** keys; never write test data to prod or LIVE Stripe.

## Historical billing/pricing backfill (display parity)

The original `backfill-hills.js` mirrored legacy pricing into `hill_deliverables.type_data`
(not the new `price` column) and never populated `hill_invoices` (a new table). So historical
engagements render with $0 total / no invoices in the new views — **data is fully preserved**,
just not surfaced. Two additive/idempotent tools close the gap:

- `scripts/verify-hill-billing.sql` — **read-only** report (safe on prod): legacy↔hill counts,
  invoice coverage, the "would show $0" gap, and a per-engagement reconciliation. Run with
  `psql "$DATABASE_URL" -f scripts/verify-hill-billing.sql`.
- `scripts/backfill-hill-billing.js` — **dry-run by default** (transaction-wrapped, rolls back
  unless `--commit`). (A) `sprint_invoices`→`hill_invoices`; (B) refinement deposit/final→
  `hill_invoices` (only invoices that really existed); (C) reconstructs `hill_deliverables.price`
  for backfilled sprint lines, scaled so each hill's lines sum EXACTLY to its stored
  `total_fixed_price` (rate-independent; only fills NULL prices). Never touches legacy tables.
  Verified locally: exact price reconstruction, faithful invoice mirror, idempotent.

## Deploy status

**Live on Heroku `sprint-builder` — release v358** (2026-07-14, commit `d40c625` on `main`;
branch `cutover/hills-billing`). Phases 1–3 + Phase 4 admin. Additive; no legacy tables dropped;
client-facing pages still read legacy (untouched, still work). Verified: `/hills` 200, `/scope` 200,
`/api/admin/hills` 403, `/api/webhooks/stripe` 405-on-GET, `/dashboard/hills` 307; dyno up.

**Post-deploy caveat:** the webhook now reconciles ONLY `hill_invoices`. Do NOT create invoices via
the old legacy billing paths (legacy admin pages still reachable) — those payments won't reconcile.
Use the hills Billing panel. Prod Stripe is LIVE and this hasn't had a test-mode round-trip yet — to
verify, send a hill invoice to yourself, pay, then void/refund.

## Gotchas carried forward

- Prod Stripe is LIVE — verify billing in test mode only.
- Deploy gate is `next build` (lint + type-check), not `tsc` alone.
- No auto-push to git/Heroku; commits only when the owner asks (branch first off main).
