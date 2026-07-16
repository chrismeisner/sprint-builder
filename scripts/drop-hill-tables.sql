-- Drop the hill_* tables and the additive hill_id columns.
--
-- Companion to the commit that removed the hills system in favour of the single
-- projects → sprints hierarchy. Nothing in the app creates or reads any of this
-- anymore, so the tables are inert — dropping them is cleanup, not a fix. There
-- is no rush, and no code change depends on it.
--
-- ┌─ READ BEFORE RUNNING ──────────────────────────────────────────────────────┐
-- │ THIS DESTROYS DATA THAT EXISTS NOWHERE ELSE.                               │
-- │                                                                            │
-- │ The client-work rows in `hills` were backfilled from sprint_drafts /       │
-- │ refinement_cycles and ARE duplicates — dropping them loses nothing.        │
-- │                                                                            │
-- │ The PERSONAL rows are not. Since the v338 cutover, /dashboard/tasks was a  │
-- │ redirect and every personal task, idea, milestone and note was written to  │
-- │ hill_tasks / hill_ideas / hills / hill_events / notes. The legacy          │
-- │ admin_tasks tables were frozen at v338 and never caught up, so they are    │
-- │ NOT a backup of this. Once dropped, that work is gone.                     │
-- │                                                                            │
-- │ Take a backup first and keep it somewhere you can actually read:           │
-- │   heroku pg:backups:capture --app sprint-builder                           │
-- │ Or export just this data as a keepsake before dropping:                    │
-- │   psql "$DATABASE_URL" -f scripts/export-hill-data.sql                     │
-- └────────────────────────────────────────────────────────────────────────────┘
--
-- Sprint/refinement/billing data is NOT touched. The only change to those
-- tables is removing the nullable hill_id column that the hills re-key added —
-- every other column, row and Stripe linkage stays exactly as it is.
--
-- `scheduled_jobs` is deliberately KEPT: it predates nothing, but the studio
-- printer's reap-print-jobs cron depends on it (lib/scheduledJobs.ts). Only the
-- four hill job rows are removed.
--
-- Run explicitly when ready (intentionally NOT auto-run on app boot):
--
--   psql "$DATABASE_URL" -f scripts/drop-hill-tables.sql
--
-- Reversible only from a backup. The table definitions live in git history
-- (lib/db.ts before the hills removal), but the rows do not.

BEGIN;

-- 1. Additive FK columns on the billing satellite. These were added by the
--    hills re-key and nothing reads them now. Dropping a column does not touch
--    the rest of the row.
ALTER TABLE sprint_invoices     DROP COLUMN IF EXISTS hill_id;
ALTER TABLE deferred_comp_plans DROP COLUMN IF EXISTS hill_id;
ALTER TABLE refinement_cycles   DROP COLUMN IF EXISTS hill_id;

-- 2. The hill tables. Listed in one statement because hills.recurrence_id and
--    hill_recurrences.source_hill_id reference each other; a single DROP
--    resolves the cycle without needing CASCADE to reach outside this set.
DROP TABLE IF EXISTS
  hill_attachments,
  hill_events,
  hill_tasks,
  hill_deliverables,
  hill_ideas,
  hill_recurrences,
  hills,
  notes;

-- 3. The hill cron jobs from the scheduler registry. The table itself and the
--    printer's reap-print-jobs row stay.
DELETE FROM scheduled_jobs
 WHERE job_key IN ('hills-reset-daily', 'hills-reset-weekly', 'morning-hill', 'spawn-recurrences');

COMMIT;

-- Verify afterwards: expect 0 hill tables, and sprint data intact.
--
--   SELECT count(*) AS hill_tables_remaining
--     FROM information_schema.tables
--    WHERE table_schema = 'public'
--      AND (table_name LIKE 'hill%' OR table_name = 'notes');
--
--   SELECT
--     (SELECT count(*) FROM sprint_drafts)      AS sprint_drafts,
--     (SELECT count(*) FROM refinement_cycles)  AS refinement_cycles,
--     (SELECT count(*) FROM sprint_invoices)    AS sprint_invoices;
