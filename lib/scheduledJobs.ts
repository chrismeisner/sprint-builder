import { getPool } from "./db";

// Stamp a scheduled job's last run. Called by each cron endpoint when it fires,
// so the schedulers page can infer "active" from real activity (Heroku Scheduler
// config isn't queryable from the app). Best-effort — never throws.
export async function recordJobRun(
  jobKey: string,
  status: "ok" | "error",
  note?: string
): Promise<void> {
  try {
    await getPool().query(
      `UPDATE scheduled_jobs
          SET last_run_at = now(), last_run_status = $2, last_run_note = $3, updated_at = now()
        WHERE job_key = $1`,
      [jobKey, status, note ?? null]
    );
  } catch (e) {
    console.error("recordJobRun failed:", e);
  }
}
