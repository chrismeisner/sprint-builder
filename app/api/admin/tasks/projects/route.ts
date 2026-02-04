import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/tasks/projects - List all client projects (for admin to link ideas to)
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();

    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.account_id,
        a.name as account_name,
        a.email as account_email,
        p.created_at,
        p.updated_at
      FROM projects p
      LEFT JOIN accounts a ON p.account_id = a.id
      ORDER BY p.name ASC, p.created_at DESC
    `);

    return NextResponse.json({ projects: result.rows });
  } catch (error) {
    console.error("Error fetching projects:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
