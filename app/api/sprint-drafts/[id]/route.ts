import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hoursFromPoints, priceFromPoints } from "@/lib/pricing";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function recalcTotals(pool: ReturnType<typeof getPool>, sprintId: string) {
  const result = await pool.query(
    `SELECT 
       COUNT(*)::int as deliverable_count,
       COALESCE(SUM(COALESCE(sd.custom_estimate_points, sd.base_points, d.points, 0) * sd.quantity), 0)::numeric as total_points
     FROM sprint_deliverables sd
     LEFT JOIN deliverables d ON sd.deliverable_id = d.id
     WHERE sd.sprint_draft_id = $1`,
    [sprintId]
  );

  const totals = result.rows[0] as { deliverable_count: number; total_points: number };
  const totalPoints = Number(totals.total_points);
  const totalHours = hoursFromPoints(totalPoints);
  const totalPrice = priceFromPoints(totalPoints);

  await pool.query(
    `UPDATE sprint_drafts 
     SET deliverable_count = $1,
         total_estimate_points = $2,
         total_fixed_hours = $3,
         total_fixed_price = $4,
         updated_at = now()
     WHERE id = $5`,
    [totals.deliverable_count, totals.total_points, totalHours, totalPrice, sprintId]
  );

  return {
    totalPoints: Number(totalPoints),
    totalHours: Number(totalHours),
    totalPrice: Number(totalPrice),
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const sprintRes = await pool.query(
      `SELECT sd.id, sd.title, sd.project_id, sd.start_date, sd.weeks, sd.due_date, sd.draft,
              d.account_id
       FROM sprint_drafts sd
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [params.id]
    );

    if (sprintRes.rowCount === 0) return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    const sprint = sprintRes.rows[0] as {
      id: string;
      title: string | null;
      project_id: string | null;
      start_date: string | null;
      weeks: number | null;
      due_date: string | null;
      draft: unknown;
      account_id: string | null;
    };

    if (sprint.account_id && sprint.account_id !== user.accountId && !user.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const delRes = await pool.query(
      `SELECT 
         sd.deliverable_id,
         sd.custom_estimate_points,
         sd.base_points,
         sd.notes,
         sd.custom_scope,
         sd.complexity_score,
         sd.quantity,
         sd.deliverable_name,
         d.points,
         d.name,
         d.category
       FROM sprint_deliverables sd
       LEFT JOIN deliverables d ON sd.deliverable_id = d.id
       WHERE sd.sprint_draft_id = $1
       ORDER BY sd.created_at`,
      [params.id]
    );

    const deliverables = delRes.rows.map((row) => {
      const base = asNumber(row.base_points ?? row.points ?? 0, 0);
      const adjusted = asNumber(row.custom_estimate_points ?? base, base);
      const multiplier = base ? adjusted / base : 1;
      return {
        deliverableId: row.deliverable_id as string,
        name: (row.deliverable_name as string | null) ?? (row.name as string | null) ?? "",
        category: (row.category as string | null) ?? null,
        basePoints: base,
        adjustedPoints: adjusted,
        multiplier,
        note: (row.notes as string | null) ?? null,
        customScope: (row.custom_scope as string | null) ?? null,
      };
    });

    return NextResponse.json({
      sprint: {
        id: sprint.id,
        title: sprint.title,
        projectId: sprint.project_id,
        startDate: sprint.start_date,
        weeks: sprint.weeks,
        dueDate: sprint.due_date,
        draft: sprint.draft,
      },
      deliverables,
    });
  } catch (err) {
    console.error("[SprintDraft GET]", err);
    return NextResponse.json({ error: "Failed to load sprint" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const {
      title,
      projectId,
      startDate,
      weeks,
      dueDate,
      deliverables,
      customContent,
      contract_url,
      contract_status,
    } = body as {
      title?: string;
      projectId?: string;
      startDate?: string | null;
      weeks?: number | null;
      dueDate?: string | null;
      deliverables?: Array<{ deliverableId: string; complexityMultiplier?: number; note?: string | null; customScope?: string | null }>;
      customContent?: Record<string, unknown>;
      contract_url?: string | null;
      contract_status?: string | null;
    };

    const sprintRes = await pool.query(
      `SELECT sd.id, sd.project_id, d.account_id
       FROM sprint_drafts sd
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [params.id]
    );
    if (sprintRes.rowCount === 0) return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    const sprint = sprintRes.rows[0] as { account_id: string | null };
    if (sprint.account_id && sprint.account_id !== user.accountId && !user.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Handle simple field updates (admin only for contract fields)
    if (contract_url !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      await pool.query(
        `UPDATE sprint_drafts SET contract_url = $1, updated_at = now() WHERE id = $2`,
        [contract_url || null, params.id]
      );
      return NextResponse.json({ success: true });
    }

    if (contract_status !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      const validStatuses = ["not_linked", "drafted", "signed"];
      const statusValue = validStatuses.includes(contract_status || "") ? contract_status : "not_linked";
      await pool.query(
        `UPDATE sprint_drafts SET contract_status = $1, updated_at = now() WHERE id = $2`,
        [statusValue, params.id]
      );
      return NextResponse.json({ success: true });
    }

    // Full update requires title and projectId
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    // Update sprint core fields
    const weeksValue = Number.isFinite(Number(weeks)) && Number(weeks) > 0 ? Math.round(Number(weeks)) : 2;
    const startValue = typeof startDate === "string" && startDate.trim() ? startDate.trim() : null;
    const dueValue = typeof dueDate === "string" && dueDate.trim() ? dueDate.trim() : null;

    const draftContent = {
      sprintTitle: title,
      ...(customContent && typeof customContent === "object" ? customContent : {}),
    };

    await pool.query(
      `UPDATE sprint_drafts
       SET title = $1,
           project_id = $2,
           start_date = $3,
           due_date = $4,
           weeks = $5,
           draft = $6::jsonb,
           updated_at = now()
       WHERE id = $7`,
      [title.trim(), projectId.trim(), startValue, dueValue, weeksValue, JSON.stringify(draftContent), params.id]
    );

    // Replace deliverables
    await pool.query(`DELETE FROM sprint_deliverables WHERE sprint_draft_id = $1`, [params.id]);

    if (Array.isArray(deliverables) && deliverables.length > 0) {
      for (const item of deliverables) {
        if (!item || typeof item.deliverableId !== "string" || !item.deliverableId.trim()) continue;
        const multiplierRaw = Number(item.complexityMultiplier);
        const multiplier = Number.isFinite(multiplierRaw) && multiplierRaw > 0 ? multiplierRaw : 1;
        const noteVal = typeof item.note === "string" && item.note.trim() ? item.note.trim() : null;
        const scopeVal = typeof item.customScope === "string" && item.customScope.trim() ? item.customScope.trim() : null;

        const delRes = await pool.query(
          `SELECT id, name, description, category, scope, points
           FROM deliverables
           WHERE id = $1`,
          [item.deliverableId]
        );
        if (delRes.rowCount === 0) continue;
        const d = delRes.rows[0] as {
          id: string;
          name: string | null;
          description: string | null;
          category: string | null;
          scope: string | null;
          points: number | null;
        };
        const basePoints = asNumber(d.points, 0);
        const adjustedPoints = Math.round(basePoints * multiplier * 10) / 10;
        const adjustedHours = hoursFromPoints(adjustedPoints);

        await pool.query(
          `INSERT INTO sprint_deliverables (
             id, sprint_draft_id, deliverable_id, quantity,
             deliverable_name, deliverable_description, deliverable_category, deliverable_scope,
             base_points, custom_estimate_points, custom_hours, complexity_score, notes, custom_scope
           )
           VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING`,
          [
            randomUUID(),
            params.id,
            d.id,
            d.name ?? null,
            d.description ?? null,
            d.category ?? null,
            d.scope ?? null,
            basePoints,
            adjustedPoints,
            adjustedHours,
            multiplier,
            noteVal,
            scopeVal,
          ]
        );
      }
    }

    const totals = await recalcTotals(pool, params.id);
    return NextResponse.json({ success: true, totals });
  } catch (err) {
    console.error("[SprintDraft PATCH]", err);
    return NextResponse.json({ error: "Failed to update sprint" }, { status: 500 });
  }
}

