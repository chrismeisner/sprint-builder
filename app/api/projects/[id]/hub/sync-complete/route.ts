import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/projects/[id]/hub/sync-complete
 *
 * Called after a sync (e.g. by Claude or a script) to record that the hub was updated.
 * Sets hub_last_synced_at for the project. Requires project access (owner, admin, or member).
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const projectId = params.id;
    if (!projectId) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    await ensureSchema();
    const pool = getPool();

    const projectResult = await pool.query(
      `SELECT id, account_id FROM projects WHERE id = $1`,
      [projectId]
    );
    if (projectResult.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectResult.rows[0] as { id: string; account_id: string | null };
    const isOwner = project.account_id === user.accountId;
    const isAdmin = Boolean(user.isAdmin);
    if (!isOwner && !isAdmin) {
      const memberCheck = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [projectId, user.email]
      );
      if (memberCheck.rowCount === 0) {
        return NextResponse.json({ error: "Not authorized to update this project hub" }, { status: 403 });
      }
    }

    await pool.query(
      `UPDATE projects SET hub_last_synced_at = now(), updated_at = now() WHERE id = $1`,
      [projectId]
    );

    const updated = await pool.query(
      `SELECT hub_last_synced_at FROM projects WHERE id = $1`,
      [projectId]
    );
    const row = updated.rows[0] as { hub_last_synced_at: string | null };

    return NextResponse.json({
      ok: true,
      hubLastSyncedAt: row?.hub_last_synced_at
        ? new Date(row.hub_last_synced_at).toISOString()
        : null,
    });
  } catch (error: unknown) {
    console.error("Error recording hub sync:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to record sync" },
      { status: 500 }
    );
  }
}
