import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

function redactConnectionString(cs?: string | null): string | null {
  if (!cs) return null;
  try {
    const url = new URL(cs);
    if (url.password) {
      url.password = "********";
    }
    if (url.username) {
      const u = url.username;
      url.username = u.length > 2 ? `${u.slice(0, 1)}***${u.slice(-1)}` : "***";
    }
    return url.toString();
  } catch {
    return "postgres://********@********/****";
  }
}

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const [docs, ai, sprints, settings, deliverables] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM documents`),
      pool.query(`SELECT COUNT(*)::int AS c FROM ai_responses`),
      pool.query(`SELECT COUNT(*)::int AS c FROM sprint_drafts`),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE key IN ('sprint_system_prompt','sprint_user_prompt'))::int AS prompts,
                COUNT(*)::int AS total
         FROM app_settings`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE active = true)::int AS active
         FROM deliverables`
      ),
    ]);
    return NextResponse.json({
      ok: true,
      db: {
        urlPreview: redactConnectionString(process.env.DATABASE_URL),
        nodeEnv: process.env.NODE_ENV || "development",
      },
      counts: {
        documents: docs.rows[0]?.c ?? 0,
        ai_responses: ai.rows[0]?.c ?? 0,
        sprint_drafts: sprints.rows[0]?.c ?? 0,
        settings_total: settings.rows[0]?.total ?? 0,
        settings_prompts: settings.rows[0]?.prompts ?? 0,
        deliverables_total: deliverables.rows[0]?.total ?? 0,
        deliverables_active: deliverables.rows[0]?.active ?? 0,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


