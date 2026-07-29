import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { renderProjectMarkdown } from "@/lib/export-markdown";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const pool = getPool();
    const projectRes = await pool.query(`SELECT account_id FROM projects WHERE id = $1`, [params.id]);
    if (projectRes.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = (projectRes.rows[0] as { account_id: string | null }).account_id === user.accountId;
    const isAdmin = Boolean(user.isAdmin);
    const memberRes = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
      [params.id, user.email]
    );
    const isMember = (memberRes.rowCount ?? 0) > 0;

    if (!isOwner && !isAdmin && !isMember) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const result = await renderProjectMarkdown(params.id);
    if (!result) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const inline = new URL(req.url).searchParams.get("inline") === "1";
    return new NextResponse(result.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[Export] project export failed:", error);
    return NextResponse.json({ error: (error as Error).message ?? "Unknown error" }, { status: 500 });
  }
}
