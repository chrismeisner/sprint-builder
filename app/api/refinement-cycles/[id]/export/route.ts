import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { renderRefinementCycleMarkdown } from "@/lib/export-markdown";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const pool = getPool();

    // Same access rule as the cycle review page: admin, project owner, or
    // explicit project member.
    const cycleRes = await pool.query(
      `SELECT rc.project_id, p.account_id AS project_account_id
       FROM refinement_cycles rc
       LEFT JOIN projects p ON p.id = rc.project_id
       WHERE rc.id = $1`,
      [params.id]
    );
    if (cycleRes.rowCount === 0) {
      return NextResponse.json({ error: "Refinement cycle not found" }, { status: 404 });
    }
    const row = cycleRes.rows[0] as { project_id: string | null; project_account_id: string | null };

    const isAdmin = Boolean(user.isAdmin);
    const isOwner = row.project_account_id === user.accountId;
    let isMember = isOwner;
    if (!isAdmin && !isOwner && row.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [row.project_id, user.email]
      );
      isMember = (memberRes.rowCount ?? 0) > 0;
    }
    if (!isAdmin && !isMember) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const result = await renderRefinementCycleMarkdown(params.id);
    if (!result) return NextResponse.json({ error: "Refinement cycle not found" }, { status: 404 });

    const inline = new URL(req.url).searchParams.get("inline") === "1";
    return new NextResponse(result.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[Export] refinement cycle export failed:", error);
    return NextResponse.json({ error: (error as Error).message ?? "Unknown error" }, { status: 500 });
  }
}
