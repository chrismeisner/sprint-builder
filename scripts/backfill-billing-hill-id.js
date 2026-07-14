#!/usr/bin/env node

/**
 * Backfill hill_id onto the billing satellite (Phase 0 of the billing → Hills
 * re-key). Purely additive: legacy tables are otherwise untouched, and nothing
 * reads hill_id yet, so this is safe and reversible.
 *
 *   node scripts/backfill-billing-hill-id.js            # dry run — reports counts, writes nothing
 *   node scripts/backfill-billing-hill-id.js --commit   # actually populate hill_id
 *
 * Resolution: a billing row's legacy anchor (sprint_invoices/deferred_comp_plans
 * key on sprint_id; a refinement_cycle keys on its own id) maps to the hill that
 * either reuses that legacy PK (backfilled hills) or points at it via
 * type_data.linked_id (bridged/converted hills). See app/api/admin/hills/[id]/
 * convert/route.ts and app/api/admin/hills/[id]/route.ts for the linkage.
 *
 * Prereq: the hill_id columns must exist (added by ensureSchema; see lib/db.ts).
 * Safe to re-run: only rows whose hill_id would change are touched.
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

// Each entry: the table, the legacy anchor column that maps to a hill, and the
// hill type it must match. `self` means the row's own id is the anchor.
const TARGETS = [
  { table: "sprint_invoices", anchor: "sprint_id", hillType: "sprint" },
  { table: "deferred_comp_plans", anchor: "sprint_id", hillType: "sprint" },
  { table: "refinement_cycles", anchor: "id", hillType: "refinement_cycle" },
];

// A legacy anchor that resolves to more than one hill would make the set-based
// UPDATE ambiguous. Vanishingly unlikely (linked_id is unique per conversion,
// backfilled hills reuse the PK 1:1), but we check and refuse rather than guess.
async function findAmbiguous(t) {
  // Count DISTINCT hills per anchor — an anchor that maps to >1 hill is the only
  // real ambiguity. (Counting joined rows would false-positive on the normal
  // case of many billing rows sharing one anchor, e.g. a sprint's deposit +
  // final invoices, or several comp plans.)
  const { rows } = await pool.query(
    `SELECT b.${t.anchor} AS anchor, count(DISTINCT h.id) AS n
       FROM ${t.table} b
       JOIN hills h
         ON h.type = $1
        AND (h.id = b.${t.anchor} OR h.type_data->>'linked_id' = b.${t.anchor})
      GROUP BY b.${t.anchor}
     HAVING count(DISTINCT h.id) > 1`,
    [t.hillType]
  );
  return rows;
}

async function countMatched(t) {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n
       FROM ${t.table} b
       JOIN hills h
         ON h.type = $1
        AND (h.id = b.${t.anchor} OR h.type_data->>'linked_id' = b.${t.anchor})
      WHERE b.hill_id IS DISTINCT FROM h.id`,
    [t.hillType]
  );
  return rows[0].n;
}

async function totalRows(t) {
  const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${t.table}`);
  return rows[0].n;
}

async function apply(t) {
  const { rowCount } = await pool.query(
    `UPDATE ${t.table} b
        SET hill_id = h.id
       FROM hills h
      WHERE h.type = $1
        AND (h.id = b.${t.anchor} OR h.type_data->>'linked_id' = b.${t.anchor})
        AND b.hill_id IS DISTINCT FROM h.id`,
    [t.hillType]
  );
  return rowCount;
}

(async () => {
  console.log(
    COMMIT ? "▶ Committing billing hill_id backfill…\n" : "▶ Dry run (no writes). Pass --commit to apply.\n"
  );

  let hadAmbiguity = false;
  for (const t of TARGETS) {
    const ambiguous = await findAmbiguous(t);
    if (ambiguous.length) {
      hadAmbiguity = true;
      console.error(`✖ ${t.table}: ${ambiguous.length} anchor(s) resolve to >1 hill — refusing to guess:`);
      for (const a of ambiguous) console.error(`    ${a.anchor} → ${a.n} hills`);
    }
  }
  if (hadAmbiguity) {
    console.error("\nResolve the ambiguous links above, then re-run. Nothing was written.");
    await pool.end();
    process.exit(1);
  }

  for (const t of TARGETS) {
    const total = await totalRows(t);
    if (COMMIT) {
      const n = await apply(t);
      console.log(`  ${t.table}: set hill_id on ${n} row(s)  (of ${total} total)`);
    } else {
      const n = await countMatched(t);
      console.log(`  ${t.table}: ${n} row(s) would be set  (of ${total} total)`);
    }
  }

  console.log(COMMIT ? "\n✅ Done." : "\nDry run complete — re-run with --commit to write.");
  await pool.end();
})().catch((err) => {
  console.error("❌ Backfill failed:", err.message);
  process.exit(1);
});
