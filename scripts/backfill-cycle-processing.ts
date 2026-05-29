#!/usr/bin/env tsx
/**
 * One-off backfill for refinement cycles whose ACH "processing" webhook was
 * missed before the invoice_payments routing fix (PR: route ACH invoice
 * payments via invoice_payments).
 *
 * Replays exactly what the fixed webhook's
 * `sendCyclePaymentNotifications(..., "final", "processing", ...)` path does:
 *   1. Stamp final_payment_initiated_at (idempotent — only if NULL).
 *   2. Send the processing client + admin emails using the production templates.
 *
 * Status itself does NOT change on "processing" — the cycle stays
 * `awaiting_payment` until the ACH clears (invoice.paid → delivered).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/backfill-cycle-processing.ts <cycleId>          # dry run
 *   npx tsx --env-file=.env.local scripts/backfill-cycle-processing.ts <cycleId> --commit  # apply + send
 */
import { getPool } from "@/lib/db";
import {
  sendEmail,
  generateRefinementCyclePaymentProcessingClientEmail,
  generateRefinementCyclePaymentProcessingAdminEmail,
} from "@/lib/email";

async function main() {
  const cycleId = process.argv[2];
  const commit = process.argv.includes("--commit");
  if (!cycleId) {
    console.error("Usage: backfill-cycle-processing.ts <cycleId> [--commit]");
    process.exit(1);
  }
  const kind: "deposit" | "final" = "final";
  const origin = (process.env.BASE_URL || "https://meisner.design").replace(/\/$/, "");
  const cycleUrl = `${origin}/dashboard/refinement-cycles/${cycleId}`;

  const pool = getPool();

  const infoRes = await pool.query(
    `SELECT rc.status, rc.title, rc.submitter_email, rc.cc_emails,
            rc.total_price, rc.deposit_amount, rc.final_amount, rc.requires_deposit,
            rc.final_payment_initiated_at, rc.final_paid_at,
            p.name AS project_name, p.emoji AS project_emoji
     FROM refinement_cycles rc
     LEFT JOIN projects p ON p.id = rc.project_id
     WHERE rc.id = $1
     LIMIT 1`,
    [cycleId]
  );
  if ((infoRes.rowCount ?? 0) === 0) {
    console.error(`Cycle ${cycleId} not found`);
    process.exit(1);
  }
  const info = infoRes.rows[0];
  console.log(`Cycle: ${cycleId}`);
  console.log(`  status: ${info.status}`);
  console.log(`  final_payment_initiated_at: ${info.final_payment_initiated_at ?? "NULL"}`);
  console.log(`  final_paid_at: ${info.final_paid_at ?? "NULL"}`);

  if (info.final_paid_at) {
    console.log("Final already paid — nothing to backfill. Exiting.");
    process.exit(0);
  }
  if (info.final_payment_initiated_at) {
    console.log("final_payment_initiated_at already stamped — processing emails presumed sent. Exiting (idempotent).");
    process.exit(0);
  }

  // Final invoice bills final_amount (legacy deposit flow) or the full
  // total_price (pay-on-delivery). Mirror refinementCycleBilling.
  const amount = info.requires_deposit
    ? Number(info.final_amount ?? 0)
    : Number(info.total_price ?? 0);

  // Client recipients: submitter + cc_emails, deduped + lowercased (matches webhook).
  const clientRecipients = new Set<string>();
  if (info.submitter_email) clientRecipients.add(String(info.submitter_email).toLowerCase());
  for (const cc of (info.cc_emails ?? []) as string[]) {
    if (cc) clientRecipients.add(cc.toLowerCase());
  }
  const clientEmailSummary = Array.from(clientRecipients).join(", ") || null;

  const adminRes = await pool.query(
    `SELECT email, first_name, last_name FROM accounts WHERE is_admin = true`
  );
  const admins = adminRes.rows as Array<{ email: string; first_name: string | null; last_name: string | null }>;

  console.log(`\nWould send PROCESSING emails (kind=${kind}, amount=$${amount}):`);
  console.log(`  client → ${Array.from(clientRecipients).join(", ")}`);
  console.log(`  admin  → ${admins.map((a) => a.email).join(", ")}`);

  if (!commit) {
    console.log("\n[DRY RUN] No DB write, no emails sent. Re-run with --commit to apply.");
    process.exit(0);
  }

  // Stamp idempotently — only fire emails if WE performed the first stamp.
  const stamp = await pool.query(
    `WITH prev AS (
       SELECT final_payment_initiated_at AS old_ts FROM refinement_cycles WHERE id = $1
     )
     UPDATE refinement_cycles rc
     SET final_payment_initiated_at = COALESCE(rc.final_payment_initiated_at, now()),
         updated_at = now()
     FROM prev
     WHERE rc.id = $1
     RETURNING (prev.old_ts IS NULL) AS was_first`,
    [cycleId]
  );
  const wasFirst = stamp.rows[0]?.was_first === true;
  console.log(`\nStamped final_payment_initiated_at (was_first=${wasFirst}).`);
  if (!wasFirst) {
    console.log("Another process already stamped it — skipping emails to avoid duplicates.");
    process.exit(0);
  }

  for (const email of Array.from(clientRecipients)) {
    const content = generateRefinementCyclePaymentProcessingClientEmail({
      kind,
      cycleTitle: info.title,
      projectName: info.project_name,
      projectEmoji: info.project_emoji,
      amount,
    });
    const res = await sendEmail({
      to: email,
      ...content,
      category: "transactional",
      tag: "refinement-cycle-payment-processing-client",
    });
    console.log(`  client ${email}: ${res.success ? "sent" : res.suppressed ? "suppressed" : `FAILED (${res.error})`}`);
  }

  for (const admin of admins) {
    const adminName = [admin.first_name, admin.last_name].filter(Boolean).join(" ") || null;
    const content = generateRefinementCyclePaymentProcessingAdminEmail({
      kind,
      cycleTitle: info.title,
      projectName: info.project_name,
      projectEmoji: info.project_emoji,
      amount,
      clientEmail: clientEmailSummary,
      adminName,
      cycleUrl,
    });
    const res = await sendEmail({
      to: admin.email,
      ...content,
      category: "transactional",
      tag: "refinement-cycle-payment-processing-admin",
    });
    console.log(`  admin ${admin.email}: ${res.success ? "sent" : res.suppressed ? "suppressed" : `FAILED (${res.error})`}`);
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
