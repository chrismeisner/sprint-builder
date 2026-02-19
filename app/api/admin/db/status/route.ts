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
    const [docs, sprints, deliverables, accounts] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM documents`),
      pool.query(`SELECT COUNT(*)::int AS c FROM sprint_drafts`),
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE active = true)::int AS active
         FROM deliverables`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_admin = true)::int AS admins
         FROM accounts`
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
        sprint_drafts: sprints.rows[0]?.c ?? 0,
        deliverables_total: deliverables.rows[0]?.total ?? 0,
        deliverables_active: deliverables.rows[0]?.active ?? 0,
        accounts_total: accounts.rows[0]?.total ?? 0,
        accounts_admins: accounts.rows[0]?.admins ?? 0,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


