import { getPool } from "@/lib/db";

/**
 * Renders a sprint or a whole project as a single self-contained Markdown
 * document — the full record, not a summary: plan, deliverables (with every
 * saved version), daily updates, links, invoices, agreement, changelog,
 * comments, and for projects the refinement cycles, documents, demos and
 * sandboxes too.
 */

type Row = Record<string, unknown>;

const s = (v: unknown): string | null => {
  if (v == null) return null;
  const str = String(v).trim();
  return str.length > 0 ? str : null;
};

function fmtDate(v: unknown): string {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function fmtDateTime(v: unknown): string {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}

function fmtMoney(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtBytes(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Push another document's headings down so they nest under ours. */
function demoteHeadings(md: string, by: number): string {
  if (by <= 0) return md;
  return md.replace(/^(#{1,6})(\s)/gm, (_m, hashes: string, space: string) =>
    `${"#".repeat(Math.min(6, hashes.length + by))}${space}`
  );
}

/** Quote a block so multi-line bodies stay inside a blockquote. */
function quote(text: string): string[] {
  return String(text).split("\n").map((line) => (line ? `> ${line}` : ">"));
}

function json(v: unknown, limit = 4000): string {
  let text: string;
  try {
    text = JSON.stringify(v, null, 2) ?? "";
  } catch {
    text = String(v);
  }
  if (text.length > limit) text = `${text.slice(0, limit)}\n… truncated (${text.length} chars total)`;
  return text;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "export";
}

type Attachment = { url?: string; fileName?: string; filename?: string; mimetype?: string; fileSizeBytes?: number };
type LinkItem = { url?: string; label?: string };

function renderAttachments(raw: unknown, out: string[], prefix = "") {
  const list = Array.isArray(raw) ? (raw as Attachment[]) : [];
  for (const a of list) {
    if (!a?.url) continue;
    const name = a.fileName || a.filename || "attachment";
    const size = fmtBytes(a.fileSizeBytes);
    const isImage = String(a.mimetype ?? "").startsWith("image/");
    out.push(
      `${prefix}${isImage ? "!" : ""}[${name}](${a.url})${size ? ` _(${size})_` : ""}`
    );
  }
}

function renderLinks(raw: unknown, out: string[], prefix = "") {
  const list = Array.isArray(raw) ? (raw as LinkItem[]) : [];
  for (const l of list) {
    if (!l?.url) continue;
    out.push(`${prefix}[${l.label || l.url}](${l.url})`);
  }
}

// ---------------------------------------------------------------------------
// Sprint section
// ---------------------------------------------------------------------------

/**
 * Renders one sprint. `level` is the heading depth of the sprint title itself
 * (1 for a standalone sprint export, 3 when nested inside a project export).
 */
async function renderSprint(sprint: Row, level: number): Promise<string[]> {
  const pool = getPool();
  const id = String(sprint.id);
  const out: string[] = [];
  const h = (depth: number, text: string) => out.push(`${"#".repeat(Math.min(6, depth))} ${text}`);
  const blank = () => out.push("");

  const [deliverables, versions, updates, links, invoices, comments, changelog, budget, parent] =
    await Promise.all([
      pool.query(
        `SELECT spd.id, spd.deliverable_id, spd.deliverable_name, spd.deliverable_description,
                spd.deliverable_category, spd.deliverable_categories, spd.deliverable_scope,
                spd.custom_scope, spd.notes, spd.content, spd.attachments, spd.type_data,
                spd.base_points, spd.custom_estimate_points, spd.custom_hours, spd.custom_budget,
                spd.complexity_score, spd.quantity, spd.delivery_url, spd.current_version,
                spd.created_at,
                d.name AS base_name, d.category AS base_category, d.scope AS base_scope,
                d.points AS base_catalog_points, d.fixed_hours, d.fixed_price
         FROM sprint_deliverables spd
         LEFT JOIN deliverables d ON d.id = spd.deliverable_id
         WHERE spd.sprint_draft_id = $1
         ORDER BY spd.created_at`,
        [id]
      ),
      pool.query(
        `SELECT v.sprint_deliverable_id, v.version_number, v.content, v.notes, v.type_data,
                v.saved_at, a.email AS saved_by_email
         FROM sprint_deliverable_versions v
         LEFT JOIN accounts a ON a.id = v.saved_by
         WHERE v.sprint_deliverable_id IN (SELECT id FROM sprint_deliverables WHERE sprint_draft_id = $1)
         ORDER BY v.saved_at`,
        [id]
      ).catch(() => ({ rows: [] as Row[] })),
      pool.query(
        `SELECT sdu.sprint_day, sdu.total_days, sdu.frame, sdu.body, sdu.links, sdu.attachments,
                sdu.created_at, sdu.updated_at,
                COALESCE(NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''), a.name, a.email) AS author
         FROM sprint_daily_updates sdu
         LEFT JOIN accounts a ON a.id = sdu.account_id
         WHERE sdu.sprint_draft_id = $1
         ORDER BY sdu.sprint_day, sdu.created_at`,
        [id]
      ).catch(() => ({ rows: [] as Row[] })),
      pool.query(
        `SELECT name, link_type, url, file_url, file_name, file_size_bytes, mimetype, description, created_at
         FROM sprint_links WHERE sprint_id = $1 ORDER BY sort_order, created_at`,
        [id]
      ).catch(() => ({ rows: [] as Row[] })),
      pool.query(
        `SELECT label, amount, invoice_status, invoice_url, invoice_pdf_url,
                stripe_invoice_id, stripe_recipient_email, created_at, updated_at
         FROM sprint_invoices WHERE sprint_id = $1 ORDER BY sort_order, created_at`,
        [id]
      ).catch(() => ({ rows: [] as Row[] })),
      pool.query(
        `SELECT c.body, c.created_at,
                COALESCE(NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''), a.name, a.email) AS author
         FROM sprint_comments c
         LEFT JOIN accounts a ON a.id = c.account_id
         WHERE c.sprint_draft_id = $1 ORDER BY c.created_at`,
        [id]
      ).catch(() => ({ rows: [] as Row[] })),
      pool.query(
        `SELECT cl.action, cl.summary, cl.details, cl.created_at, a.email AS author
         FROM sprint_draft_changelog cl
         LEFT JOIN accounts a ON a.id = cl.account_id
         WHERE cl.sprint_draft_id = $1 ORDER BY cl.created_at`,
        [id]
      ).catch(() => ({ rows: [] as Row[] })),
      pool.query(
        `SELECT label, inputs, outputs, created_at FROM deferred_comp_plans
         WHERE sprint_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [id]
      ).catch(() => ({ rows: [] as Row[] })),
      sprint.parent_sprint_id
        ? pool.query(`SELECT id, title FROM sprint_drafts WHERE id = $1`, [sprint.parent_sprint_id])
        : Promise.resolve({ rows: [] as Row[] }),
    ]);

  const title = s(sprint.title) ?? "Untitled sprint";
  h(level, title);
  blank();

  // --- Facts table --------------------------------------------------------
  const facts: Array<[string, string]> = [
    ["Type", s(sprint.type) ?? "sprint"],
    ["Status", s(sprint.status) ?? "draft"],
    ["Dates", `${fmtDate(sprint.start_date)} → ${fmtDate(sprint.due_date)}`],
    ["Weeks", s(sprint.weeks) ?? "—"],
    ["Price", fmtMoney(sprint.total_fixed_price)],
    ["Estimate", `${s(sprint.total_estimate_points) ?? "—"} pts · ${s(sprint.total_fixed_hours) ?? "—"} hrs`],
    ["Base rate", fmtMoney(sprint.base_rate)],
    ["Budget status", s(sprint.budget_status) ?? "—"],
    ["Contract", `${s(sprint.contract_status) ?? "—"} · studio ${sprint.signed_by_studio ? "signed" : "unsigned"} · client ${sprint.signed_by_client ? "signed" : "unsigned"}`],
    ["Created", fmtDateTime(sprint.created_at)],
    ["Last updated", fmtDateTime(sprint.updated_at)],
    ["ID", `\`${id}\``],
  ];
  const parentRow = parent.rows[0] as Row | undefined;
  if (parentRow) facts.push(["Parent sprint", `${s(parentRow.title) ?? "Untitled"} (\`${String(parentRow.id)}\`)`]);
  if (s(sprint.contract_url)) facts.push(["Contract link", String(sprint.contract_url)]);
  if (s(sprint.contract_pdf_url)) facts.push(["Contract PDF", String(sprint.contract_pdf_url)]);

  out.push("| | |", "|---|---|");
  for (const [k, v] of facts) out.push(`| ${k} | ${v} |`);
  blank();

  // --- Plan (draft jsonb) -------------------------------------------------
  const draft = (sprint.draft ?? {}) as Row;
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);

  if (s(draft.overview)) {
    h(level + 1, "Overview");
    blank();
    out.push(String(draft.overview));
    blank();
  }
  if (arr(draft.goals).length) {
    h(level + 1, "Goals");
    blank();
    for (const g of arr(draft.goals)) out.push(`- ${g}`);
    blank();
  }
  if (s(draft.approach)) {
    h(level + 1, "Approach");
    blank();
    out.push(String(draft.approach));
    blank();
  }

  const weekCount = Number(sprint.weeks ?? 0) || 0;
  const weekBlocks: string[] = [];
  for (let i = 1; i <= Math.max(weekCount, 2); i++) {
    const wk = draft[`week${i}`] as Row | undefined;
    if (!wk || typeof wk !== "object") continue;
    const lines: string[] = [];
    for (const [label, key] of [["Kickoff", "kickoff"], ["Midweek", "midweek"], ["End of week", "endOfWeek"], ["Overview", "overview"]] as const) {
      if (s(wk[key])) lines.push(`- **${label}:** ${String(wk[key]).replace(/\n/g, "\n  ")}`);
    }
    for (const [label, key] of [["Goals", "goals"], ["Deliverables", "deliverables"], ["Milestones", "milestones"]] as const) {
      const items = arr(wk[key]);
      if (items.length) lines.push(`- **${label}:**`, ...items.map((x) => `  - ${x}`));
    }
    if (lines.length) weekBlocks.push(`**Week ${i}**`, "", ...lines, "");
  }
  if (weekBlocks.length) {
    h(level + 1, "Week notes");
    blank();
    out.push(...weekBlocks);
  }

  const timeline = Array.isArray(draft.timeline) ? (draft.timeline as Row[]) : [];
  if (timeline.length) {
    h(level + 1, "Planned timeline");
    blank();
    for (const t of timeline) {
      const day = s(t.day) ?? "";
      const dow = s(t.dayOfWeek) ?? "";
      const focus = s(t.focus) ?? "";
      out.push(`- **Day ${day}${dow ? ` (${dow})` : ""}${focus ? ` — ${focus}` : ""}**`);
      for (const item of [...arr(t.items), ...arr(t.tasks)]) out.push(`  - ${item}`);
    }
    blank();
  }

  for (const [label, key] of [["Assumptions", "assumptions"], ["Risks", "risks"], ["Notes", "notes"]] as const) {
    const items = arr(draft[key]);
    if (!items.length) continue;
    h(level + 1, label);
    blank();
    for (const x of items) out.push(`- ${x}`);
    blank();
  }

  // --- Deliverables -------------------------------------------------------
  const versionsBy = (versions.rows as Row[]).reduce<Record<string, Row[]>>((m, v) => {
    const k = String(v.sprint_deliverable_id);
    (m[k] ||= []).push(v);
    return m;
  }, {});

  if (deliverables.rowCount) {
    h(level + 1, `Deliverables (${deliverables.rowCount})`);
    blank();
    for (const d of deliverables.rows as Row[]) {
      const name = s(d.deliverable_name) ?? s(d.base_name) ?? "Untitled deliverable";
      const cats = Array.isArray(d.deliverable_categories) && (d.deliverable_categories as string[]).length
        ? (d.deliverable_categories as string[]).join(", ")
        : s(d.deliverable_category) ?? s(d.base_category);
      h(level + 2, name);
      blank();
      if (cats) out.push(`_${cats}_`, "");

      const points = s(d.custom_estimate_points) ?? s(d.base_points) ?? s(d.base_catalog_points);
      const meta = [
        points ? `${points} pts` : null,
        s(d.custom_hours) ? `${String(d.custom_hours)} hrs` : s(d.fixed_hours) ? `${String(d.fixed_hours)} hrs` : null,
        d.custom_budget != null ? fmtMoney(d.custom_budget) : d.fixed_price != null ? fmtMoney(d.fixed_price) : null,
        d.complexity_score != null ? `complexity ×${String(d.complexity_score)}` : null,
        Number(d.quantity ?? 1) > 1 ? `qty ${String(d.quantity)}` : null,
      ].filter(Boolean);
      if (meta.length) out.push(meta.join(" · "), "");

      const scope = s(d.custom_scope) ?? s(d.deliverable_scope) ?? s(d.base_scope);
      if (scope) out.push("**Scope**", "", scope, "");
      if (s(d.deliverable_description)) out.push("**Description**", "", String(d.deliverable_description), "");
      if (s(d.notes)) out.push("**Notes**", "", String(d.notes), "");
      if (s(d.delivery_url)) out.push(`**Delivered work:** ${String(d.delivery_url)}`, "");
      if (s(d.content)) out.push("**Content**", "", String(d.content), "");

      const atts: string[] = [];
      renderAttachments(d.attachments, atts, "- ");
      if (atts.length) out.push("**Attachments**", "", ...atts, "");

      if (d.type_data && Object.keys(d.type_data as Row).length) {
        out.push("<details><summary>Structured data</summary>", "", "```json", json(d.type_data), "```", "", "</details>", "");
      }

      const vs = versionsBy[String(d.id)] ?? [];
      if (vs.length) {
        out.push(`<details><summary>Version history (${vs.length}, current v${s(d.current_version) ?? "0"})</summary>`, "");
        for (const v of vs) {
          out.push(`**v${s(v.version_number) ?? "?"}** — ${fmtDateTime(v.saved_at)}${s(v.saved_by_email) ? ` by ${String(v.saved_by_email)}` : ""}`, "");
          if (s(v.notes)) out.push(`${String(v.notes)}`, "");
          if (s(v.content)) out.push(String(v.content), "");
        }
        out.push("</details>", "");
      }
    }
  }

  // --- Daily updates ------------------------------------------------------
  if (updates.rows.length) {
    h(level + 1, `Daily updates (${updates.rows.length})`);
    blank();
    for (const u of updates.rows as Row[]) {
      const head = `**Day ${s(u.sprint_day) ?? "?"}/${s(u.total_days) ?? "?"}${s(u.frame) ? ` · ${String(u.frame)}` : ""}** — ${fmtDate(u.created_at)}${s(u.author) ? ` · ${String(u.author)}` : ""}`;
      out.push(`> ${head}`, ">");
      out.push(...quote(String(u.body ?? "")));
      const extras: string[] = [];
      renderLinks(u.links, extras);
      renderAttachments(u.attachments, extras);
      if (extras.length) {
        out.push(">");
        out.push(...extras.map((e) => `> ${e}`));
      }
      blank();
    }
  }

  // --- Links & files ------------------------------------------------------
  if (links.rows.length) {
    h(level + 1, `Links & files (${links.rows.length})`);
    blank();
    for (const l of links.rows as Row[]) {
      const href = s(l.url) ?? s(l.file_url);
      const size = fmtBytes(l.file_size_bytes);
      out.push(
        `- ${href ? `[${s(l.name) ?? href}](${href})` : (s(l.name) ?? "Untitled")}` +
          `${s(l.link_type) ? ` — _${String(l.link_type)}_` : ""}${size ? ` _(${size})_` : ""}` +
          `${s(l.description) ? ` — ${String(l.description)}` : ""}`
      );
    }
    blank();
  }

  // --- Money --------------------------------------------------------------
  if (invoices.rows.length) {
    h(level + 1, "Invoices");
    blank();
    out.push("| Label | Amount | Status | Sent to | Created |", "|---|---|---|---|---|");
    for (const i of invoices.rows as Row[]) {
      out.push(
        `| ${s(i.label) ?? "—"} | ${fmtMoney(i.amount)} | ${s(i.invoice_status) ?? "—"} | ${s(i.stripe_recipient_email) ?? "—"} | ${fmtDate(i.created_at)} |`
      );
    }
    blank();
    for (const i of invoices.rows as Row[]) {
      const urls = [s(i.invoice_url), s(i.invoice_pdf_url)].filter(Boolean);
      if (urls.length) out.push(`- ${s(i.label) ?? "Invoice"}: ${urls.join(" · ")}`);
    }
    if (invoices.rows.some((i) => s((i as Row).invoice_url) || s((i as Row).invoice_pdf_url))) blank();
  }

  const budgetRow = budget.rows[0] as Row | undefined;
  if (budgetRow) {
    h(level + 1, `Compensation plan${s(budgetRow.label) ? ` — ${String(budgetRow.label)}` : ""}`);
    blank();
    const inputs = (budgetRow.inputs ?? {}) as Row;
    const outputs = (budgetRow.outputs ?? {}) as Row;
    out.push("| Field | Value |", "|---|---|");
    for (const [k, v] of Object.entries({ ...inputs, ...outputs })) {
      if (v == null || (Array.isArray(v) && v.length === 0)) continue;
      const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
      const value = typeof v === "object" ? `\`${json(v, 300).replace(/\n\s*/g, " ")}\`` : String(v);
      out.push(`| ${label} | ${value} |`);
    }
    blank();
  }

  // --- Agreement ----------------------------------------------------------
  if (s(sprint.agreement_markdown)) {
    h(level + 1, `Agreement (generated ${fmtDate(sprint.agreement_generated_at)})`);
    blank();
    out.push(demoteHeadings(String(sprint.agreement_markdown), level + 1));
    blank();
  }

  // --- Discussion & history ----------------------------------------------
  if (comments.rows.length) {
    h(level + 1, `Comments (${comments.rows.length})`);
    blank();
    for (const c of comments.rows as Row[]) {
      out.push(`> **${s(c.author) ?? "Unknown"}** — ${fmtDateTime(c.created_at)}`, ">");
      out.push(...quote(String(c.body ?? "")));
      blank();
    }
  }

  if (changelog.rows.length) {
    h(level + 1, `Changelog (${changelog.rows.length})`);
    blank();
    for (const c of changelog.rows as Row[]) {
      out.push(
        `- \`${fmtDate(c.created_at)}\` **${s(c.action) ?? "change"}** — ${s(c.summary) ?? ""}${s(c.author) ? ` _(${String(c.author)})_` : ""}`
      );
      if (c.details && Object.keys(c.details as Row).length) {
        out.push("", "  <details><summary>details</summary>", "", "  ```json", ...json(c.details, 2000).split("\n").map((l) => `  ${l}`), "  ```", "", "  </details>", "");
      }
    }
    blank();
  }

  return out;
}

// ---------------------------------------------------------------------------
// Refinement cycle section
// ---------------------------------------------------------------------------

/**
 * Renders one refinement cycle. `level` is the heading depth of the cycle
 * title (1 standalone, 3 when nested under a project's "Refinement cycles").
 */
async function renderCycle(cycle: Row, level: number): Promise<string[]> {
  const pool = getPool();
  const cycleId = String(cycle.id);
  const out: string[] = [];
  const h = (depth: number, text: string) => out.push(`${"#".repeat(Math.min(6, depth))} ${text}`);
  const blank = () => out.push("");

  const [notes, screens, shots] = await Promise.all([
    pool.query(
      `SELECT n.body, n.author_email, n.created_at,
              COALESCE(json_agg(json_build_object('url', at.file_url, 'fileName', at.filename, 'mimetype', at.mimetype))
                       FILTER (WHERE at.id IS NOT NULL), '[]') AS attachments
       FROM refinement_cycle_notes n
       LEFT JOIN refinement_cycle_note_attachments at ON at.note_id = n.id
       WHERE n.refinement_cycle_id = $1
       GROUP BY n.id, n.body, n.author_email, n.created_at
       ORDER BY n.created_at`,
      [cycleId]
    ).catch(() => ({ rows: [] as Row[] })),
    pool.query(
      `SELECT name, notes, admin_note, added_by, created_at FROM refinement_cycle_screens
       WHERE refinement_cycle_id = $1 ORDER BY sort_order, created_at`,
      [cycleId]
    ).catch(() => ({ rows: [] as Row[] })),
    pool.query(
      `SELECT file_url, filename, caption, mimetype FROM refinement_cycle_deliverable_screenshots
       WHERE refinement_cycle_id = $1 ORDER BY sort_order, created_at`,
      [cycleId]
    ).catch(() => ({ rows: [] as Row[] })),
  ]);

  h(level, s(cycle.title) ?? "Untitled cycle");
  blank();
  out.push("| | |", "|---|---|");
  out.push(`| Status | ${s(cycle.status) ?? "—"} |`);
  out.push(`| Submitted | ${fmtDateTime(cycle.submitted_at)} by ${s(cycle.submitter_email) ?? "—"} |`);
  out.push(`| Accepted | ${fmtDateTime(cycle.accepted_at)} |`);
  if (s(cycle.declined_at)) out.push(`| Declined | ${fmtDateTime(cycle.declined_at)} |`);
  out.push(`| Delivered | ${fmtDateTime(cycle.delivered_at)} |`);
  if (s(cycle.preferred_delivery_date)) out.push(`| Preferred delivery | ${fmtDate(cycle.preferred_delivery_date)} |`);
  if (s(cycle.delivery_date)) out.push(`| Delivery date | ${fmtDate(cycle.delivery_date)} |`);
  out.push(`| Price | ${fmtMoney(cycle.total_price)} (deposit ${fmtMoney(cycle.deposit_amount)}, final ${fmtMoney(cycle.final_amount)}) |`);
  out.push(`| Deposit required | ${cycle.requires_deposit ? "yes" : "no"} |`);
  out.push(`| Deposit paid | ${fmtDateTime(cycle.deposit_paid_at)} |`);
  out.push(`| Final paid | ${fmtDateTime(cycle.final_paid_at)} |`);
  out.push(`| Rate | ${s(cycle.rate) ?? "—"} |`);
  if (s(cycle.checkin_scheduled_at)) {
    out.push(`| Check-in | ${fmtDateTime(cycle.checkin_scheduled_at)}${cycle.checkin_attended ? " (attended)" : ""} |`);
  }
  if (s(cycle.cc_emails)) out.push(`| CC | ${Array.isArray(cycle.cc_emails) ? (cycle.cc_emails as string[]).join(", ") : String(cycle.cc_emails)} |`);
  if (s(cycle.last_edited_at)) {
    out.push(`| Last edited | ${fmtDateTime(cycle.last_edited_at)}${s(cycle.last_edited_by_email) ? ` by ${String(cycle.last_edited_by_email)}` : ""} |`);
  }
  out.push(`| ID | \`${cycleId}\` |`);
  blank();

  for (const [label, key] of [
    ["What's not working", "whats_not_working"],
    ["What's working", "whats_working"],
    ["Success looks like", "success_looks_like"],
    ["Studio review note", "studio_review_note"],
    ["Engineering notes", "engineering_notes"],
    ["Check-in notes", "checkin_notes"],
  ] as const) {
    if (!s(cycle[key])) continue;
    h(level + 1, label);
    blank();
    out.push(String(cycle[key]), "");
  }

  const urls = [
    ["Screen recording", cycle.screen_recording_url],
    ["Loom walkthrough", cycle.loom_walkthrough_url],
    ["Figma", cycle.figma_file_url],
    ["Prototype", cycle.prototype_link],
    ["Studio review attachment", cycle.studio_review_attachment_url],
    ["Booking", cycle.cal_booking_url],
    ["Deposit invoice", cycle.stripe_deposit_invoice_url],
    ["Final invoice", cycle.stripe_final_invoice_url],
  ].filter(([, v]) => s(v)) as Array<[string, string]>;
  if (urls.length) {
    h(level + 1, "Links");
    blank();
    for (const [label, url] of urls) out.push(`- ${label}: ${url}`);
    blank();
  }

  if (screens.rows.length) {
    h(level + 1, `Screens (${screens.rows.length})`);
    blank();
    for (const sc of screens.rows as Row[]) {
      out.push(`- **${s(sc.name) ?? "Untitled"}**${s(sc.added_by) ? ` _(added by ${String(sc.added_by)})_` : ""}`);
      if (s(sc.notes)) out.push(`  ${String(sc.notes).replace(/\n/g, "\n  ")}`);
      if (s(sc.admin_note)) out.push(`  _Studio note:_ ${String(sc.admin_note).replace(/\n/g, "\n  ")}`);
    }
    blank();
  }

  if (shots.rows.length) {
    h(level + 1, `Delivered screenshots (${shots.rows.length})`);
    blank();
    for (const sh of shots.rows as Row[]) {
      out.push(`- ![${s(sh.caption) ?? s(sh.filename) ?? "screenshot"}](${String(sh.file_url)})`);
    }
    blank();
  }

  if (notes.rows.length) {
    h(level + 1, `Notes (${notes.rows.length})`);
    blank();
    for (const n of notes.rows as Row[]) {
      out.push(`> **${s(n.author_email) ?? "Unknown"}** — ${fmtDateTime(n.created_at)}`, ">");
      out.push(...quote(String(n.body ?? "")));
      const atts: string[] = [];
      renderAttachments(n.attachments, atts);
      if (atts.length) {
        out.push(">");
        out.push(...atts.map((a) => `> ${a}`));
      }
      blank();
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

export type ExportResult = { filename: string; markdown: string };

export async function renderSprintMarkdown(sprintId: string): Promise<ExportResult | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT sd.*, p.name AS project_name FROM sprint_drafts sd
     LEFT JOIN projects p ON p.id = sd.project_id
     WHERE sd.id = $1`,
    [sprintId]
  );
  if (res.rowCount === 0) return null;
  const sprint = res.rows[0] as Row;

  const title = s(sprint.title) ?? "Untitled sprint";
  const lines: string[] = [];
  lines.push(`# ${title}`, "");
  if (s(sprint.project_name)) lines.push(`**Project:** ${String(sprint.project_name)}`, "");
  lines.push(`*Exported ${fmtDate(new Date())} from Chris Meisner Studio*`, "");
  // Level 1: the sprint title is already the document title above, so drop the
  // heading renderSprint emits and let its sections sit at "##".
  lines.push(...(await renderSprint(sprint, 1)).slice(2));

  return {
    filename: `${slugify(title)}-${fmtDate(new Date())}.md`,
    markdown: lines.join("\n").replace(/\n{4,}/g, "\n\n\n"),
  };
}

export async function renderRefinementCycleMarkdown(cycleId: string): Promise<ExportResult | null> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT rc.*, p.name AS project_name, p.emoji AS project_emoji,
            last_editor.email AS last_edited_by_email
     FROM refinement_cycles rc
     LEFT JOIN projects p ON p.id = rc.project_id
     LEFT JOIN accounts last_editor ON last_editor.id = rc.last_edited_by
     WHERE rc.id = $1`,
    [cycleId]
  );
  if (res.rowCount === 0) return null;
  const cycle = res.rows[0] as Row;

  const title = s(cycle.title) ?? "Refinement cycle";
  const lines: string[] = [];
  lines.push(`# ${title}`, "");
  if (s(cycle.project_name)) {
    lines.push(`**Project:** ${s(cycle.project_emoji) ? `${String(cycle.project_emoji)} ` : ""}${String(cycle.project_name)}`, "");
  }
  lines.push(`*Exported ${fmtDate(new Date())} from Chris Meisner Studio*`, "");
  // Level 1: the title is already the document title, so drop the heading
  // renderCycle emits and let its sections sit at "##".
  lines.push(...(await renderCycle(cycle, 1)).slice(2));

  return {
    filename: `${slugify(title)}-refinement-cycle-${fmtDate(new Date())}.md`,
    markdown: lines.join("\n").replace(/\n{4,}/g, "\n\n\n"),
  };
}

export async function renderProjectMarkdown(projectId: string): Promise<ExportResult | null> {
  const pool = getPool();
  const projectRes = await pool.query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
  if (projectRes.rowCount === 0) return null;
  const project = projectRes.rows[0] as Row;

  const [members, sprints, cycles, documents, demos, sandboxes] = await Promise.all([
    pool.query(
      `SELECT pm.email, pm.role, pm.created_at,
              COALESCE(NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''), a.name) AS name,
              COALESCE(a.is_admin, false) AS is_admin
       FROM project_members pm LEFT JOIN accounts a ON lower(a.email) = lower(pm.email)
       WHERE pm.project_id = $1 ORDER BY pm.created_at`,
      [projectId]
    ).catch(() => ({ rows: [] as Row[] })),
    pool.query(
      `SELECT * FROM sprint_drafts WHERE project_id = $1
       ORDER BY COALESCE(start_date, created_at::date), created_at`,
      [projectId]
    ),
    pool.query(
      `SELECT * FROM refinement_cycles WHERE project_id = $1 ORDER BY created_at`,
      [projectId]
    ).catch(() => ({ rows: [] as Row[] })),
    pool.query(
      `SELECT filename, content, created_at FROM documents WHERE project_id = $1 ORDER BY created_at`,
      [projectId]
    ).catch(() => ({ rows: [] as Row[] })),
    pool.query(
      `SELECT title, description, demo_type, video_url, duration_seconds, created_at
       FROM project_demos WHERE project_id = $1 ORDER BY created_at`,
      [projectId]
    ).catch(() => ({ rows: [] as Row[] })),
    pool.query(
      `SELECT name, description, folder_name, url, link_type, is_public, created_at
       FROM sandboxes WHERE project_id = $1 ORDER BY created_at`,
      [projectId]
    ).catch(() => ({ rows: [] as Row[] })),
  ]);

  const out: string[] = [];
  const h = (depth: number, text: string) => out.push(`${"#".repeat(depth)} ${text}`);
  const blank = () => out.push("");

  const name = s(project.name) ?? "Untitled project";
  h(1, `${s(project.emoji) ? `${String(project.emoji)} ` : ""}${name} — Project Record`);
  blank();
  out.push(`*Exported ${fmtDate(new Date())} from Chris Meisner Studio*`, "");
  if (s(project.description)) out.push(String(project.description), "");

  const contracted = (sprints.rows as Row[]).reduce((a, r) => a + Number(r.total_fixed_price ?? 0), 0);
  const cycleValue = (cycles.rows as Row[]).reduce((a, r) => a + Number(r.total_price ?? 0), 0);
  out.push("| | |", "|---|---|");
  out.push(`| Status | ${s(project.status) ?? "—"} |`);
  out.push(`| Type | ${s(project.project_type) ?? "—"} |`);
  out.push(`| Started | ${fmtDate(project.created_at)} |`);
  out.push(`| Sprints | ${sprints.rowCount} |`);
  out.push(`| Refinement cycles | ${cycles.rows.length} |`);
  out.push(`| Contracted value | ${fmtMoney(contracted + cycleValue)} |`);
  if (s(project.figma_file_url)) out.push(`| Figma | ${String(project.figma_file_url)} |`);
  out.push(`| ID | \`${String(project.id)}\` |`);
  blank();

  if (members.rows.length) {
    h(2, "Team");
    blank();
    out.push("| Email | Name | Role | Since |", "|---|---|---|---|");
    for (const m of members.rows as Row[]) {
      out.push(
        `| ${s(m.email) ?? "—"} | ${s(m.name) ?? "—"} | ${m.is_admin ? "studio" : (s(m.role) ?? "client")} | ${fmtDate(m.created_at)} |`
      );
    }
    blank();
  }

  // --- Timeline -----------------------------------------------------------
  type TimelineEntry = { date: unknown; title: string; kind: string; status: string; value: unknown };
  const timeline: TimelineEntry[] = [
    ...(sprints.rows as Row[]).map((r) => ({
      date: r.start_date ?? r.created_at,
      title: s(r.title) ?? "Untitled sprint",
      kind: s(r.type) ?? "sprint",
      status: s(r.status) ?? "—",
      value: r.total_fixed_price,
    })),
    ...(cycles.rows as Row[]).map((r) => ({
      date: r.submitted_at ?? r.created_at,
      title: s(r.title) ?? "Untitled cycle",
      kind: "refinement",
      status: s(r.status) ?? "—",
      value: r.total_price,
    })),
  ].sort((a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime());

  if (timeline.length) {
    h(2, "Timeline");
    blank();
    out.push("| Date | Phase | Type | Status | Value |", "|---|---|---|---|---|");
    for (const t of timeline) {
      out.push(`| ${fmtDate(t.date)} | ${t.title} | ${t.kind} | ${t.status} | ${fmtMoney(t.value)} |`);
    }
    blank();
  }

  // --- Sprints ------------------------------------------------------------
  if (sprints.rowCount) {
    out.push("---", "");
    h(2, "Sprints");
    blank();
    for (const sprint of sprints.rows as Row[]) {
      out.push(...(await renderSprint(sprint, 3)));
    }
  }

  // --- Refinement cycles --------------------------------------------------
  if (cycles.rows.length) {
    out.push("---", "");
    h(2, "Refinement cycles");
    blank();
    for (const c of cycles.rows as Row[]) {
      out.push(...(await renderCycle(c, 3)));
    }
  }

  // --- Project assets -----------------------------------------------------
  const assetSections: Array<[string, string[]]> = [];

  if (documents.rows.length) {
    const lines: string[] = [];
    for (const doc of documents.rows as Row[]) {
      const content = (doc.content ?? {}) as Row;
      const url = s(content.url);
      const label = s(content.title) ?? s(doc.filename) ?? "Untitled";
      lines.push(`- ${url ? `[${label}](${url})` : label} — ${s(content.type) ?? "upload"} · ${fmtDate(doc.created_at)}`);
    }
    assetSections.push([`Documents (${documents.rows.length})`, lines]);
  }
  if (demos.rows.length) {
    const lines: string[] = [];
    for (const d of demos.rows as Row[]) {
      lines.push(`- [${s(d.title) ?? "Demo"}](${String(d.video_url)}) — ${s(d.demo_type) ?? "file"} · ${fmtDate(d.created_at)}`);
      if (s(d.description)) lines.push(`  ${String(d.description)}`);
    }
    assetSections.push([`Demos (${demos.rows.length})`, lines]);
  }
  if (sandboxes.rows.length) {
    const lines: string[] = [];
    for (const sb of sandboxes.rows as Row[]) {
      // The doc leaves the app, so site-relative sandbox paths need an origin.
      const origin = (process.env.BASE_URL ?? "https://meisner.design").replace(/\/$/, "");
      const href = s(sb.url) ?? (s(sb.folder_name) ? `${origin}/sandboxes/${String(sb.folder_name)}` : null);
      lines.push(`- ${href ? `[${s(sb.name) ?? href}](${href})` : (s(sb.name) ?? "Untitled")}${s(sb.description) ? ` — ${String(sb.description)}` : ""}`);
    }
    assetSections.push([`Sandboxes (${sandboxes.rows.length})`, lines]);
  }

  if (assetSections.length) {
    out.push("---", "");
    h(2, "Project assets");
    blank();
    for (const [heading, lines] of assetSections) {
      h(3, heading);
      blank();
      out.push(...lines, "");
    }
  }

  return {
    filename: `${slugify(name)}-project-record-${fmtDate(new Date())}.md`,
    markdown: out.join("\n").replace(/\n{4,}/g, "\n\n\n"),
  };
}
