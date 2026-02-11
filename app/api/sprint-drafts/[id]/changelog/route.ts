import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
         cl.id,
         cl.action,
         cl.summary,
         cl.details,
         cl.created_at,
         COALESCE(
           NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''),
           a.name,
           a.email
         ) AS author_name
       FROM sprint_draft_changelog cl
       LEFT JOIN accounts a ON cl.account_id = a.id
       WHERE cl.sprint_draft_id = $1
       ORDER BY cl.created_at DESC
       LIMIT 50`,
      [params.id]
    );

    return NextResponse.json({ entries: result.rows });
  } catch (err) {
    console.error("[Changelog GET]", err);
    return NextResponse.json({ error: "Failed to load changelog" }, { status: 500 });
  }
}
