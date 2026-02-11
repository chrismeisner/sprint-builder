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

async function logChangelog(
  pool: ReturnType<typeof getPool>,
  sprintId: string,
  accountId: string | null,
  action: string,
  summary: string,
  details?: Record<string, unknown>
) {
  try {
    await pool.query(
      `INSERT INTO sprint_draft_changelog (id, sprint_draft_id, account_id, action, summary, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [randomUUID(), sprintId, accountId, action, summary, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    // Non-blocking — don't fail the main operation if changelog fails
    console.error("[Changelog write]", err);
  }
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

    console.log('[API DEBUG] Raw DB row:', JSON.stringify(sprintRes.rows[0], null, 2));
    console.log('[API DEBUG] start_date from DB:', sprint.start_date);
    console.log('[API DEBUG] start_date type:', typeof sprint.start_date);
    console.log('[API DEBUG] start_date toString:', sprint.start_date ? String(sprint.start_date) : 'null');

    // Helper to format date properly
    function formatDateISO(dateValue: unknown): string | null {
      if (!dateValue) return null;
      if (dateValue instanceof Date) {
        return dateValue.toISOString().slice(0, 10);
      }
      const dateStr = String(dateValue);
      // If already in YYYY-MM-DD format, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // Try to parse and convert
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
      return null;
    }

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

    const responseData = {
      sprint: {
        id: sprint.id,
        title: sprint.title,
        projectId: sprint.project_id,
        startDate: formatDateISO(sprint.start_date),
        weeks: sprint.weeks,
        dueDate: formatDateISO(sprint.due_date),
        draft: sprint.draft,
      },
      deliverables,
    };

    console.log('[API DEBUG] Response startDate:', responseData.sprint.startDate);
    console.log('[API DEBUG] Response dueDate:', responseData.sprint.dueDate);
    console.log('[API DEBUG] Response JSON:', JSON.stringify(responseData.sprint, null, 2));

    return NextResponse.json(responseData);
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
      await logChangelog(pool, params.id, user.accountId, "contract_url", "Updated contract URL", { contract_url: contract_url || null });
      return NextResponse.json({ success: true });
    }

    if (contract_status !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      const validStatuses = ["not_linked", "drafted", "ready", "signed"];
      const statusValue = validStatuses.includes(contract_status || "") ? contract_status : "not_linked";
      await pool.query(
        `UPDATE sprint_drafts SET contract_status = $1, updated_at = now() WHERE id = $2`,
        [statusValue, params.id]
      );
      await logChangelog(pool, params.id, user.accountId, "contract_status", `Changed contract status to "${statusValue}"`, { contract_status: statusValue });
      return NextResponse.json({ success: true });
    }

    // Signed by studio/client update (admin only)
    if (body.signed_by_studio !== undefined || body.signed_by_client !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      
      const updates: string[] = [];
      const values: (boolean | string | null)[] = [];
      let paramIndex = 1;
      
      if (body.signed_by_studio !== undefined) {
        updates.push(`signed_by_studio = $${paramIndex++}`);
        values.push(body.signed_by_studio ?? false);
      }
      if (body.signed_by_client !== undefined) {
        updates.push(`signed_by_client = $${paramIndex++}`);
        values.push(body.signed_by_client ?? false);
      }
      // Also update contract_status if provided (when both sign)
      if (body.contract_status !== undefined) {
        const validStatuses = ["not_linked", "drafted", "ready", "signed"];
        const statusValue = validStatuses.includes(body.contract_status || "") ? body.contract_status : "not_linked";
        updates.push(`contract_status = $${paramIndex++}`);
        values.push(statusValue);
      }
      
      updates.push("updated_at = now()");
      values.push(params.id);
      
      await pool.query(
        `UPDATE sprint_drafts SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
        values
      );
      const signParts: string[] = [];
      if (body.signed_by_studio !== undefined) signParts.push(`studio: ${body.signed_by_studio ? "signed" : "unsigned"}`);
      if (body.signed_by_client !== undefined) signParts.push(`client: ${body.signed_by_client ? "signed" : "unsigned"}`);
      await logChangelog(pool, params.id, user.accountId, "signature", `Updated signatures (${signParts.join(", ")})`, { signed_by_studio: body.signed_by_studio, signed_by_client: body.signed_by_client });
      return NextResponse.json({ success: true });
    }

    // Invoice URL update (admin only)
    if (body.invoice_url !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      await pool.query(
        `UPDATE sprint_drafts SET invoice_url = $1, updated_at = now() WHERE id = $2`,
        [body.invoice_url || null, params.id]
      );
      await logChangelog(pool, params.id, user.accountId, "invoice_url", "Updated invoice URL", { invoice_url: body.invoice_url || null });
      return NextResponse.json({ success: true });
    }

    // Invoice status update (admin only)
    if (body.invoice_status !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      const validInvoiceStatuses = ["not_sent", "sent", "paid", "overdue"];
      const invoiceStatusValue = validInvoiceStatuses.includes(body.invoice_status || "") ? body.invoice_status : "not_sent";
      await pool.query(
        `UPDATE sprint_drafts SET invoice_status = $1, updated_at = now() WHERE id = $2`,
        [invoiceStatusValue, params.id]
      );
      await logChangelog(pool, params.id, user.accountId, "invoice_status", `Changed invoice status to "${invoiceStatusValue}"`, { invoice_status: invoiceStatusValue });
      return NextResponse.json({ success: true });
    }

    // Budget status update (admin only)
    if (body.budget_status !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      const validBudgetStatuses = ["draft", "agreed"];
      const budgetStatusValue = validBudgetStatuses.includes(body.budget_status || "") ? body.budget_status : "draft";
      await pool.query(
        `UPDATE sprint_drafts SET budget_status = $1, updated_at = now() WHERE id = $2`,
        [budgetStatusValue, params.id]
      );
      await logChangelog(pool, params.id, user.accountId, "budget_status", `Changed budget status to "${budgetStatusValue}"`, { budget_status: budgetStatusValue });
      return NextResponse.json({ success: true });
    }

    // Overview update (title and dates) - admin only
    if (body.overview_update !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      const { title, start_date, due_date } = body.overview_update as { 
        title?: string | null; 
        start_date?: string | null; 
        due_date?: string | null;
      };
      const titleValue = typeof title === "string" && title.trim() ? title.trim() : null;
      const startValue = typeof start_date === "string" && start_date.trim() ? start_date.trim() : null;
      const dueValue = typeof due_date === "string" && due_date.trim() ? due_date.trim() : null;
      await pool.query(
        `UPDATE sprint_drafts SET title = $1, start_date = $2, due_date = $3, updated_at = now() WHERE id = $4`,
        [titleValue, startValue, dueValue, params.id]
      );
      const changes: string[] = [];
      if (titleValue) changes.push(`title: "${titleValue}"`);
      if (startValue) changes.push(`start: ${startValue}`);
      if (dueValue) changes.push(`due: ${dueValue}`);
      await logChangelog(pool, params.id, user.accountId, "overview", `Updated overview (${changes.join(", ") || "cleared fields"})`, { title: titleValue, start_date: startValue, due_date: dueValue });
      return NextResponse.json({ success: true });
    }

    // Week notes update (admin only) — lightweight update for week1/week2 kickoff/midweek/endOfWeek
    if (body.week_notes !== undefined) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
      const { weekKey, kickoff, midweek, endOfWeek, overview } = body.week_notes as {
        weekKey: string;
        kickoff?: string;
        midweek?: string;
        endOfWeek?: string;
        overview?: string;
      };
      if (!["week1", "week2"].includes(weekKey)) {
        return NextResponse.json({ error: "Invalid weekKey" }, { status: 400 });
      }
      // Read current draft, merge, write back
      const draftRes = await pool.query(`SELECT draft FROM sprint_drafts WHERE id = $1`, [params.id]);
      const existingDraft =
        draftRes.rows[0]?.draft && typeof draftRes.rows[0].draft === "object"
          ? (draftRes.rows[0].draft as Record<string, unknown>)
          : {};
      const existingWeek = (existingDraft[weekKey] as Record<string, unknown>) ?? {};
      const updatedDraft = {
        ...existingDraft,
        [weekKey]: {
          ...existingWeek,
          // Support new 3-field format
          ...(kickoff !== undefined ? { kickoff: kickoff ?? "" } : {}),
          ...(midweek !== undefined ? { midweek: midweek ?? "" } : {}),
          ...(endOfWeek !== undefined ? { endOfWeek: endOfWeek ?? "" } : {}),
          // Support legacy single-field format (backward compat)
          ...(overview !== undefined ? { overview: overview ?? "" } : {}),
        },
      };
      await pool.query(
        `UPDATE sprint_drafts SET draft = $1::jsonb, updated_at = now() WHERE id = $2`,
        [JSON.stringify(updatedDraft), params.id]
      );
      const weekLabel = weekKey === "week1" ? "Week 1" : "Week 2";
      await logChangelog(pool, params.id, user.accountId, "week_notes", `Updated ${weekLabel} notes`, { weekKey, kickoff, midweek, endOfWeek });
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
    await logChangelog(pool, params.id, user.accountId, "full_update", `Updated sprint via builder (${Array.isArray(deliverables) ? deliverables.length : 0} deliverables)`, {
      title: title.trim(),
      weeks: weeksValue,
      startDate: startValue,
      dueDate: dueValue,
      deliverableCount: Array.isArray(deliverables) ? deliverables.length : 0,
    });
    return NextResponse.json({ success: true, totals });
  } catch (err) {
    console.error("[SprintDraft PATCH]", err);
    return NextResponse.json({ error: "Failed to update sprint" }, { status: 500 });
  }
}

