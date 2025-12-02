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

    // Get user's documents (intake forms) - match by email or account_id
    const documentsResult = await pool.query(
      `SELECT 
        id, 
        filename,
        email,
        created_at
      FROM documents 
      WHERE email = $1 OR account_id = $2
      ORDER BY created_at DESC`,
      [user.email, user.accountId]
    );

    // Get user's sprint drafts (through their documents)
    const sprintsResult = await pool.query(
      `SELECT 
        sd.id,
        sd.title,
        sd.status,
        sd.deliverable_count,
        sd.total_fixed_price,
        sd.total_fixed_hours,
        sd.created_at,
        sd.updated_at,
        sd.document_id,
        d.filename as document_filename
      FROM sprint_drafts sd
      JOIN documents d ON sd.document_id = d.id
      WHERE d.email = $1 OR d.account_id = $2
      ORDER BY sd.created_at DESC`,
      [user.email, user.accountId]
    );

    await autoUpdateOnboardingTasks({
      pool,
      accountId: user.accountId,
      hasIntakeForm: documentsResult.rowCount > 0,
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
      stats: {
        totalDocuments: documentsResult.rowCount,
        totalSprints: sprintsResult.rowCount,
      },
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

