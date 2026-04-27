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
import { randomUUID } from "crypto";

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

    const projectId = str(body.projectId);
    if (!projectId) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 });
    }

    const projectRes = await pool.query(
      `SELECT id, name FROM projects WHERE id = $1`,
      [projectId]
    );
    if (projectRes.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const projectNameSnapshot = (projectRes.rows[0].name as string | null) ?? null;

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

    const id = randomUUID();
    const confirm = body.confirm === true;
    const status = confirm ? "confirmed" : "draft";
    const dayPlans = normalizeDayPlans(body.dayPlans);
    const deliverables = normalizeDeliverables(body.deliverables);

    await pool.query(
      `INSERT INTO smoke_test_sprints (
         id, project_id,
         project_name_snapshot, building_from_sprint_ids, building_from_other, no_prior_sprint,
         current_state,
         whats_next, why_now, good_looks_like, how_we_know,
         browser_prototype_scope, figma_file_scope, implementation_path, implementation_members, existing_assets,
         complexity_tier, complexity_score, hourly_rate, hours_per_complexity_point,
         implied_hours, total_price, proposed_start_date,
         notes, status, created_by, day_plans, deliverables
       )
       VALUES (
         $1, $2,
         $3, $4, $5, $6,
         $7,
         $8, $9, $10, $11,
         $12, $13, $14, $15, $16,
         $17, $18, $19, $20,
         $21, $22, $23,
         $24, $26, $25, $27, $28
       )`,
      [
        id,
        projectId,
        projectNameSnapshot,
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
        null, // legacy field; kept for backwards compatibility with existing schema.
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
        user.accountId ?? null,
        status,
        JSON.stringify(dayPlans),
        JSON.stringify(deliverables),
      ]
    );

    return NextResponse.json(
      { id, projectId, totalPrice, impliedHours, status },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[SmokeTestSprintsAPI] POST error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
