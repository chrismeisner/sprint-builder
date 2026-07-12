import crypto from "crypto";
import type { PoolClient } from "pg";
import { getPool } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Studio Printer — print job queue.
//
// The server owns the queue; the studio agent claims + drains it. The payload is
// a frozen copy of exactly what to print, matching the agent's renderJob()
// contract (temp/the-boss/server/agent-template/agent.js). See
// docs/studio-printer-plan.md §5–6.
// ─────────────────────────────────────────────────────────────────────────────

export const PRINT_PAYLOAD_TYPES = ["note", "task", "sheet"] as const;
export type PrintPayloadType = (typeof PRINT_PAYLOAD_TYPES)[number];

export type PrintPayload = { type: PrintPayloadType; [key: string]: unknown };

export type PrintJob = {
  id: string;
  printer_id: string;
  payload: PrintPayload;
  status: "pending" | "claimed" | "printing" | "printed" | "failed" | "canceled";
  scheduled_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  lease_expires_at: string | null;
  attempts: number;
  max_attempts: number;
  error: string | null;
  printed_at: string | null;
  source: string | null;
  created_by: string | null;
  created_at: string;
};

export class PrintJobError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Validate a payload against the shapes the agent's printer.js can render. Throws
// PrintJobError(400) on anything malformed so bad jobs never reach the queue.
export function validatePrintPayload(payload: unknown): PrintPayload {
  if (!payload || typeof payload !== "object") {
    throw new PrintJobError("payload (the receipt to print) is required.");
  }
  const p = payload as Record<string, unknown>;
  const type = p.type;
  if (typeof type !== "string" || !PRINT_PAYLOAD_TYPES.includes(type as PrintPayloadType)) {
    throw new PrintJobError(
      `payload.type must be one of: ${PRINT_PAYLOAD_TYPES.join(", ")}.`
    );
  }

  if (type === "note") {
    if (typeof p.text !== "string" || !p.text.trim()) {
      throw new PrintJobError("A note payload needs a non-empty text.");
    }
  } else if (type === "task") {
    if (typeof p.title !== "string" || !p.title.trim()) {
      throw new PrintJobError("A task payload needs a non-empty title.");
    }
  } else if (type === "sheet") {
    if (!Array.isArray(p.sections) || p.sections.length === 0) {
      throw new PrintJobError("A sheet payload needs at least one section.");
    }
  }

  return p as PrintPayload;
}

// The printer to use when a caller doesn't name one. For now: the oldest
// registered printer (studios typically have one). Returns null if none exist.
export async function getDefaultPrinterId(): Promise<string | null> {
  const { rows } = await getPool().query(
    `SELECT id FROM printers ORDER BY created_at LIMIT 1`
  );
  return rows[0]?.id ?? null;
}

// Insert a pending job. printerId must exist. Returns the created row.
export async function enqueuePrintJob(
  printerId: string,
  payload: unknown,
  opts: { source?: string; createdBy?: string | null; scheduledAt?: string | null } = {}
): Promise<PrintJob> {
  const validated = validatePrintPayload(payload);
  const pool = getPool();

  const printer = await pool.query(`SELECT id FROM printers WHERE id = $1`, [printerId]);
  if (printer.rowCount === 0) {
    throw new PrintJobError("printer not found.", 404);
  }

  const id = `pj_${crypto.randomUUID()}`;
  const { rows } = await pool.query(
    `INSERT INTO print_jobs (id, printer_id, payload, scheduled_at, source, created_by)
     VALUES ($1, $2, $3::jsonb, COALESCE($4::timestamptz, now()), $5, $6)
     RETURNING *`,
    [
      id,
      printerId,
      JSON.stringify(validated),
      opts.scheduledAt ?? null,
      opts.source ?? "manual",
      opts.createdBy ?? null,
    ]
  );
  await recordJobEvent(id, "pending", { source: opts.source ?? "manual" });
  return rows[0] as PrintJob;
}

// Atomically claim up to `max` pending jobs for this agent's printers. The
// FOR UPDATE SKIP LOCKED lock guarantees exactly one claimer per job even under
// concurrent polls or multiple agents. Returns rows enriched with cups_name.
export async function claimPrintJobs(
  agentId: string,
  max: number
): Promise<(PrintJob & { cups_name: string })[]> {
  const leaseSeconds = Number(process.env.PRINT_CLAIM_LEASE_SECONDS) || 60;
  const limit = Math.min(Math.max(1, Number(max) || 5), 50);
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE print_jobs j
       SET status = 'claimed',
           claimed_by = $1,
           claimed_at = now(),
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
       RETURNING j.*, p.cups_name`,
      [agentId, leaseSeconds, limit]
    );
    for (const job of rows) {
      await insertEvent(client, job.id, "claimed", { agent: agentId });
    }
    await client.query("COMMIT");
    return rows as (PrintJob & { cups_name: string })[];
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Agent-reported status transition. The agent may only touch jobs it currently
// holds (claimed_by = agentId). Returns the updated job, or null if not found.
export async function transitionPrintJob(
  jobId: string,
  agentId: string,
  status: "printing" | "printed" | "failed",
  error?: string | null
): Promise<PrintJob | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const held = await client.query(
      `SELECT id FROM print_jobs WHERE id = $1 AND claimed_by = $2 FOR UPDATE`,
      [jobId, agentId]
    );
    if (held.rowCount === 0) {
      await client.query("ROLLBACK");
      return null;
    }

    const sets = ["status = $2", "error = $3"];
    if (status === "printed") sets.push("printed_at = now()", "lease_expires_at = NULL");

    const { rows } = await client.query(
      `UPDATE print_jobs SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
      [jobId, status, error ?? null]
    );
    await insertEvent(client, jobId, status, error ? { error } : null);
    await client.query("COMMIT");
    return rows[0] as PrintJob;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Reaper: recover jobs whose agent died mid-print (lease expired) back to pending,
// or fail them once they've exhausted max_attempts. Returns counts. See §5.
export async function reapExpiredPrintJobs(): Promise<{ requeued: number; failed: number }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lock the expired rows so the reaper and a late agent PATCH can't race.
    const expired = await client.query(
      `SELECT id, attempts, max_attempts FROM print_jobs
        WHERE status IN ('claimed','printing')
          AND lease_expires_at IS NOT NULL
          AND lease_expires_at <= now()
        FOR UPDATE SKIP LOCKED`
    );

    let requeued = 0;
    let failed = 0;
    for (const job of expired.rows) {
      if (job.attempts >= job.max_attempts) {
        await client.query(
          `UPDATE print_jobs
              SET status = 'failed', error = 'Lease expired; max attempts reached', lease_expires_at = NULL
            WHERE id = $1`,
          [job.id]
        );
        await insertEvent(client, job.id, "failed", { reason: "lease-expired-max-attempts" });
        failed += 1;
      } else {
        await client.query(
          `UPDATE print_jobs
              SET status = 'pending', claimed_by = NULL, claimed_at = NULL, lease_expires_at = NULL
            WHERE id = $1`,
          [job.id]
        );
        await insertEvent(client, job.id, "pending", { reason: "lease-expired-requeued" });
        requeued += 1;
      }
    }
    await client.query("COMMIT");
    return { requeued, failed };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Cancel a pending job (admin). Only 'pending' jobs can be canceled.
export async function cancelPrintJob(jobId: string): Promise<PrintJob | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `UPDATE print_jobs SET status = 'canceled'
      WHERE id = $1 AND status = 'pending' RETURNING *`,
    [jobId]
  );
  if (rows.length === 0) return null;
  await recordJobEvent(jobId, "canceled", { source: "admin" });
  return rows[0] as PrintJob;
}

// ── Events (audit trail) ─────────────────────────────────────────────────────

async function insertEvent(
  client: PoolClient,
  jobId: string,
  status: string,
  detail: Record<string, unknown> | null
): Promise<void> {
  await client.query(
    `INSERT INTO print_job_events (id, job_id, status, detail) VALUES ($1, $2, $3, $4::jsonb)`,
    [`pje_${crypto.randomUUID()}`, jobId, status, detail ? JSON.stringify(detail) : null]
  );
}

export async function recordJobEvent(
  jobId: string,
  status: string,
  detail: Record<string, unknown> | null
): Promise<void> {
  const pool = getPool();
  await pool
    .query(
      `INSERT INTO print_job_events (id, job_id, status, detail) VALUES ($1, $2, $3, $4::jsonb)`,
      [`pje_${crypto.randomUUID()}`, jobId, status, detail ? JSON.stringify(detail) : null]
    )
    .catch(() => {});
}
