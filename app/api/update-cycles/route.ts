import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { UPDATE_CYCLE_WEEKLY_RATE } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID, randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      title,
      projectId,
      parentSprintId,
      startDate,
      weeks: weeksRaw,
      priceOverride: priceOverrideRaw,
      overview: overviewRaw,
    } = body as {
      title?: unknown;
      projectId?: unknown;
      parentSprintId?: unknown;
      startDate?: unknown;
      weeks?: unknown;
      priceOverride?: unknown;
      overview?: unknown;
    };
    const overview = typeof overviewRaw === "string" && overviewRaw.trim() ? overviewRaw.trim() : undefined;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof projectId !== "string" || !projectId.trim()) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }
    if (typeof parentSprintId !== "string" || !parentSprintId.trim()) {
      return NextResponse.json({ error: "A previous sprint must be selected" }, { status: 400 });
    }

    // Validate project exists
    const projectRes = await pool.query(`SELECT id FROM projects WHERE id = $1`, [projectId]);
    if (projectRes.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate parent sprint exists, belongs to project, and is complete
    const parentRes = await pool.query(
      `SELECT id, title, status FROM sprint_drafts WHERE id = $1 AND project_id = $2`,
      [parentSprintId, projectId]
    );
    if (parentRes.rowCount === 0) {
      return NextResponse.json({ error: "Parent sprint not found in this project" }, { status: 404 });
    }

    const weeksNumber = Number(weeksRaw);
    const weeks = Number.isFinite(weeksNumber) && weeksNumber >= 1 && weeksNumber <= 12
      ? Math.round(weeksNumber)
      : 1;

    const startDateValue = typeof startDate === "string" && startDate.trim() ? startDate.trim() : null;

    // Calculate due date from start date + weeks
    let dueDateValue: string | null = null;
    if (startDateValue) {
      const start = new Date(`${startDateValue}T00:00:00`);
      if (!Number.isNaN(start.getTime())) {
        const due = new Date(start);
        due.setDate(due.getDate() + weeks * 7 - 3);
        const tzOffset = due.getTimezoneOffset();
        const adjusted = new Date(due.getTime() - tzOffset * 60_000);
        dueDateValue = adjusted.toISOString().slice(0, 10);
      }
    }

    const standardPrice = UPDATE_CYCLE_WEEKLY_RATE * weeks;
    const parsedOverride = priceOverrideRaw != null ? Number(priceOverrideRaw) : NaN;
    const totalPrice = Number.isFinite(parsedOverride) && parsedOverride > 0
      ? parsedOverride
      : standardPrice;
    const id = randomUUID();
    const shareToken = randomBytes(16).toString("base64url");

    const draftContent = {
      sprintTitle: title.trim(),
      source: "update_cycle",
      ...(overview ? { overview } : {}),
    };

    await pool.query(
      `INSERT INTO sprint_drafts (
         id, draft, status, title, type, parent_sprint_id,
         project_id, start_date, due_date, weeks,
         total_fixed_price, deliverable_count,
         share_token, has_deferred_comp, upfront_payment_percent,
         updated_at
       )
       VALUES ($1, $2::jsonb, 'draft', $3, 'update_cycle', $4,
               $5, $6, $7, $8,
               $9, 0,
               $10, false, 50.00,
               now())`,
      [
        id,
        JSON.stringify(draftContent),
        title.trim(),
        parentSprintId,
        projectId,
        startDateValue,
        dueDateValue,
        weeks,
        totalPrice,
        shareToken,
      ]
    );

    // Create default budget plan: 50% before kickoff, 50% net30 after completion
    const budgetPlanId = randomUUID();
    const upfrontAmount = totalPrice * 0.5;
    const completionAmount = totalPrice * 0.5;
    const defaultBudgetInputs = {
      isDeferred: false,
      totalProjectValue: totalPrice,
      upfrontPayment: 0.5,
      upfrontPaymentTiming: "before_kickoff",
      completionPaymentTiming: "net30",
      equitySplit: 0,
      milestones: [],
      milestoneMissOutcome: "forgiven",
    };
    const defaultBudgetOutputs = {
      upfrontAmount,
      equityAmount: 0,
      deferredAmount: 0,
      milestoneBonusAmount: 0,
      remainingOnCompletion: completionAmount,
      totalProjectValue: totalPrice,
    };
    await pool.query(
      `INSERT INTO deferred_comp_plans (id, sprint_id, inputs, outputs, label)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)`,
      [
        budgetPlanId,
        id,
        JSON.stringify(defaultBudgetInputs),
        JSON.stringify(defaultBudgetOutputs),
        "Update Cycle — 50/50",
      ]
    );

    return NextResponse.json({ id, totalPrice, shareToken }, { status: 201 });
  } catch (error: unknown) {
    console.error("[UpdateCyclesAPI] POST error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
