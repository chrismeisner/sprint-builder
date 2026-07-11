-- Retire the dead `ai_responses` table and sprint_drafts.ai_response_id column.
--
-- Safe: the table is empty (0 rows) and nothing writes it — the intake→AI→
-- sprint-draft pipeline was never built. No code references the column anymore
-- (removed from lib/db.ts and app/sprints/[id]/page.tsx). Intake now flows
-- through /scope → hills (see docs/hill-model.md).
--
-- Run this explicitly when you're ready (it is intentionally NOT auto-run on
-- app boot, so a prod table is never dropped without review):
--
--   psql "$DATABASE_URL" -f scripts/drop-ai-responses.sql
--
-- Reversible if ever needed: recreate from the definition in git history.

ALTER TABLE sprint_drafts DROP COLUMN IF EXISTS ai_response_id;
DROP TABLE IF EXISTS ai_responses;
