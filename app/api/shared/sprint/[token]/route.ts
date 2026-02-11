import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { hoursFromPoints, priceFromPoints } from "@/lib/pricing";

type Params = { params: { token: string } };

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET /api/shared/sprint/[token]
 * Public endpoint — no authentication required.
 * Returns sprint data for a given share_token.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { token } = params;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Look up sprint by share_token
    const sprintRes = await pool.query(
      `SELECT 
         sd.id, sd.title, sd.status, sd.start_date, sd.due_date, sd.weeks,
         sd.total_estimate_points, sd.total_fixed_hours, sd.total_fixed_price,
         sd.deliverable_count, sd.draft, sd.created_at, sd.updated_at,
         sd.package_name_snapshot, sd.package_description_snapshot,
         p.name as project_name
       FROM sprint_drafts sd
       LEFT JOIN projects p ON sd.project_id = p.id
       WHERE sd.share_token = $1`,
      [token]
    );

    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as Record<string, unknown>;

    // Fetch deliverables for this sprint
    const delRes = await pool.query(
      `SELECT 
         sd.deliverable_id,
         sd.deliverable_name,
         sd.deliverable_description,
         sd.deliverable_category,
         sd.deliverable_scope,
         sd.base_points,
         sd.custom_estimate_points,
         sd.complexity_score,
         sd.quantity,
         sd.notes,
         sd.custom_scope,
         sd.custom_hours,
         d.points,
         d.name,
         d.description,
         d.category,
         d.scope
       FROM sprint_deliverables sd
       LEFT JOIN deliverables d ON sd.deliverable_id = d.id
       WHERE sd.sprint_draft_id = $1
       ORDER BY sd.created_at`,
      [sprint.id]
    );

    const deliverables = delRes.rows.map((row) => {
      const base = asNumber(row.base_points ?? row.points ?? 0, 0);
      const adjusted = asNumber(row.custom_estimate_points ?? base, base);
      const multiplier = base ? adjusted / base : 1;
      const hours = hoursFromPoints(adjusted);

      return {
        name: (row.deliverable_name as string | null) ?? (row.name as string | null) ?? "",
        description: (row.deliverable_description as string | null) ?? (row.description as string | null) ?? null,
        category: (row.deliverable_category as string | null) ?? (row.category as string | null) ?? null,
        scope: (row.custom_scope as string | null) ?? (row.deliverable_scope as string | null) ?? (row.scope as string | null) ?? null,
        basePoints: base,
        adjustedPoints: adjusted,
        multiplier,
        hours,
        note: (row.notes as string | null) ?? null,
        quantity: asNumber(row.quantity, 1),
      };
    });

    // Recalculate totals from deliverables for accuracy
    const totalPoints = deliverables.reduce((sum, d) => sum + d.adjustedPoints * d.quantity, 0);
    const totalHours = hoursFromPoints(totalPoints);
    const totalPrice = priceFromPoints(totalPoints);

    // Parse draft content for approach / week notes
    const draft = sprint.draft && typeof sprint.draft === "object" ? sprint.draft as Record<string, unknown> : {};

    // Build dynamic week notes for all N weeks
    const weekCount = asNumber(sprint.weeks, 2);
    const weekNotes: Record<string, { kickoff: string | null; midweek: string | null; endOfWeek: string | null }> = {};
    for (let i = 1; i <= weekCount; i++) {
      const key = `week${i}`;
      const weekData = draft[key];
      if (weekData && typeof weekData === "object") {
        const w = weekData as Record<string, unknown>;
        const kickoff = typeof w.kickoff === "string" ? w.kickoff : null;
        const midweek = typeof w.midweek === "string" ? w.midweek : null;
        const endOfWeek = typeof w.endOfWeek === "string" ? w.endOfWeek : null;
        // Backward compat: use overview as kickoff fallback
        const kickoffFinal = kickoff || (typeof w.overview === "string" ? w.overview : null);
        weekNotes[key] = { kickoff: kickoffFinal, midweek, endOfWeek };
      } else {
        weekNotes[key] = { kickoff: null, midweek: null, endOfWeek: null };
      }
    }

    return NextResponse.json({
      sprint: {
        title: sprint.title ?? "Untitled Sprint",
        status: sprint.status ?? "draft",
        startDate: sprint.start_date ?? null,
        dueDate: sprint.due_date ?? null,
        weeks: weekCount,
        projectName: sprint.project_name ?? null,
        packageName: sprint.package_name_snapshot ?? null,
        packageDescription: sprint.package_description_snapshot ?? null,
        totalPoints,
        totalHours,
        totalPrice,
        deliverableCount: deliverables.length,
        approach: typeof draft.approach === "string" ? draft.approach : null,
        weekNotes,
        createdAt: sprint.created_at ?? null,
        updatedAt: sprint.updated_at ?? null,
      },
      deliverables,
    });
  } catch (err) {
    console.error("[SharedSprint GET]", err);
    return NextResponse.json({ error: "Failed to load sprint" }, { status: 500 });
  }
}
