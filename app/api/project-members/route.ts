import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

async function assertAuth(projectId: string, user: { accountId: string; email: string; isAdmin?: boolean }) {
  const pool = getPool();
  const projectRes = await pool.query(`SELECT account_id FROM projects WHERE id = $1`, [projectId]);
  if (projectRes.rowCount === 0) {
    return { status: 404 as const, body: { error: "Project not found" }, canManage: false, canView: false };
  }

  const projectAccountId = (projectRes.rows[0] as { account_id: string | null }).account_id;
  const isOwner = projectAccountId === user.accountId;
  const isAdmin = Boolean(user.isAdmin);

  const membershipRes = await pool.query(
    `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
    [projectId, user.email]
  );
  const membershipRowCount = membershipRes.rowCount ?? 0;
  const isMember = membershipRowCount > 0;

  const canManage = isAdmin || isOwner;
  const canView = canManage || isMember;

  return { status: 200 as const, body: null, canManage, canView };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const auth = await assertAuth(projectId, user);
    if (auth.status !== 200) {
      return NextResponse.json(auth.body, { status: auth.status });
    }
    if (!auth.canView) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const pool = getPool();
    const membersRes = await pool.query(
      `
      SELECT email, added_by_account, created_at
      FROM project_members
      WHERE project_id = $1
      ORDER BY created_at ASC
      `,
      [projectId]
    );

    return NextResponse.json({
      members: membersRes.rows.map((row) => ({
        email: row.email as string,
        addedByAccount: row.added_by_account as string | null,
        createdAt: row.created_at as string,
      })),
    });
  } catch (error) {
    console.error("[ProjectMembersAPI] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch project members" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    await ensureSchema();
    const body = (await request.json().catch(() => ({}))) as { projectId?: unknown; email?: unknown };
    const projectId = typeof body.projectId === "string" ? body.projectId : null;
    const email = normalizeEmail(body.email);

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const auth = await assertAuth(projectId, user);
    if (auth.status !== 200) {
      return NextResponse.json(auth.body, { status: auth.status });
    }
    if (!auth.canManage) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const pool = getPool();
    await pool.query(
      `
      INSERT INTO project_members (id, project_id, email, added_by_account)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (project_id, email) DO NOTHING
      `,
      [crypto.randomUUID(), projectId, email, user.accountId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ProjectMembersAPI] POST error:", error);
    return NextResponse.json({ error: "Failed to add project member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const emailParam = searchParams.get("email");
    const email = normalizeEmail(emailParam);

    if (!projectId || !email) {
      return NextResponse.json({ error: "projectId and email are required" }, { status: 400 });
    }

    const auth = await assertAuth(projectId, user);
    if (auth.status !== 200) {
      return NextResponse.json(auth.body, { status: auth.status });
    }
    if (!auth.canManage) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const pool = getPool();
    await pool.query(
      `DELETE FROM project_members WHERE project_id = $1 AND lower(email) = lower($2)`,
      [projectId, email]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ProjectMembersAPI] DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove project member" }, { status: 500 });
  }
}

