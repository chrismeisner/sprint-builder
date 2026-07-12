import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  REFINEMENT_CYCLE_TOTAL_PRICE,
  REFINEMENT_CYCLE_DEPOSIT_AMOUNT,
  REFINEMENT_CYCLE_FINAL_AMOUNT,
} from "@/lib/refinementCycle";
import crypto from "crypto";

// POST /api/admin/hills/[id]/convert — Stage-A intake bridge.
// Turns an accepted proposal hill into the corresponding LEGACY record so the
// existing (proven) client pipeline — agreement, invoicing, delivery — can run.
// The hill and the legacy record are linked via hills.type_data.linked_*.
// Intentionally does NOT touch Stripe, invoices, or the webhook.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const hillRes = await pool.query(`SELECT * FROM hills WHERE id = $1`, [params.id]);
    if (hillRes.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });
    const hill = hillRes.rows[0];
    const td = (hill.type_data ?? {}) as Record<string, unknown>;

    if (hill.type !== "sprint" && hill.type !== "refinement_cycle") {
      return NextResponse.json({ error: "Only sprint or refinement hills can be converted" }, { status: 400 });
    }
    if (td.linked_id) {
      return NextResponse.json(
        { error: "Already converted", linkedType: td.linked_type, linkedId: td.linked_id },
        { status: 409 }
      );
    }

    // Kept (non-dismissed) deliverables become the proposed scope.
    const delivs = (
      await pool.query(
        `SELECT name, notes FROM hill_deliverables
          WHERE hill_id = $1 AND dismissed_at IS NULL
          ORDER BY sort_order, created_at`,
        [params.id]
      )
    ).rows;

    let linkedType: string;
    let linkedId: string;
    let url: string;

    if (hill.type === "sprint") {
      linkedId = crypto.randomUUID();
      linkedType = "sprint";
      // sprint_deliverables.deliverable_id is NOT NULL (catalog-bound), so the
      // proposed free-text deliverables ride in the draft blob for the studio to
      // materialize in the builder — no sprint_deliverables rows are inserted.
      const draft = {
        sprintTitle: hill.title,
        source: "intake",
        fromHillId: hill.id,
        proposedDeliverables: delivs.map((d) => d.name).filter(Boolean),
      };
      const weeks = Number.parseInt(String(td.weeks ?? "2"), 10) || 2;
      await pool.query(
        `INSERT INTO sprint_drafts (id, draft, status, title, project_id, weeks, updated_at)
         VALUES ($1, $2::jsonb, 'draft', $3, $4, $5, now())`,
        [linkedId, JSON.stringify(draft), hill.title, hill.project_id, weeks]
      );
      url = `/sprints/${linkedId}`;
    } else {
      // refinement_cycles.project_id is NOT NULL.
      if (!hill.project_id) {
        return NextResponse.json(
          { error: "Assign this hill to a project before converting it to a refinement cycle." },
          { status: 400 }
        );
      }
      linkedId = crypto.randomUUID();
      linkedType = "refinement_cycle";
      await pool.query(
        `INSERT INTO refinement_cycles (
           id, project_id, title, submitter_email,
           whats_working, whats_not_working, success_looks_like,
           rate, total_price, deposit_amount, final_amount,
           status, submitted_at, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'full', $8, $9, $10, 'submitted', now(), $11)`,
        [
          linkedId,
          hill.project_id,
          hill.title,
          (td.submitter_email as string) ?? hill.submitter_email ?? null,
          (td.whats_working as string) ?? null,
          (td.whats_not_working as string) ?? null,
          (td.success_looks_like as string) ?? hill.summary ?? null,
          REFINEMENT_CYCLE_TOTAL_PRICE,
          REFINEMENT_CYCLE_DEPOSIT_AMOUNT,
          REFINEMENT_CYCLE_FINAL_AMOUNT,
          admin.accountId,
        ]
      );
      // Free-text screens (unlike sprint deliverables) can be copied directly.
      for (let i = 0; i < delivs.length; i++) {
        await pool.query(
          `INSERT INTO refinement_cycle_screens (id, refinement_cycle_id, name, notes, added_by, sort_order)
           VALUES ($1, $2, $3, $4, 'client', $5)`,
          [crypto.randomUUID(), linkedId, delivs[i].name, delivs[i].notes, i]
        );
      }
      url = `/dashboard/refinement-cycles/${linkedId}`;
    }

    // Link the hill to the legacy record.
    await pool.query(
      `UPDATE hills
          SET type_data = COALESCE(type_data, '{}'::jsonb) || jsonb_build_object('linked_type', $2::text, 'linked_id', $3::text),
              updated_at = now()
        WHERE id = $1`,
      [params.id, linkedType, linkedId]
    );
    await pool
      .query(
        `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, author_account_id, data)
         VALUES ($1, $2, 'hill', $2, 'event', 'converted', $3, $4)`,
        [crypto.randomUUID(), params.id, admin.accountId, JSON.stringify({ linkedType, linkedId })]
      )
      .catch(() => {});

    return NextResponse.json({ ok: true, linkedType, linkedId, url }, { status: 201 });
  } catch (error) {
    console.error("Error converting hill:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to convert" }, { status: 500 });
  }
}
