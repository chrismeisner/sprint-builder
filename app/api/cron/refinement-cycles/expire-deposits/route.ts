import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { onCycleExpired } from "@/lib/refinementCycleBilling";
import { getStripe } from "@/lib/stripe";

// POST /api/cron/refinement-cycles/expire-deposits
//
// Sweeps `refinement_cycles` for rows in `awaiting_deposit` whose
// `deposit_due_at` has passed. Each match is transitioned to `expired`,
// the corresponding Stripe deposit invoice is voided (best-effort), and
// the submitter is emailed.
//
// Protected by CRON_SECRET. Run by Heroku Scheduler at 10:01am ET via
// scripts/expire-refinement-cycle-deposits.js.
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const pool = getPool();

    const result = await pool.query(
      `
      UPDATE refinement_cycles
      SET status = 'expired',
          expired_at = now(),
          updated_at = now()
      WHERE status = 'awaiting_deposit'
        AND deposit_due_at IS NOT NULL
        AND deposit_due_at < now()
      RETURNING id, stripe_deposit_invoice_id
      `
    );

    const expired = result.rows as Array<{
      id: string;
      stripe_deposit_invoice_id: string | null;
    }>;

    // Best-effort: void the unpaid deposit invoice in Stripe so it doesn't
    // sit around as a reachable URL after the slot is released.
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = getStripe();
      for (const row of expired) {
        if (!row.stripe_deposit_invoice_id) continue;
        try {
          await stripe.invoices.voidInvoice(row.stripe_deposit_invoice_id);
        } catch (err) {
          console.error(
            `[CronExpireDeposits] Failed to void Stripe invoice ${row.stripe_deposit_invoice_id} for cycle ${row.id}:`,
            (err as Error).message
          );
        }
      }
    }

    for (const row of expired) {
      await onCycleExpired(row.id);
    }

    return NextResponse.json({
      success: true,
      expired: expired.length,
      ids: expired.map((r) => r.id),
    });
  } catch (err) {
    console.error("[CronExpireDeposits]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Cron failed" },
      { status: 500 }
    );
  }
}
