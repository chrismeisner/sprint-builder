import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
};

// Valid project status values (admin-only single select)
const VALID_PROJECT_STATUSES = ['active', 'on_hold', 'completed', 'cancelled'] as const;
type ProjectStatus = typeof VALID_PROJECT_STATUSES[number];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT DISTINCT
        p.id,
        p.name,
        p.status,
        p.created_at,
        p.updated_at,
        p.account_id,
        (p.account_id = $1) AS is_owner
      FROM projects p
      LEFT JOIN project_members pm
        ON pm.project_id = p.id
       AND lower(pm.email) = lower($2)
      WHERE p.account_id = $1
         OR pm.email IS NOT NULL
      ORDER BY p.created_at DESC
      `,
      [user.accountId, user.email]
    );

    return NextResponse.json({
      projects: result.rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        status: (row as ProjectRow).status ?? 'active',
        createdAt: new Date((row as ProjectRow).created_at).toISOString(),
        updatedAt: new Date((row as ProjectRow).updated_at).toISOString(),
        accountId: (row as ProjectRow & { account_id?: string }).account_id ?? null,
        isOwner: Boolean((row as { is_owner?: boolean }).is_owner),
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name } = body as { name?: unknown };

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    await ensureSchema();
    const pool = getPool();
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO projects (id, account_id, name)
       VALUES ($1, $2, $3)
       RETURNING id, name, created_at, updated_at`,
      [id, user.accountId, name.trim()]
    );

    const row = result.rows[0] as ProjectRow;

    // Ensure creator is added as a project member (by email)
    try {
      await pool.query(
        `
        INSERT INTO project_members (id, project_id, email, added_by_account)
        VALUES ($1, $2, lower($3), $4)
        ON CONFLICT (project_id, email) DO NOTHING
        `,
        [randomUUID(), row.id, user.email, user.accountId]
      );
    } catch (memberErr) {
      console.error("[ProjectsAPI] failed to add creator as member:", memberErr);
    }

    return NextResponse.json(
      {
        project: {
          id: row.id,
          name: row.name,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, name, status } = body as { id?: unknown; name?: unknown; status?: unknown };

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    // At least one field to update must be provided
    const hasNameUpdate = typeof name === "string" && name.trim();
    const hasStatusUpdate = typeof status === "string" && status.trim();
    
    if (!hasNameUpdate && !hasStatusUpdate) {
      return NextResponse.json({ error: "At least name or status is required" }, { status: 400 });
    }

    // Validate status value if provided
    if (hasStatusUpdate && !VALID_PROJECT_STATUSES.includes(status as ProjectStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_PROJECT_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Status updates are admin-only
    if (hasStatusUpdate && !user.isAdmin) {
      return NextResponse.json({ error: "Only admins can update project status" }, { status: 403 });
    }

    await ensureSchema();
    const pool = getPool();

    // Ensure ownership (or admin for status updates)
    const ownerCheck = await pool.query(
      `SELECT account_id FROM projects WHERE id = $1 LIMIT 1`,
      [id.trim()]
    );
    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const accountId = (ownerCheck.rows[0] as { account_id: string | null }).account_id;
    
    // For name updates, require ownership. For status-only updates, require admin.
    if (hasNameUpdate && !user.isAdmin && (!accountId || accountId !== user.accountId)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: (string | null)[] = [];
    let paramIndex = 1;

    if (hasNameUpdate) {
      updates.push(`name = $${paramIndex}`);
      params.push((name as string).trim());
      paramIndex++;
    }

    if (hasStatusUpdate) {
      updates.push(`status = $${paramIndex}`);
      params.push((status as string).trim());
      paramIndex++;
    }

    updates.push("updated_at = now()");
    params.push(id.trim());

    const result = await pool.query(
      `UPDATE projects
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, name, status, created_at, updated_at, account_id`,
      params
    );

    const row = result.rows[0] as ProjectRow & { account_id: string | null };

    return NextResponse.json({
      project: {
        id: row.id,
        name: row.name,
        status: row.status ?? 'active',
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        accountId: row.account_id,
      },
    });
  } catch (error: unknown) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects?id=projectId
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    await ensureSchema();
    const pool = getPool();

    // Allow deletion if user is the owner OR an admin
    const whereClause = user.isAdmin
      ? `WHERE id = $1`
      : `WHERE id = $1 AND account_id = $2`;
    
    const params = user.isAdmin ? [id] : [id, user.accountId];

    const result = await pool.query(
      `DELETE FROM projects ${whereClause}`,
      params
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to delete project" },
      { status: 500 }
    );
  }
}
