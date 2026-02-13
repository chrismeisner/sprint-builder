import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail, generateMemberWelcomeEmail, generateLeadNotificationEmail, generateMemberRemovedNotificationEmail } from "@/lib/email";
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
      SELECT 
        pm.email,
        pm.title,
        pm.role,
        pm.added_by_account,
        pm.created_at,
        a.name,
        a.first_name,
        a.last_name,
        a.profile_image_url
      FROM project_members pm
      LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
      WHERE pm.project_id = $1
      ORDER BY pm.created_at ASC
      `,
      [projectId]
    );

    return NextResponse.json({
      members: membersRes.rows.map((row) => ({
        email: row.email as string,
        title: row.title as string | null,
        role: (row.role as string) || "member",
        name: row.name as string | null,
        firstName: row.first_name as string | null,
        lastName: row.last_name as string | null,
        profileImageUrl: row.profile_image_url as string | null,
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
    const insertResult = await pool.query(
      `
      INSERT INTO project_members (id, project_id, email, added_by_account)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (project_id, email) DO NOTHING
      RETURNING id
      `,
      [crypto.randomUUID(), projectId, email, user.accountId]
    );

    // Only send emails if the member was actually inserted (not a duplicate)
    const wasInserted = (insertResult.rowCount ?? 0) > 0;
    if (wasInserted) {
      // Get project name and adder's display name
      const projectRes = await pool.query(
        `SELECT name FROM projects WHERE id = $1`,
        [projectId]
      );
      const projectName = (projectRes.rows[0] as { name: string } | undefined)?.name || "Untitled Project";
      const addedByName = user.name || user.firstName || user.email;

      // Build URLs — prefer BASE_URL env, fall back to request origin
      const reqUrl = new URL(request.url);
      const origin = process.env.BASE_URL?.replace(/\/$/, "") || `${reqUrl.protocol}//${reqUrl.host}`;
      const loginUrl = `${origin}/login`;
      const projectUrl = `${origin}/projects/${projectId}`;

      // 1) Email the new member with welcome + login instructions
      try {
        const welcomeEmail = generateMemberWelcomeEmail({
          projectName,
          loginUrl,
          addedByName,
        });
        await sendEmail({
          to: email,
          subject: welcomeEmail.subject,
          text: welcomeEmail.text,
          html: welcomeEmail.html,
        });
        console.log("[ProjectMembersAPI] Welcome email sent to new member", { email });
      } catch (emailErr) {
        console.error("[ProjectMembersAPI] Failed to send welcome email", { email, error: emailErr });
      }

      // 2) Email all leads on the project about the new member
      try {
        const leadsRes = await pool.query(
          `SELECT pm.email FROM project_members pm WHERE pm.project_id = $1 AND pm.role = 'lead' AND lower(pm.email) != lower($2)`,
          [projectId, email]
        );
        const leadEmails = leadsRes.rows.map((r) => (r as { email: string }).email);

        if (leadEmails.length > 0) {
          const leadNotification = generateLeadNotificationEmail({
            projectName,
            newMemberEmail: email,
            addedByName,
            projectUrl,
          });

          await Promise.allSettled(
            leadEmails.map((leadEmail) =>
              sendEmail({
                to: leadEmail,
                subject: leadNotification.subject,
                text: leadNotification.text,
                html: leadNotification.html,
              })
            )
          );
          console.log("[ProjectMembersAPI] Lead notification emails sent", { leads: leadEmails });
        }
      } catch (emailErr) {
        console.error("[ProjectMembersAPI] Failed to send lead notification emails", { error: emailErr });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ProjectMembersAPI] POST error:", error);
    return NextResponse.json({ error: "Failed to add project member" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    await ensureSchema();
    const body = (await request.json().catch(() => ({}))) as { 
      projectId?: unknown; 
      email?: unknown;
      title?: unknown;
      role?: unknown;
    };
    const projectId = typeof body.projectId === "string" ? body.projectId : null;
    const email = normalizeEmail(body.email);
    const title = typeof body.title === "string" ? body.title.trim() : null;
    const VALID_ROLES = ["member", "lead"];
    const role = typeof body.role === "string" && VALID_ROLES.includes(body.role) ? body.role : null;

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

    // Build dynamic SET clause based on provided fields
    const setClauses: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (body.title !== undefined) {
      setClauses.push(`title = $${paramIndex}`);
      values.push(title || null);
      paramIndex++;
    }
    if (body.role !== undefined) {
      if (!role) {
        return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });
      }
      setClauses.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(projectId);
    const projectIdParam = paramIndex++;
    values.push(email);
    const emailParam = paramIndex++;

    const result = await pool.query(
      `
      UPDATE project_members 
      SET ${setClauses.join(", ")}
      WHERE project_id = $${projectIdParam} AND lower(email) = lower($${emailParam})
      RETURNING id
      `,
      values
    );

    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ProjectMembersAPI] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update project member" }, { status: 500 });
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
    const deleteResult = await pool.query(
      `DELETE FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) RETURNING id`,
      [projectId, email]
    );

    // Only send emails if the member was actually deleted
    const wasDeleted = (deleteResult.rowCount ?? 0) > 0;
    if (wasDeleted) {
      // Get project name and remover's display name
      const projectRes = await pool.query(
        `SELECT name FROM projects WHERE id = $1`,
        [projectId]
      );
      const projectName = (projectRes.rows[0] as { name: string } | undefined)?.name || "Untitled Project";
      const removedByName = user.name || user.firstName || user.email;

      // Build URLs — prefer BASE_URL env, fall back to request origin
      const reqUrl = new URL(request.url);
      const origin = process.env.BASE_URL?.replace(/\/$/, "") || `${reqUrl.protocol}//${reqUrl.host}`;
      const projectUrl = `${origin}/projects/${projectId}`;

      // Email all leads on the project about the removed member
      try {
        const leadsRes = await pool.query(
          `SELECT pm.email FROM project_members pm WHERE pm.project_id = $1 AND pm.role = 'lead' AND lower(pm.email) != lower($2)`,
          [projectId, email]
        );
        const leadEmails = leadsRes.rows.map((r) => (r as { email: string }).email);

        if (leadEmails.length > 0) {
          const removalNotification = generateMemberRemovedNotificationEmail({
            projectName,
            removedMemberEmail: email,
            removedByName,
            projectUrl,
          });

          await Promise.allSettled(
            leadEmails.map((leadEmail) =>
              sendEmail({
                to: leadEmail,
                subject: removalNotification.subject,
                text: removalNotification.text,
                html: removalNotification.html,
              })
            )
          );
          console.log("[ProjectMembersAPI] Member removal notification emails sent to leads", { leads: leadEmails });
        }
      } catch (emailErr) {
        console.error("[ProjectMembersAPI] Failed to send member removal notification emails", { error: emailErr });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ProjectMembersAPI] DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove project member" }, { status: 500 });
  }
}

