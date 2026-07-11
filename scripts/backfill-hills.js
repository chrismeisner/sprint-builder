#!/usr/bin/env node

/**
 * Backfill the unified Hill model from the legacy tables.
 *
 *   node scripts/backfill-hills.js            # dry run — reports counts, writes nothing
 *   node scripts/backfill-hills.js --commit   # actually populate the hill_* tables
 *
 * Safe to re-run: every statement upserts on the (reused) legacy primary key,
 * so a milestone id becomes its hill id, a task keeps its id, etc. That means
 * admin_tasks.idea_id / parent_task_id / milestone_id all map across with no
 * translation. Legacy tables are read-only here and are never modified.
 *
 * Prereq: the hill_* tables must already exist (created by the app's
 * ensureSchema on boot, or via POST /api/admin/db/ensure). See docs/hill-model.md.
 *
 * Billing (sprint_invoices, deferred_comp_plans, Stripe columns, the webhook)
 * is intentionally NOT migrated here — it stays a satellite and is re-keyed in
 * a separate, isolated step.
 */

const path = require("path");
try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
} catch {
  /* dotenv optional */
}
const { Pool } = require("pg");

const COMMIT = process.argv.includes("--commit");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Each step is one idempotent set-based statement. Ordered by FK dependency:
// hills -> ideas/deliverables -> tasks -> events/attachments.
const STEPS = [
  {
    name: "hills <- admin_milestones (personal)",
    sql: `
      INSERT INTO hills (id, type, title, summary, status, phase, progress,
        target_date, completed, completed_at, sort_order, type_data,
        legacy_source, legacy_id, created_at, updated_at)
      SELECT m.id, 'personal', m.name, m.notes,
        CASE WHEN m.completed THEN 'complete' ELSE 'active' END,
        CASE WHEN m.completed THEN 'descend' ELSE 'scope' END,
        CASE WHEN m.completed THEN 100 ELSE 0 END,
        m.target_date, m.completed, m.completed_at, COALESCE(m.sort_order, 0),
        '{}'::jsonb, 'admin_milestones', m.id, m.created_at, m.updated_at
      FROM admin_milestones m
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title, summary = EXCLUDED.summary, status = EXCLUDED.status,
        phase = EXCLUDED.phase, progress = EXCLUDED.progress, target_date = EXCLUDED.target_date,
        completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at,
        sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;
    `,
  },
  {
    name: "hills <- sprint_drafts (sprint)",
    sql: `
      INSERT INTO hills (id, type, title, summary, status, phase, progress,
        project_id, span_granularity, start_date, target_date, completed,
        share_token, type_data, legacy_source, legacy_id, created_at, updated_at)
      SELECT s.id, 'sprint', s.title, s.package_description_snapshot, s.status,
        CASE s.status
          WHEN 'draft' THEN 'scope' WHEN 'scheduled' THEN 'scope'
          WHEN 'in_progress' THEN 'climb'
          WHEN 'complete' THEN 'descend' WHEN 'archived' THEN 'descend'
          ELSE 'scope' END,
        CASE WHEN s.status IN ('complete','archived') THEN 100 ELSE 0 END,
        s.project_id, 'week', s.start_date, s.due_date::timestamptz,
        (s.status IN ('complete','archived')),
        s.share_token,
        jsonb_strip_nulls(jsonb_build_object(
          'weeks', s.weeks, 'deliverable_count', s.deliverable_count,
          'total_estimate_points', s.total_estimate_points,
          'total_fixed_hours', s.total_fixed_hours, 'total_fixed_price', s.total_fixed_price,
          'contract_status', s.contract_status, 'contract_url', s.contract_url,
          'contract_pdf_url', s.contract_pdf_url, 'invoice_status', s.invoice_status,
          'invoice_url', s.invoice_url, 'invoice_pdf_url', s.invoice_pdf_url,
          'budget_status', s.budget_status,
          'package_name_snapshot', s.package_name_snapshot,
          'package_description_snapshot', s.package_description_snapshot,
          'draft', s.draft
        )),
        'sprint_drafts', s.id, s.created_at, COALESCE(s.updated_at, s.created_at)
      FROM sprint_drafts s
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title, summary = EXCLUDED.summary, status = EXCLUDED.status,
        phase = EXCLUDED.phase, progress = EXCLUDED.progress, project_id = EXCLUDED.project_id,
        start_date = EXCLUDED.start_date, target_date = EXCLUDED.target_date,
        completed = EXCLUDED.completed, share_token = EXCLUDED.share_token,
        type_data = EXCLUDED.type_data, updated_at = EXCLUDED.updated_at;
    `,
  },
  {
    name: "hills <- refinement_cycles (refinement_cycle)",
    sql: `
      INSERT INTO hills (id, type, title, summary, status, phase, progress,
        project_id, span_granularity, target_date, completed, completed_at,
        created_by, type_data, legacy_source, legacy_id, created_at, updated_at)
      SELECT c.id, 'refinement_cycle', c.title, c.success_looks_like, c.status,
        CASE c.status
          WHEN 'submitted' THEN 'scope' WHEN 'accepted' THEN 'scope' WHEN 'awaiting_deposit' THEN 'scope'
          WHEN 'in_progress' THEN 'climb'
          ELSE 'descend' END,
        CASE WHEN c.status = 'delivered' THEN 100 ELSE 0 END,
        c.project_id, 'day', c.delivery_date::timestamptz,
        (c.status = 'delivered'), c.delivered_at, c.created_by,
        jsonb_strip_nulls(jsonb_build_object(
          'submitter_email', c.submitter_email, 'screen_recording_url', c.screen_recording_url,
          'whats_working', c.whats_working, 'whats_not_working', c.whats_not_working,
          'success_looks_like', c.success_looks_like, 'studio_review_note', c.studio_review_note,
          'total_price', c.total_price, 'deposit_amount', c.deposit_amount, 'final_amount', c.final_amount,
          'stripe_deposit_invoice_id', c.stripe_deposit_invoice_id,
          'stripe_deposit_invoice_url', c.stripe_deposit_invoice_url,
          'stripe_final_invoice_id', c.stripe_final_invoice_id,
          'stripe_final_invoice_url', c.stripe_final_invoice_url,
          'deposit_paid_at', c.deposit_paid_at, 'final_paid_at', c.final_paid_at,
          'cal_booking_url', c.cal_booking_url, 'checkin_scheduled_at', c.checkin_scheduled_at,
          'checkin_attended', c.checkin_attended, 'checkin_notes', c.checkin_notes,
          'figma_file_url', c.figma_file_url, 'loom_walkthrough_url', c.loom_walkthrough_url,
          'prototype_link', c.prototype_link, 'engineering_notes', c.engineering_notes
        )),
        'refinement_cycles', c.id, c.created_at, c.updated_at
      FROM refinement_cycles c
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title, summary = EXCLUDED.summary, status = EXCLUDED.status,
        phase = EXCLUDED.phase, progress = EXCLUDED.progress, project_id = EXCLUDED.project_id,
        target_date = EXCLUDED.target_date, completed = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at, type_data = EXCLUDED.type_data,
        updated_at = EXCLUDED.updated_at;
    `,
  },
  {
    name: "hill_ideas <- admin_ideas",
    sql: `
      INSERT INTO hill_ideas (id, hill_id, title, summary, status, project_id,
        sort_order, legacy_source, legacy_id, created_at, updated_at)
      SELECT i.id, i.milestone_id, i.title, i.summary, COALESCE(i.status, 'active'),
        i.project_id, COALESCE(i.sort_order, 0), 'admin_ideas', i.id, i.created_at, i.updated_at
      FROM admin_ideas i
      ON CONFLICT (id) DO UPDATE SET
        hill_id = EXCLUDED.hill_id, title = EXCLUDED.title, summary = EXCLUDED.summary,
        status = EXCLUDED.status, project_id = EXCLUDED.project_id,
        sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;
    `,
  },
  {
    name: "hill_deliverables <- sprint_deliverables",
    sql: `
      INSERT INTO hill_deliverables (id, hill_id, name, description, notes,
        catalog_deliverable_id, source, current_version, delivery_url, type_data,
        legacy_source, legacy_id)
      SELECT sd.id, sd.sprint_draft_id, sd.deliverable_name, sd.deliverable_description, sd.notes,
        (SELECT d.id FROM deliverables d WHERE d.id = sd.deliverable_id),
        'sprint', COALESCE(sd.current_version, '0'), sd.delivery_url,
        jsonb_strip_nulls(jsonb_build_object(
          'quantity', sd.quantity, 'base_points', sd.base_points,
          'custom_hours', sd.custom_hours, 'custom_estimate_points', sd.custom_estimate_points,
          'complexity_score', sd.complexity_score, 'custom_budget', sd.custom_budget,
          'deliverable_scope', sd.deliverable_scope, 'custom_scope', sd.custom_scope,
          'deliverable_category', sd.deliverable_category, 'deliverable_categories', sd.deliverable_categories,
          'content', sd.content, 'type_data', sd.type_data, 'source_package_id', sd.source_package_id
        )),
        'sprint_deliverables', sd.id
      FROM sprint_deliverables sd
      ON CONFLICT (id) DO UPDATE SET
        hill_id = EXCLUDED.hill_id, name = EXCLUDED.name, description = EXCLUDED.description,
        notes = EXCLUDED.notes, catalog_deliverable_id = EXCLUDED.catalog_deliverable_id,
        current_version = EXCLUDED.current_version, delivery_url = EXCLUDED.delivery_url,
        type_data = EXCLUDED.type_data, updated_at = now();
    `,
  },
  {
    name: "hill_deliverables <- refinement_cycle_screens",
    sql: `
      INSERT INTO hill_deliverables (id, hill_id, name, notes, source, added_by,
        type_data, sort_order, legacy_source, legacy_id)
      SELECT sc.id, sc.refinement_cycle_id, sc.name, sc.notes, 'refinement', sc.added_by,
        jsonb_strip_nulls(jsonb_build_object('admin_note', sc.admin_note)),
        COALESCE(sc.sort_order, 0), 'refinement_cycle_screens', sc.id
      FROM refinement_cycle_screens sc
      ON CONFLICT (id) DO UPDATE SET
        hill_id = EXCLUDED.hill_id, name = EXCLUDED.name, notes = EXCLUDED.notes,
        added_by = EXCLUDED.added_by, type_data = EXCLUDED.type_data,
        sort_order = EXCLUDED.sort_order, updated_at = now();
    `,
  },
  {
    // Pass 1: tasks with parent link deferred (avoids self-FK ordering issues).
    name: "hill_tasks <- admin_tasks (parents deferred)",
    sql: `
      INSERT INTO hill_tasks (id, hill_id, idea_id, deliverable_id, parent_task_id,
        name, note, completed, completed_at, focus, progress, sort_order,
        sub_sort_order, archived, archived_at, attachments,
        legacy_source, legacy_id, created_at, updated_at)
      SELECT t.id, COALESCE(t.milestone_id, i.milestone_id), t.idea_id, NULL, NULL,
        t.name, t.note, COALESCE(t.completed, false), t.completed_at, COALESCE(t.focus, ''),
        COALESCE(t.progress, 0), COALESCE(t.sort_order, 0), COALESCE(t.sub_sort_order, 0),
        COALESCE(t.archived, false), t.archived_at, COALESCE(t.attachments, '[]'::jsonb),
        'admin_tasks', t.id, t.created_at, t.updated_at
      FROM admin_tasks t
      LEFT JOIN admin_ideas i ON i.id = t.idea_id
      ON CONFLICT (id) DO UPDATE SET
        hill_id = EXCLUDED.hill_id, idea_id = EXCLUDED.idea_id, name = EXCLUDED.name,
        note = EXCLUDED.note, completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at,
        focus = EXCLUDED.focus, progress = EXCLUDED.progress, sort_order = EXCLUDED.sort_order,
        sub_sort_order = EXCLUDED.sub_sort_order, archived = EXCLUDED.archived,
        archived_at = EXCLUDED.archived_at, attachments = EXCLUDED.attachments,
        updated_at = EXCLUDED.updated_at;
    `,
  },
  {
    // Pass 2: now every row exists, wire up the subtask parent links.
    name: "hill_tasks parent links",
    sql: `
      UPDATE hill_tasks h
      SET parent_task_id = t.parent_task_id
      FROM admin_tasks t
      WHERE h.id = t.id AND t.parent_task_id IS NOT NULL;
    `,
  },
  {
    name: "hill_events <- admin_task_events",
    sql: `
      INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type,
        data, legacy_source, legacy_id, created_at)
      SELECT e.id, NULL, 'task', e.task_id, 'event', e.event_type, e.event_data,
        'admin_task_events', e.id, e.created_at
      FROM admin_task_events e
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: "hill_events <- sprint_draft_changelog",
    sql: `
      INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type,
        body, author_account_id, data, legacy_source, legacy_id, created_at)
      SELECT cl.id, cl.sprint_draft_id, 'hill', cl.sprint_draft_id, 'changelog', cl.action,
        cl.summary, cl.account_id, cl.details, 'sprint_draft_changelog', cl.id, cl.created_at
      FROM sprint_draft_changelog cl
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: "hill_events <- sprint_daily_updates",
    sql: `
      INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind,
        body, author_account_id, data, legacy_source, legacy_id, created_at)
      SELECT du.id, du.sprint_draft_id, 'hill', du.sprint_draft_id, 'update',
        du.body, du.account_id,
        jsonb_strip_nulls(jsonb_build_object(
          'sprint_day', du.sprint_day, 'total_days', du.total_days,
          'frame', du.frame, 'links', du.links
        )),
        'sprint_daily_updates', du.id, du.created_at
      FROM sprint_daily_updates du
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: "hill_events <- sprint_comments",
    sql: `
      INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind,
        body, author_account_id, legacy_source, legacy_id, created_at)
      SELECT co.id, co.sprint_draft_id, 'hill', co.sprint_draft_id, 'comment',
        co.body, co.account_id, 'sprint_comments', co.id, co.created_at
      FROM sprint_comments co
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: "hill_events <- refinement_cycle_notes",
    sql: `
      INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind,
        body, author_account_id, author_email, legacy_source, legacy_id, created_at)
      SELECT n.id, n.refinement_cycle_id, 'hill', n.refinement_cycle_id, 'note',
        n.body, n.author_account_id, n.author_email, 'refinement_cycle_notes', n.id, n.created_at
      FROM refinement_cycle_notes n
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: "hill_attachments <- sprint_links",
    sql: `
      INSERT INTO hill_attachments (id, subject_type, subject_id, name, filename,
        file_url, mimetype, size_bytes, link_type, url, uploaded_by,
        legacy_source, legacy_id, created_at)
      SELECT l.id, 'hill', l.sprint_id, l.name, l.file_name, l.file_url, l.mimetype,
        l.file_size_bytes, l.link_type, l.url, l.created_by, 'sprint_links', l.id, l.created_at
      FROM sprint_links l
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: "hill_attachments <- refinement_cycle_screen_attachments",
    sql: `
      INSERT INTO hill_attachments (id, subject_type, subject_id, filename, file_url,
        mimetype, link_type, url, sort_order, legacy_source, legacy_id, created_at)
      SELECT a.id, 'deliverable', a.screen_id, a.filename, a.file_url, a.mimetype,
        'file', a.file_url, COALESCE(a.sort_order, 0), 'refinement_cycle_screen_attachments', a.id, a.created_at
      FROM refinement_cycle_screen_attachments a
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    name: "hill_attachments <- refinement_cycle_deliverable_screenshots",
    sql: `
      INSERT INTO hill_attachments (id, subject_type, subject_id, file_url, caption,
        uploaded_by, legacy_source, legacy_id, created_at)
      SELECT s.id, 'hill', s.refinement_cycle_id, s.file_url, s.caption, s.uploaded_by,
        'refinement_cycle_deliverable_screenshots', s.id, s.created_at
      FROM refinement_cycle_deliverable_screenshots s
      ON CONFLICT (id) DO NOTHING;
    `,
  },
];

const COUNT_LEGACY = [
  "admin_milestones", "sprint_drafts", "refinement_cycles", "admin_ideas",
  "sprint_deliverables", "refinement_cycle_screens", "admin_tasks",
  "admin_task_events", "sprint_draft_changelog", "sprint_daily_updates",
  "sprint_comments", "refinement_cycle_notes", "sprint_links",
  "refinement_cycle_screen_attachments", "refinement_cycle_deliverable_screenshots",
];
const COUNT_HILL = [
  "hills", "hill_ideas", "hill_deliverables", "hill_tasks", "hill_events", "hill_attachments",
];

async function count(table) {
  try {
    const r = await pool.query(`SELECT count(*)::int AS c FROM ${table}`);
    return r.rows[0].c;
  } catch (e) {
    return `— (${e.message.split("\n")[0]})`;
  }
}

async function tablesExist() {
  const r = await pool.query(
    `SELECT count(*)::int AS c FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [COUNT_HILL]
  );
  return r.rows[0].c === COUNT_HILL.length;
}

(async () => {
  console.log(`\n=== Hill backfill · ${COMMIT ? "COMMIT" : "DRY RUN"} ===\n`);

  console.log("Legacy source counts:");
  for (const t of COUNT_LEGACY) console.log(`  ${t.padEnd(46)} ${await count(t)}`);

  const exist = await tablesExist();
  console.log(`\nhill_* tables present: ${exist ? "yes" : "NO"}`);
  if (!exist) {
    console.log(
      "\nThe hill_* tables do not exist yet. Boot the app once (ensureSchema)\n" +
      "or POST /api/admin/db/ensure to create them, then re-run this script.\n"
    );
    await pool.end();
    process.exit(exist ? 0 : 2);
  }

  if (!COMMIT) {
    console.log("\nCurrent hill_* counts (before):");
    for (const t of COUNT_HILL) console.log(`  ${t.padEnd(46)} ${await count(t)}`);
    console.log("\nDry run — no rows written. Re-run with --commit to backfill.\n");
    await pool.end();
    return;
  }

  console.log("\nRunning backfill steps:");
  for (const step of STEPS) {
    try {
      const r = await pool.query(step.sql);
      console.log(`  ✓ ${step.name.padEnd(52)} rows: ${r.rowCount ?? 0}`);
    } catch (e) {
      console.log(`  ✗ ${step.name.padEnd(52)} ${e.message.split("\n")[0]}`);
    }
  }

  console.log("\nHill counts (after):");
  for (const t of COUNT_HILL) console.log(`  ${t.padEnd(46)} ${await count(t)}`);
  console.log("\nDone.\n");
  await pool.end();
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
