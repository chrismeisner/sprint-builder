import { getPool } from "./db";
import crypto from "crypto";

// The single engine that turns a scoping submission (from the public survey,
// a client, or later an AI pass) into a proposal hill in the SCOPE phase with
// suggested draft items the studio then accepts or dismisses. This is the one
// place the three legacy intake flows converge. See docs/hill-model.md.

const VALID_TYPES = ["personal", "sprint", "refinement_cycle"] as const;
const VALID_SPANS = ["day", "week", "month", "quarter", "year"] as const;
const DEFAULT_STATUS: Record<string, string> = {
  personal: "active",
  sprint: "draft",
  refinement_cycle: "submitted",
};

// Guardrails for untrusted (public) input.
const MAX_ITEMS = 50;
const MAX_LEN = 500;

export type HillIntakeInput = {
  title: string;
  type?: string;
  spanGranularity?: string | null;
  summary?: string | null;
  submitterEmail?: string | null;
  projectId?: string | null;
  createdBy?: string | null;
  /** Desired outcomes → suggested deliverables (downhill). */
  deliverables?: string[];
  /** Things to figure out / resolve → suggested tasks (the climb). */
  tasks?: string[];
  /** How the hill was created: intake | ai | manual | recurring. */
  origin?: string;
};

function cleanLines(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => (typeof s === "string" ? s.trim().slice(0, MAX_LEN) : ""))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

export async function createHillFromIntake(
  input: HillIntakeInput
): Promise<{ hillId: string; deliverableCount: number; taskCount: number }> {
  const title = (input.title ?? "").toString().trim().slice(0, MAX_LEN);
  if (!title) throw new Error("Title is required");

  const type = VALID_TYPES.includes(input.type as (typeof VALID_TYPES)[number])
    ? (input.type as string)
    : "sprint";
  const span = VALID_SPANS.includes(input.spanGranularity as (typeof VALID_SPANS)[number])
    ? (input.spanGranularity as string)
    : null;
  const origin = ["intake", "ai", "manual", "recurring"].includes(input.origin ?? "")
    ? (input.origin as string)
    : "intake";

  const deliverables = cleanLines(input.deliverables);
  const tasks = cleanLines(input.tasks);

  const hillId = crypto.randomUUID();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO hills (id, type, title, summary, status, phase, progress,
         span_granularity, project_id, origin, submitter_email, created_by)
       VALUES ($1, $2, $3, $4, $5, 'scope', 0, $6, $7, $8, $9, $10)`,
      [
        hillId,
        type,
        title,
        input.summary ?? null,
        DEFAULT_STATUS[type],
        span,
        input.projectId ?? null,
        origin,
        input.submitterEmail ?? null,
        input.createdBy ?? null,
      ]
    );

    for (let i = 0; i < deliverables.length; i++) {
      await client.query(
        `INSERT INTO hill_deliverables (id, hill_id, name, source, origin, sort_order)
         VALUES ($1, $2, $3, 'intake', 'suggested', $4)`,
        [crypto.randomUUID(), hillId, deliverables[i], i]
      );
    }
    for (let i = 0; i < tasks.length; i++) {
      await client.query(
        `INSERT INTO hill_tasks (id, hill_id, name, origin, sort_order)
         VALUES ($1, $2, $3, 'suggested', $4)`,
        [crypto.randomUUID(), hillId, tasks[i], i]
      );
    }

    // Activity log entry (best-effort inside the tx).
    await client.query(
      `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, author_email, data)
       VALUES ($1, $2, 'hill', $2, 'event', 'submitted', $3, $4)`,
      [
        crypto.randomUUID(),
        hillId,
        input.submitterEmail ?? null,
        JSON.stringify({ deliverables: deliverables.length, tasks: tasks.length, origin }),
      ]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  return { hillId, deliverableCount: deliverables.length, taskCount: tasks.length };
}
