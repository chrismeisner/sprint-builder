import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sprintId, inputs, outputs, label } = body as {
      sprintId?: string;
      inputs?: unknown;
      outputs?: unknown;
      label?: string | null;
    };

    if (!sprintId || typeof sprintId !== "string" || !sprintId.trim()) {
      return NextResponse.json({ error: "sprintId is required" }, { status: 400 });
    }
    if (typeof inputs !== "object" || inputs === null) {
      return NextResponse.json({ error: "inputs must be provided" }, { status: 400 });
    }
    if (typeof outputs !== "object" || outputs === null) {
      return NextResponse.json({ error: "outputs must be provided" }, { status: 400 });
    }

    const pool = getPool();
    const sprintRes = await pool.query(
      `SELECT sd.id, d.account_id
       FROM sprint_drafts sd
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [sprintId]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }
    const sprint = sprintRes.rows[0] as { account_id: string | null };
    if (sprint.account_id && sprint.account_id !== user.accountId && !user.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const id = randomUUID();
    await pool.query(
      `INSERT INTO deferred_comp_plans (id, sprint_id, inputs, outputs, label)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5)`,
      [id, sprintId, JSON.stringify(inputs), JSON.stringify(outputs), label ?? null]
    );

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error("[DeferredCompPlans POST]", err);
    return NextResponse.json({ error: "Failed to save comp plan" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get("sprintId");
    if (!sprintId) {
      return NextResponse.json({ error: "sprintId is required" }, { status: 400 });
    }

    const pool = getPool();
    const sprintRes = await pool.query(
      `SELECT sd.id, d.account_id
       FROM sprint_drafts sd
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [sprintId]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }
    const sprint = sprintRes.rows[0] as { account_id: string | null };
    if (sprint.account_id && sprint.account_id !== user.accountId && !user.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plansRes = await pool.query(
      `SELECT id, sprint_id, inputs, outputs, label, created_at, updated_at
       FROM deferred_comp_plans
       WHERE sprint_id = $1
       ORDER BY created_at DESC`,
      [sprintId]
    );

    return NextResponse.json({ plans: plansRes.rows });
  } catch (err) {
    console.error("[DeferredCompPlans GET]", err);
    return NextResponse.json({ error: "Failed to load comp plans" }, { status: 500 });
  }
}

