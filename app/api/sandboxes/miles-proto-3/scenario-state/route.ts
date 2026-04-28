import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

const STATE_KEY = "main";

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const res = await pool.query(
      `SELECT scenario_overrides, scenario_order, screen_overrides, updated_at
       FROM miles_proto3_scenario_state
       WHERE key = $1`,
      [STATE_KEY]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ scenarioOverrides: {}, scenarioOrder: [], screenOverrides: {}, updatedAt: null });
    }
    const row = res.rows[0];
    return NextResponse.json({
      scenarioOverrides: row.scenario_overrides ?? {},
      scenarioOrder: row.scenario_order ?? [],
      screenOverrides: row.screen_overrides ?? {},
      updatedAt: row.updated_at ?? null,
    });
  } catch (err) {
    console.error("[scenario-state GET]", err);
    return NextResponse.json({ error: "Failed to load state" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const scenarioOverrides = body.scenarioOverrides ?? {};
    const scenarioOrder = body.scenarioOrder ?? [];
    const screenOverrides = body.screenOverrides ?? {};

    const pool = getPool();
    await pool.query(
      `INSERT INTO miles_proto3_scenario_state (key, scenario_overrides, scenario_order, screen_overrides, updated_at)
       VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, now())
       ON CONFLICT (key) DO UPDATE
         SET scenario_overrides = EXCLUDED.scenario_overrides,
             scenario_order     = EXCLUDED.scenario_order,
             screen_overrides   = EXCLUDED.screen_overrides,
             updated_at         = now()`,
      [STATE_KEY, JSON.stringify(scenarioOverrides), JSON.stringify(scenarioOrder), JSON.stringify(screenOverrides)]
    );
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[scenario-state PUT]", err);
    return NextResponse.json({ error: "Failed to save state" }, { status: 500 });
  }
}
