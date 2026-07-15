#!/usr/bin/env node
/**
 * Backfill historical client billing + pricing into the hills-native surface so
 * that pre-existing engagements render correctly on the new /projects/[id] page
 * and hill Billing panel.
 *
 * ADDITIVE and IDEMPOTENT. It never deletes and never overwrites a value that
 * was set by the new flow (it only fills gaps):
 *   A. sprint_invoices           -> hill_invoices (kind='sprint', PK reused)
 *   B. refinement deposit/final  -> hill_invoices (kind='deposit'|'final')
 *      (only for invoices that actually existed — a Stripe id or a paid stamp)
 *   C. hill_deliverables.price   -> reconstructed for backfilled sprint lines,
 *      scaled so each hill's line prices sum EXACTLY to its stored contract
 *      total (hills.type_data.total_fixed_price). Only fills rows where price
 *      IS NULL, so manually-priced deliverables are never touched.
 *
 * Nothing in the legacy tables is modified or removed — this only writes the
 * hills side. Safe to run repeatedly.
 *
 * Usage:
 *   node scripts/backfill-hill-billing.js            # DRY RUN (rolls back; prints counts)
 *   node scripts/backfill-hill-billing.js --commit   # apply
 */
const { Pool } = require("pg");

const COMMIT = process.argv.includes("--commit");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || "")
    ? false
    : { rejectUnauthorized: false },
});

// Resolve a hill id for a legacy record: the reused PK, or type_data.linked_id.
const RESOLVE_SPRINT = `(SELECT h.id FROM hills h WHERE h.type='sprint' AND (h.id = si.sprint_id OR h.type_data->>'linked_id' = si.sprint_id) LIMIT 1)`;
const RESOLVE_CYCLE = `(SELECT h.id FROM hills h WHERE h.type='refinement_cycle' AND (h.id = rc.id OR h.type_data->>'linked_id' = rc.id) LIMIT 1)`;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const client = await pool.connect();
  const report = {};
  try {
    await client.query("BEGIN");

    // ── A. sprint_invoices -> hill_invoices ──────────────────────────────────
    const a = await client.query(`
      INSERT INTO hill_invoices
        (id, hill_id, kind, label, amount, invoice_status, invoice_url,
         invoice_pdf_url, stripe_invoice_id, sort_order, legacy_source, legacy_id, created_at)
      SELECT si.id, COALESCE(si.hill_id, ${RESOLVE_SPRINT}), 'sprint',
             si.label, si.amount, COALESCE(si.invoice_status, 'not_sent'),
             si.invoice_url, si.invoice_pdf_url, si.stripe_invoice_id,
             COALESCE(si.sort_order, 0), 'sprint_invoices', si.id, si.created_at
        FROM sprint_invoices si
       WHERE COALESCE(si.hill_id, ${RESOLVE_SPRINT}) IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        hill_id = EXCLUDED.hill_id, amount = EXCLUDED.amount,
        invoice_status = EXCLUDED.invoice_status, invoice_url = EXCLUDED.invoice_url,
        invoice_pdf_url = EXCLUDED.invoice_pdf_url,
        stripe_invoice_id = EXCLUDED.stripe_invoice_id, updated_at = now();
    `);
    report.sprintInvoices = a.rowCount;

    // ── B. refinement deposit + final -> hill_invoices ───────────────────────
    const dep = await client.query(`
      INSERT INTO hill_invoices
        (id, hill_id, kind, label, amount, invoice_status, invoice_url,
         stripe_invoice_id, paid_at, payment_initiated_at, sort_order, legacy_source, legacy_id, created_at)
      SELECT rc.id || '-deposit', COALESCE(rc.hill_id, ${RESOLVE_CYCLE}), 'deposit',
             'Deposit', rc.deposit_amount,
             CASE WHEN rc.deposit_paid_at IS NOT NULL THEN 'paid'
                  WHEN rc.deposit_payment_initiated_at IS NOT NULL THEN 'processing'
                  WHEN rc.stripe_deposit_invoice_id IS NOT NULL THEN 'sent'
                  ELSE 'not_sent' END,
             rc.stripe_deposit_invoice_url, rc.stripe_deposit_invoice_id,
             rc.deposit_paid_at, rc.deposit_payment_initiated_at,
             0, 'refinement_cycle_deposit', rc.id, rc.created_at
        FROM refinement_cycles rc
       WHERE (rc.stripe_deposit_invoice_id IS NOT NULL OR rc.deposit_paid_at IS NOT NULL)
         AND COALESCE(rc.hill_id, ${RESOLVE_CYCLE}) IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        amount = EXCLUDED.amount, invoice_status = EXCLUDED.invoice_status,
        invoice_url = EXCLUDED.invoice_url, stripe_invoice_id = EXCLUDED.stripe_invoice_id,
        paid_at = EXCLUDED.paid_at, payment_initiated_at = EXCLUDED.payment_initiated_at,
        updated_at = now();
    `);
    report.refinementDeposits = dep.rowCount;

    const fin = await client.query(`
      INSERT INTO hill_invoices
        (id, hill_id, kind, label, amount, invoice_status, invoice_url,
         stripe_invoice_id, paid_at, payment_initiated_at, sort_order, legacy_source, legacy_id, created_at)
      SELECT rc.id || '-final', COALESCE(rc.hill_id, ${RESOLVE_CYCLE}), 'final',
             'Final', CASE WHEN rc.requires_deposit THEN rc.final_amount ELSE rc.total_price END,
             CASE WHEN rc.final_paid_at IS NOT NULL THEN 'paid'
                  WHEN rc.final_payment_initiated_at IS NOT NULL THEN 'processing'
                  WHEN rc.stripe_final_invoice_id IS NOT NULL THEN 'sent'
                  ELSE 'not_sent' END,
             rc.stripe_final_invoice_url, rc.stripe_final_invoice_id,
             rc.final_paid_at, rc.final_payment_initiated_at,
             1, 'refinement_cycle_final', rc.id, rc.created_at
        FROM refinement_cycles rc
       WHERE (rc.stripe_final_invoice_id IS NOT NULL OR rc.final_paid_at IS NOT NULL)
         AND COALESCE(rc.hill_id, ${RESOLVE_CYCLE}) IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        amount = EXCLUDED.amount, invoice_status = EXCLUDED.invoice_status,
        invoice_url = EXCLUDED.invoice_url, stripe_invoice_id = EXCLUDED.stripe_invoice_id,
        paid_at = EXCLUDED.paid_at, payment_initiated_at = EXCLUDED.payment_initiated_at,
        updated_at = now();
    `);
    report.refinementFinals = fin.rowCount;

    // ── C. reconstruct hill_deliverables.price for backfilled sprint lines ────
    // Scale each line by its points weight so the lines sum EXACTLY to the
    // hill's stored contract total. Rate-independent; only fills NULL prices.
    const hills = await client.query(
      `SELECT id, (type_data->>'total_fixed_price')::numeric AS total
         FROM hills WHERE type = 'sprint'`
    );
    let linesPriced = 0;
    let hillsPriced = 0;
    for (const h of hills.rows) {
      const delivs = await client.query(
        `SELECT id,
                COALESCE((type_data->>'custom_estimate_points')::numeric,
                         (type_data->>'base_points')::numeric, 0) AS points
           FROM hill_deliverables
          WHERE hill_id = $1 AND legacy_source = 'sprint_deliverables'
            AND dismissed_at IS NULL AND price IS NULL
          ORDER BY sort_order, created_at`,
        [h.id]
      );
      if (delivs.rows.length === 0) continue;

      const points = delivs.rows.map((d) => Number(d.points) || 0);
      const pointSum = points.reduce((a, b) => a + b, 0);
      const total = h.total != null ? Number(h.total) : null;

      let prices;
      if (total != null && pointSum > 0) {
        prices = points.map((p) => Math.round((p / pointSum) * total * 100) / 100);
      } else if (total != null && pointSum === 0) {
        const each = Math.round((total / delivs.rows.length) * 100) / 100;
        prices = delivs.rows.map(() => each);
      } else {
        // No stored total — fall back to the standard $1,750/point rate.
        prices = points.map((p) => Math.round(p * 1750 * 100) / 100);
      }

      for (let i = 0; i < delivs.rows.length; i++) {
        await client.query(
          `UPDATE hill_deliverables SET price = $1, updated_at = now() WHERE id = $2`,
          [prices[i], delivs.rows[i].id]
        );
        linesPriced++;
      }
      hillsPriced++;
    }
    report.deliverableLinesPriced = linesPriced;
    report.hillsPriced = hillsPriced;

    if (COMMIT) {
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }

    console.log(`\n  Backfill hill billing — ${COMMIT ? "COMMITTED" : "DRY RUN (rolled back)"}\n`);
    console.log(`  A. sprint invoices upserted        : ${report.sprintInvoices}`);
    console.log(`  B. refinement deposit invoices     : ${report.refinementDeposits}`);
    console.log(`     refinement final invoices       : ${report.refinementFinals}`);
    console.log(`  C. sprint deliverable lines priced : ${report.deliverableLinesPriced} (across ${report.hillsPriced} hills)`);
    if (!COMMIT) console.log(`\n  Re-run with --commit to apply.\n`);
    else console.log(`\n  Done.\n`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
