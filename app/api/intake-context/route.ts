import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/intake-context
 * Returns the logged-in user's projects and completed/in-progress sprints.
 * Used by the update-cycle intake form to let clients pick which sprints to iterate on.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, projects: [] });
    }

    await ensureSchema();
    const pool = getPool();

    const projectsRes = await pool.query(
      `
      SELECT DISTINCT p.id, p.name, p.emoji, p.status
      FROM projects p
      LEFT JOIN project_members pm
        ON pm.project_id = p.id
       AND lower(pm.email) = lower($2)
      WHERE p.account_id = $1
         OR pm.email IS NOT NULL
      ORDER BY p.name ASC
      `,
      [user.accountId, user.email]
    );

    const projectIds = projectsRes.rows.map((r) => r.id as string);

    let sprints: Array<{
      id: string;
      title: string;
      status: string;
      projectId: string;
      startDate: string | null;
      dueDate: string | null;
      deliverableCount: number;
    }> = [];

    if (projectIds.length > 0) {
      const sprintsRes = await pool.query(
        `
        SELECT id, title, status, project_id, start_date, due_date, deliverable_count
        FROM sprint_drafts
        WHERE project_id = ANY($1)
          AND status IN ('complete', 'in_progress', 'scheduled')
        ORDER BY COALESCE(start_date, created_at) DESC
        `,
        [projectIds]
      );

      sprints = sprintsRes.rows.map((r) => ({
        id: r.id as string,
        title: (r.title as string) || "Untitled Sprint",
        status: r.status as string,
        projectId: r.project_id as string,
        startDate: r.start_date ? new Date(r.start_date as string).toISOString().split("T")[0] : null,
        dueDate: r.due_date ? new Date(r.due_date as string).toISOString().split("T")[0] : null,
        deliverableCount: Number(r.deliverable_count) || 0,
      }));
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        name: user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        email: user.email,
      },
      projects: projectsRes.rows.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        emoji: (r.emoji as string) || null,
        status: r.status as string,
      })),
      sprints,
    });
  } catch (error: unknown) {
    console.error("[IntakeContext] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
