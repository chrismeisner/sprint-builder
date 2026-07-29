-- Export the personal work held in the hill tables to readable CSVs, so it can
-- be kept after scripts/drop-hill-tables.sql removes the tables.
--
-- Only the PERSONAL rows matter here. Client-work hills (type 'sprint' /
-- 'refinement_cycle') were backfilled from sprint_drafts / refinement_cycles and
-- still exist there, so they are not worth exporting.
--
-- Read-only — this writes files, it does not modify the database:
--
--   psql "$DATABASE_URL" -f scripts/export-hill-data.sql
--
-- Writes to the directory psql was invoked from (\copy is client-side, so this
-- works against Heroku/RDS without server filesystem access).

\echo 'Exporting personal hills → hills-personal.csv'
\copy (SELECT id, title, summary, status, phase, progress, span_granularity, day_key, target_date, started_at, created_at, updated_at FROM hills WHERE type = 'personal' ORDER BY created_at) TO 'hills-personal.csv' WITH CSV HEADER

\echo 'Exporting ideas → hill-ideas.csv'
\copy (SELECT i.id, i.hill_id, h.title AS hill_title, i.title, i.summary, i.status, i.created_at FROM hill_ideas i LEFT JOIN hills h ON h.id = i.hill_id ORDER BY i.created_at) TO 'hill-ideas.csv' WITH CSV HEADER

\echo 'Exporting tasks → hill-tasks.csv'
\copy (SELECT t.id, t.hill_id, h.title AS hill_title, t.name, t.note, t.completed, t.completed_at, t.progress, t.focus, t.archived, t.parent_task_id, t.created_at FROM hill_tasks t LEFT JOIN hills h ON h.id = t.hill_id ORDER BY t.created_at) TO 'hill-tasks.csv' WITH CSV HEADER

\echo 'Exporting notes → notes.csv'
\copy (SELECT id, body, subject_type, subject_id, created_at, updated_at FROM notes ORDER BY created_at) TO 'notes.csv' WITH CSV HEADER

\echo 'Exporting the personal timeline → hill-events.csv'
\copy (SELECT e.id, e.hill_id, h.title AS hill_title, e.kind, e.event_type, e.body, e.data, e.created_at FROM hill_events e JOIN hills h ON h.id = e.hill_id WHERE h.type = 'personal' ORDER BY e.created_at) TO 'hill-events.csv' WITH CSV HEADER

\echo 'Exporting attachment pointers → hill-attachments.csv'
\echo '  (GCS object paths only — the files themselves live in the bucket and are not deleted by the drop)'
\copy (SELECT id, subject_type, subject_id, name, filename, file_url, object_path, mimetype, size_bytes, link_type, url, created_at FROM hill_attachments ORDER BY created_at) TO 'hill-attachments.csv' WITH CSV HEADER

\echo ''
\echo 'Done. Six CSVs written to the current directory.'
