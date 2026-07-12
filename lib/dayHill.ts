import { getPool } from "./db";
import crypto from "crypto";

// "A day is a hill." A day-hill is a personal hill representing one calendar day,
// created each morning in the scope phase. The morning ritual auto-creates it and
// invites the owner to shape the day; "start the climb" stamps started_at and
// moves it to the climb phase. See docs/hill-model.md.

const TZ = "America/New_York";

/** Today's calendar day (YYYY-MM-DD) in the studio timezone. */
export function todayKey(now: Date = new Date()): string {
  // en-CA renders as YYYY-MM-DD.
  return now.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** A warm, human title for a day-hill, e.g. "Saturday, Jul 12". */
export function dayTitle(dayKey: string): string {
  // Parse as a local date (avoid TZ shifting a bare YYYY-MM-DD).
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export type DayHill = {
  id: string;
  title: string | null;
  day_key: string;
  phase: string | null;
  started_at: string | null;
  progress: number;
  created: boolean;
};

/**
 * Ensure the owner's day-hill for `dayKey` exists; create it (scope phase) if not.
 * Idempotent — one day-hill per (owner, day). Returns the hill with a `created` flag.
 */
export async function ensureDayHill(dayKey: string, ownerAccountId: string | null): Promise<DayHill> {
  const pool = getPool();

  const existing = await pool.query(
    `SELECT id, title, day_key, phase, started_at, progress
       FROM hills
      WHERE day_key = $1 AND type = 'personal'
        AND ($2::text IS NULL OR created_by = $2)
      ORDER BY created_at
      LIMIT 1`,
    [dayKey, ownerAccountId]
  );
  if ((existing.rowCount ?? 0) > 0) {
    return { ...existing.rows[0], created: false };
  }

  const id = crypto.randomUUID();
  const inserted = await pool.query(
    `INSERT INTO hills (id, type, title, status, phase, progress, span_granularity,
        target_date, day_key, origin, created_by)
     VALUES ($1, 'personal', $2, 'active', 'scope', 0, 'day', $3::date, $3::date, 'recurring', $4)
     RETURNING id, title, day_key, phase, started_at, progress`,
    [id, dayTitle(dayKey), dayKey, ownerAccountId]
  );

  await pool
    .query(
      `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, data)
       VALUES ($1, $2, 'hill', $2, 'event', 'day_started', $3)`,
      [crypto.randomUUID(), id, JSON.stringify({ day_key: dayKey })]
    )
    .catch(() => {});

  return { ...inserted.rows[0], created: true };
}
