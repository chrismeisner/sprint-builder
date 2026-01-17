import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  autoUpdateOnboardingTasks,
  ensureOnboardingTasks,
  fetchOnboardingTasks,
} from "@/lib/onboarding";

// GET /api/profile - Get current user's profile with their documents and sprints
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pool = getPool();
    await ensureOnboardingTasks(pool, user.accountId);
    
    // Get user profile information
    const profileResult = await pool.query(
      `SELECT id, email, name, is_admin, created_at FROM accounts WHERE id = $1`,
      [user.accountId]
    );

    if (profileResult.rowCount === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileResult.rows[0];

    // Projects the user owns or is a member of (by email)
    const projectsResult = await pool.query(
      `
      SELECT DISTINCT
        p.id,
        p.name,
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

    const accessibleProjectIds = projectsResult.rows.map((row) => row.id as string);
    const projectArrayParam = accessibleProjectIds.length > 0 ? accessibleProjectIds : [];
    const projectMembers: Record<string, Array<{ email: string; addedByAccount: string | null; createdAt: string }>> = {};

    if (projectArrayParam.length > 0) {
      const membersResult = await pool.query(
        `
        SELECT project_id, email, added_by_account, created_at
        FROM project_members
        WHERE project_id = ANY($1::text[])
        ORDER BY created_at ASC
        `,
        [projectArrayParam]
      );
      for (const row of membersResult.rows) {
        const pid = row.project_id as string;
        if (!projectMembers[pid]) projectMembers[pid] = [];
        projectMembers[pid].push({
          email: row.email as string,
          addedByAccount: row.added_by_account as string | null,
          createdAt: row.created_at as string,
        });
      }
    }

    // Get user's documents (intake forms) - match by email, account_id, or shared project membership
    const documentsResult = await pool.query(
      `SELECT 
        id, 
        filename,
        email,
        created_at,
        project_id
      FROM documents 
      WHERE email = $1 
         OR account_id = $2
         OR (project_id IS NOT NULL AND project_id = ANY($3::text[]))
      ORDER BY created_at DESC`,
      [user.email, user.accountId, projectArrayParam]
    );

    // Get user's sprint drafts (through their documents or shared projects)
    const sprintsResult = await pool.query(
      `SELECT 
        sd.id,
        sd.title,
        sd.status,
        sd.deliverable_count,
        sd.total_fixed_price,
        sd.total_fixed_hours,
        sd.weeks,
        sd.start_date,
        sd.project_id,
        sd.created_at,
        sd.updated_at,
        sd.document_id,
        d.filename as document_filename
      FROM sprint_drafts sd
      LEFT JOIN documents d ON sd.document_id = d.id
      WHERE (d.email = $1 OR d.account_id = $2 OR d.project_id = ANY($3::text[]))
         OR (sd.project_id IS NOT NULL AND sd.project_id = ANY($3::text[]))
      ORDER BY sd.created_at DESC`,
      [user.email, user.accountId, projectArrayParam]
    );

    const documentsRowCount = documentsResult.rowCount ?? 0;
    const sprintsRowCount = sprintsResult.rowCount ?? 0;
    const projectsRowCount = projectsResult.rowCount ?? 0;

    await autoUpdateOnboardingTasks({
      pool,
      accountId: user.accountId,
      hasIntakeForm: documentsRowCount > 0,
    });

    const onboardingTasks = await fetchOnboardingTasks(pool, user.accountId);

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        isAdmin: profile.is_admin,
        createdAt: profile.created_at,
      },
      documents: documentsResult.rows,
      sprints: sprintsResult.rows,
      projects: projectsResult.rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        accountId: row.account_id,
        isOwner: row.is_owner,
      })),
      stats: {
        totalDocuments: documentsRowCount,
        totalSprints: sprintsRowCount,
        totalProjects: projectsRowCount,
      },
      projectMembers,
      onboardingTasks: onboardingTasks.map((task) => ({
        accountId: task.account_id,
        taskKey: task.task_key,
        status: task.status,
        metadata: task.metadata,
        completedAt: task.completed_at,
        updatedAt: task.updated_at,
        createdAt: task.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (name !== undefined && typeof name !== "string") {
      return NextResponse.json({ error: "name must be a string" }, { status: 400 });
    }

    const pool = getPool();
    
    // Update the user's profile
    const result = await pool.query(
      `UPDATE accounts 
       SET name = COALESCE($1, name)
       WHERE id = $2 
       RETURNING id, email, name, is_admin, created_at`,
      [name, user.accountId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const updatedProfile = result.rows[0];

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        name: updatedProfile.name,
        isAdmin: updatedProfile.is_admin,
        createdAt: updatedProfile.created_at,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

