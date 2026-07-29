import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { renderSprintMarkdown } from "@/lib/export-markdown";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function GET(req: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const pool = getPool();

    // Same access rule as the sprint page: sprint owner, project owner,
    // project member, or admin.
    const sprintRes = await pool.query(
      `SELECT sd.project_id, d.project_id AS document_project_id, d.account_id
       FROM sprint_drafts sd
       LEFT JOIN documents d ON d.id = sd.document_id
       WHERE sd.id = $1`,
      [params.id]
    );
    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }
    const row = sprintRes.rows[0] as {
      project_id: string | null;
      document_project_id: string | null;
      account_id: string | null;
    };

    const projectId = row.project_id || row.document_project_id;
    const isOwner = row.account_id === user.accountId;
    const isAdmin = Boolean(user.isAdmin);

    let isProjectOwner = false;
    let isProjectMember = false;
    if (projectId) {
      const projectRes = await pool.query(`SELECT account_id FROM projects WHERE id = $1`, [projectId]);
      if (projectRes.rowCount) {
        isProjectOwner = (projectRes.rows[0] as { account_id: string | null }).account_id === user.accountId;
      }
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [projectId, user.email]
      );
      isProjectMember = (memberRes.rowCount ?? 0) > 0;
    }

    if (!isOwner && !isProjectOwner && !isProjectMember && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const result = await renderSprintMarkdown(params.id);
    if (!result) return NextResponse.json({ error: "Sprint not found" }, { status: 404 });

    const inline = new URL(req.url).searchParams.get("inline") === "1";
    return new NextResponse(result.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[Export] sprint export failed:", error);
    return NextResponse.json({ error: (error as Error).message ?? "Unknown error" }, { status: 500 });
  }
}
