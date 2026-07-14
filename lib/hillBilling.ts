// Billing → Hills bridge (Phase 1/2 of the billing re-key).
//
// The billing satellite keeps living in its legacy tables (sprint_invoices,
// refinement_cycles, …). These helpers let those tables and the Stripe webhook
// resolve the owning hill and record billing activity on the hills timeline, so
// the unified dashboard reflects payments without billing being folded into
// `hills`. Everything here is ADDITIVE and best-effort — a failure never blocks
// a payment, a Stripe event, or an admin action. See docs/hill-model.md §4.

import type { Pool } from "pg";
import { randomUUID } from "crypto";

// A sprint/refinement legacy record maps to the hill that either reuses its PK
// (backfilled hills) or points at it via type_data.linked_id (converted hills).
// This is the same linkage the read-side uses in app/api/admin/hills/[id]/route.ts.
// Both resolvers swallow their own errors and return null. That guarantee lets
// callers invoke them anywhere — including before existing side effects like
// payment-notification emails — without a DB blip ever disrupting live billing.
export async function resolveHillIdForSprint(
  pool: Pool,
  sprintId: string
): Promise<string | null> {
  try {
    const res = await pool.query(
      `SELECT id FROM hills
        WHERE type = 'sprint' AND (id = $1 OR type_data->>'linked_id' = $1)
        LIMIT 1`,
      [sprintId]
    );
    return (res.rowCount ?? 0) > 0 ? (res.rows[0].id as string) : null;
  } catch (err) {
    console.error("[hillBilling] resolveHillIdForSprint failed:", err);
    return null;
  }
}

export async function resolveHillIdForCycle(
  pool: Pool,
  cycleId: string
): Promise<string | null> {
  try {
    const res = await pool.query(
      `SELECT id FROM hills
        WHERE type = 'refinement_cycle' AND (id = $1 OR type_data->>'linked_id' = $1)
        LIMIT 1`,
      [cycleId]
    );
    return (res.rowCount ?? 0) > 0 ? (res.rows[0].id as string) : null;
  } catch (err) {
    console.error("[hillBilling] resolveHillIdForCycle failed:", err);
    return null;
  }
}

// Record a billing event on the hill's timeline. Best-effort: swallows all
// errors (and no-ops when hillId is null) so it can never break a webhook or an
// admin flow. Mirrors the hill_events shape written elsewhere (kind='event').
export async function recordHillBillingEvent(
  pool: Pool,
  hillId: string | null,
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  if (!hillId) return;
  try {
    await pool.query(
      `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, data)
       VALUES ($1, $2, 'hill', $2, 'event', $3, $4::jsonb)`,
      [randomUUID(), hillId, eventType, JSON.stringify(data)]
    );
  } catch (err) {
    console.error("[hillBilling] failed to record hill billing event:", err);
  }
}
