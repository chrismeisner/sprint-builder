import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  SMOKE_TEST_DAY_THEMES,
  SMOKE_TEST_DEFAULT_COMPLEXITY,
  SMOKE_TEST_DEFAULT_HOURLY_RATE,
  SMOKE_TEST_TIMELINE_WORKING_DAYS,
  calculateSmokeTestHours,
  calculateSmokeTestPrice,
  inferSmokeTestTier,
} from "@/lib/pricing";

type DayPlan = { theme: string; notes: string };
type Deliverable = { week: 1 | 2; title: string; description: string };

const MAX_DELIVERABLES = 20;

function normalizeDeliverables(value: unknown): Deliverable[] {
  if (!Array.isArray(value)) return [];
  const out: Deliverable[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    const weekNum = Number(obj.week);
    const week: 1 | 2 = weekNum === 2 ? 2 : 1;
    const title = typeof obj.title === "string" ? obj.title.trim().slice(0, 120) : "";
    const description =
      typeof obj.description === "string"
        ? obj.description.trim().slice(0, 2000)
        : "";
    if (!title && !description) continue;
    out.push({ week, title, description });
    if (out.length >= MAX_DELIVERABLES) break;
  }
  return out;
}

function normalizeDayPlans(value: unknown): DayPlan[] {
  const out: DayPlan[] = [];
  const input = Array.isArray(value) ? value : [];
  for (let i = 0; i < SMOKE_TEST_TIMELINE_WORKING_DAYS; i++) {
    const raw = input[i];
    const obj =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const themeStr = typeof obj.theme === "string" ? obj.theme.trim() : "";
    const notesStr = typeof obj.notes === "string" ? obj.notes.trim() : "";
    out.push({
      theme: themeStr.slice(0, 60) || SMOKE_TEST_DAY_THEMES[i] || "",
      notes: notesStr.slice(0, 2000),
    });
  }
  return out;
}

type Params = { params: { id: string } };

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter((v) => v.length > 0)
    )
  );
}

function dateOnly(value: unknown): string | null {
  const s = str(value);
  if (!s) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

export async function PATCH(request: Request, { params }: Params) {
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

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await pool.query(
      `SELECT id, project_id, status FROM smoke_test_sprints WHERE id = $1`,
      [id]
    );
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    const currentStatus = existing.rows[0].status as string;
    const projectId = existing.rows[0].project_id as string;
    if (currentStatus !== "draft") {
      return NextResponse.json(
        { error: `Cannot edit a sprint with status '${currentStatus}'` },
        { status: 409 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const noPriorSprint = Boolean(body.noPriorSprint);
    const buildingFromIds = noPriorSprint ? [] : stringArray(body.buildingFromSprintIds);
    if (buildingFromIds.length > 0) {
      const check = await pool.query(
        `SELECT id FROM sprint_drafts WHERE project_id = $1 AND id = ANY($2::text[])`,
        [projectId, buildingFromIds]
      );
      if (check.rowCount !== buildingFromIds.length) {
        return NextResponse.json(
          { error: "One or more selected prior sprints do not belong to this project" },
          { status: 400 }
        );
      }
    }

    const implementationMembers = stringArray(body.implementationMembers);
    if (implementationMembers.length > 0) {
      const normalizedSelected = implementationMembers.map((email) => email.toLowerCase());
      const membersRes = await pool.query(
        `SELECT lower(email) AS email
         FROM project_members
         WHERE project_id = $1
           AND lower(email) = ANY($2::text[])`,
        [projectId, normalizedSelected]
      );
      if (membersRes.rowCount !== normalizedSelected.length) {
        return NextResponse.json(
          { error: "One or more selected implementation members are not attached to this project" },
          { status: 400 }
        );
      }
    }

    const complexityScore = boundedNumber(
      body.complexityScore,
      SMOKE_TEST_DEFAULT_COMPLEXITY,
      1,
      5
    );
    const normalizedComplexityScore = Math.round(complexityScore);
    const hourlyRate = boundedNumber(
      body.hourlyRate,
      SMOKE_TEST_DEFAULT_HOURLY_RATE,
      1,
      5000
    );
    const complexityTier = inferSmokeTestTier(normalizedComplexityScore);
    const impliedHours = calculateSmokeTestHours(normalizedComplexityScore);
    const totalPrice = calculateSmokeTestPrice(normalizedComplexityScore, hourlyRate);

    const confirm = body.confirm === true;
    const nextStatus = confirm ? "scheduled" : "draft";
    const dayPlans = normalizeDayPlans(body.dayPlans);
    const deliverables = normalizeDeliverables(body.deliverables);

    await pool.query(
      `UPDATE smoke_test_sprints SET
         building_from_sprint_ids = $2,
         building_from_other = $3,
         no_prior_sprint = $4,
         current_state = $5,
         whats_next = $6,
         why_now = $7,
         good_looks_like = $8,
         how_we_know = $9,
         browser_prototype_scope = $10,
         figma_file_scope = $11,
         implementation_members = $12,
         existing_assets = $13,
         complexity_tier = $14,
         complexity_score = $15,
         hourly_rate = $16,
         hours_per_complexity_point = $17,
         implied_hours = $18,
         total_price = $19,
         proposed_start_date = $20,
         notes = $21,
         status = $22,
         day_plans = $23,
         deliverables = $24,
         updated_by = $25,
         title = $26,
         updated_at = now()
       WHERE id = $1`,
      [
        id,
        buildingFromIds,
        str(body.buildingFromOther),
        noPriorSprint,
        str(body.currentState),
        str(body.whatsNext),
        str(body.whyNow),
        str(body.goodLooksLike),
        str(body.howWeKnow),
        str(body.browserPrototypeScope),
        str(body.figmaFileScope),
        implementationMembers,
        str(body.existingAssets),
        complexityTier,
        normalizedComplexityScore,
        hourlyRate,
        SMOKE_TEST_TIMELINE_WORKING_DAYS,
        impliedHours,
        totalPrice,
        dateOnly(body.proposedStartDate),
        str(body.notes),
        nextStatus,
        JSON.stringify(dayPlans),
        JSON.stringify(deliverables),
        user.accountId ?? null,
        str(body.title),
      ]
    );

    return NextResponse.json(
      { id, projectId, totalPrice, impliedHours, status: nextStatus },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[SmokeTestSprintsAPI] PATCH error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const res = await pool.query(
      `DELETE FROM smoke_test_sprints WHERE id = $1`,
      [id]
    );
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[SmokeTestSprintsAPI] DELETE error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
