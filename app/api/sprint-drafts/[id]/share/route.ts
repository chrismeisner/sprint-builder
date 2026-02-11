import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "crypto";

type Params = { params: { id: string } };

/**
 * GET /api/sprint-drafts/[id]/share
 * Returns the existing share_token or generates a new one.
 * Auth required (admin or sprint owner).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch sprint
    const sprintRes = await pool.query(
      `SELECT sd.id, sd.share_token, sd.project_id, d.account_id
       FROM sprint_drafts sd
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [params.id]
    );

    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as {
      id: string;
      share_token: string | null;
      project_id: string | null;
      account_id: string | null;
    };

    // Check access: owner or admin
    if (sprint.account_id && sprint.account_id !== user.accountId && !user.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Return existing token or generate a new one
    let shareToken = sprint.share_token;
    if (!shareToken) {
      shareToken = randomBytes(16).toString("base64url");
      await pool.query(
        `UPDATE sprint_drafts SET share_token = $1, updated_at = now() WHERE id = $2`,
        [shareToken, params.id]
      );
    }

    return NextResponse.json({ shareToken });
  } catch (err) {
    console.error("[SprintShare GET]", err);
    return NextResponse.json({ error: "Failed to get share token" }, { status: 500 });
  }
}
