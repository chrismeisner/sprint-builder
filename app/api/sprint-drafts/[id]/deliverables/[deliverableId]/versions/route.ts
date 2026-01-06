import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

type Params = {
  params: { id: string; deliverableId: string };
};

/**
 * POST /api/sprint-drafts/[id]/deliverables/[deliverableId]/versions
 * 
 * Create a new version snapshot of the sprint deliverable.
 * Accepts a custom version number in semantic format (e.g., "1.0", "2.1").
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Parse request body for custom version
    const body = await request.json().catch(() => ({}));
    const { version } = body as { version?: string };

    // Validate version format (X.Y)
    if (!version || !/^\d+\.\d+$/.test(version)) {
      return NextResponse.json({ error: "Version must be in format X.Y (e.g., 1.0, 2.1)" }, { status: 400 });
    }

    // Verify the sprint deliverable exists and user has access
    const checkResult = await pool.query(
      `SELECT 
        spd.id,
        spd.sprint_draft_id,
        spd.type_data,
        spd.content,
        spd.notes,
        spd.current_version,
        sd.status,
        d.account_id,
        sd.project_id
       FROM sprint_deliverables spd
       JOIN sprint_drafts sd ON spd.sprint_draft_id = sd.id
       JOIN documents d ON sd.document_id = d.id
       WHERE spd.id = $1 AND sd.id = $2`,
      [params.deliverableId, params.id]
    );

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ error: "Sprint deliverable not found" }, { status: 404 });
    }

    const sprintDeliverable = checkResult.rows[0];
    const isOwner = sprintDeliverable.account_id === currentUser.accountId;
    const isAdmin = currentUser.isAdmin === true;

    // Check project membership
    let isProjectMember = false;
    if (sprintDeliverable.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [sprintDeliverable.project_id, currentUser.email]
      );
      isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
    }

    if (!isOwner && !isAdmin && !isProjectMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate version is greater than current
    const currentVersion = sprintDeliverable.current_version ?? "0.0";
    const [newMajor, newMinor] = version.split(".").map(Number);
    const [curMajor, curMinor] = currentVersion.split(".").map(Number);
    
    if (newMajor < curMajor || (newMajor === curMajor && newMinor <= curMinor)) {
      return NextResponse.json({ 
        error: `Version must be greater than current version (${currentVersion})` 
      }, { status: 400 });
    }

    // Check if version already exists
    const existingVersion = await pool.query(
      `SELECT 1 FROM sprint_deliverable_versions 
       WHERE sprint_deliverable_id = $1 AND version_number = $2`,
      [params.deliverableId, version]
    );

    if (existingVersion.rowCount && existingVersion.rowCount > 0) {
      return NextResponse.json({ error: `Version ${version} already exists` }, { status: 400 });
    }

    // Create the version record
    const versionId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO sprint_deliverable_versions 
        (id, sprint_deliverable_id, version_number, type_data, content, notes, saved_by, saved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        versionId,
        params.deliverableId,
        version,
        sprintDeliverable.type_data ? JSON.stringify(sprintDeliverable.type_data) : null,
        sprintDeliverable.content,
        sprintDeliverable.notes,
        currentUser.email,
      ]
    );

    // Update the current version number on sprint_deliverables
    await pool.query(
      `UPDATE sprint_deliverables SET current_version = $1 WHERE id = $2`,
      [version, params.deliverableId]
    );

    // Also update sprint's updated_at
    await pool.query(
      `UPDATE sprint_drafts SET updated_at = NOW() WHERE id = $1`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      version: {
        id: versionId,
        versionNumber: version,
        savedBy: currentUser.email,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Error creating sprint deliverable version:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sprint-drafts/[id]/deliverables/[deliverableId]/versions
 * 
 * Get all versions of a sprint deliverable
 */
export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify access
    const accessCheck = await pool.query(
      `SELECT 
        d.account_id,
        sd.project_id
       FROM sprint_deliverables spd
       JOIN sprint_drafts sd ON spd.sprint_draft_id = sd.id
       JOIN documents d ON sd.document_id = d.id
       WHERE spd.id = $1 AND sd.id = $2`,
      [params.deliverableId, params.id]
    );

    if (accessCheck.rowCount === 0) {
      return NextResponse.json({ error: "Sprint deliverable not found" }, { status: 404 });
    }

    const row = accessCheck.rows[0];
    const isOwner = row.account_id === currentUser.accountId;
    const isAdmin = currentUser.isAdmin === true;

    let isProjectMember = false;
    if (row.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [row.project_id, currentUser.email]
      );
      isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
    }

    if (!isOwner && !isAdmin && !isProjectMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all versions, sorted by version number descending
    // Parse version as major.minor for proper sorting
    const versionsResult = await pool.query(
      `SELECT 
        id,
        version_number,
        type_data,
        content,
        notes,
        saved_by,
        saved_at
       FROM sprint_deliverable_versions
       WHERE sprint_deliverable_id = $1
       ORDER BY 
         CAST(SPLIT_PART(version_number, '.', 1) AS INTEGER) DESC,
         CAST(SPLIT_PART(version_number, '.', 2) AS INTEGER) DESC`,
      [params.deliverableId]
    );

    return NextResponse.json({
      versions: versionsResult.rows.map((v) => ({
        id: v.id,
        versionNumber: v.version_number,
        typeData: v.type_data,
        content: v.content,
        notes: v.notes,
        savedBy: v.saved_by,
        savedAt: v.saved_at,
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching sprint deliverable versions:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
