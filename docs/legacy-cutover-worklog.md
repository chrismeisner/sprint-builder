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
- **Phase 4 — repoint reads. ADMIN SIDE DONE; CLIENT SIDE PENDING.**
  - Done: admin hill detail (`HillDetailClient`) now shows the `HillBilling` panel (scope
    total, invoices create/send/void, agreement generate/view/PDF) + per-deliverable price
    editor; the legacy "pipeline bridge" card is gone; `convert` → **activate**; the detail
    route no longer reads `sprint_drafts`/`refinement_cycles` (Stage-B removed).
  - **Pending (next pass):** repoint the **client-facing** reads — `app/projects/[id]`
    (sprint+refinement sections → the project's client hills + `hill_invoices` pay links),
    the public `/sprints/[id]` + `/shared/sprint/[token]` + `/my-sprints` + `/budget`
    (redirect or rebuild on hills), and `/dashboard/refinement-cycles*` + `/dashboard/
    sprint-drafts` (redirect into hills). Then delete the legacy `app/api/sprint-drafts/**`
    and `app/api/refinement-cycles/**` route trees + secondary legacy readers
    (`profile`, `admin/stripe/activity`, `admin/db/status`, `intake-context`, `update-cycles`).
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

## Gotchas carried forward

- Prod Stripe is LIVE — verify billing in test mode only.
- Deploy gate is `next build` (lint + type-check), not `tsc` alone.
- No auto-push to git/Heroku; commits only when the owner asks (branch first off main).
