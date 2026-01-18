import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getPool, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

type SandboxRow = {
  id: string;
  project_id: string;
  name: string;
  folder_name: string;
  description: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  project_name: string;
  has_index: boolean;
  file_count: number;
};

// Sandboxes are stored in /sandboxes-data/ (outside of /public for access control)
const SANDBOXES_DIR = path.join(process.cwd(), "sandboxes-data");

// Get all folder names in /sandboxes-data/
function getPhysicalFolders(): string[] {
  if (!fs.existsSync(SANDBOXES_DIR)) {
    return [];
  }
  return fs
    .readdirSync(SANDBOXES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

// Get folder info (files, hasIndex)
function getFolderInfo(folderName: string): { files: string[]; hasIndex: boolean } {
  const folderPath = path.join(SANDBOXES_DIR, folderName);
  if (!fs.existsSync(folderPath)) {
    return { files: [], hasIndex: false };
  }
  const files = fs.readdirSync(folderPath);
  return {
    files,
    hasIndex: files.includes("index.html"),
  };
}

// GET /api/sandboxes - List sandboxes the user has access to
// Query params:
//   ?unregistered=true - Admin only: list folders not yet registered
export async function GET(request: NextRequest) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showUnregistered = searchParams.get("unregistered") === "true";

    // If requesting unregistered folders, must be admin
    if (showUnregistered) {
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }

      const pool = getPool();
      
      // Get all registered folder names
      const registeredResult = await pool.query(`SELECT folder_name FROM sandboxes`);
      const registeredFolders = new Set(
        registeredResult.rows.map((r: { folder_name: string }) => r.folder_name)
      );

      // Get physical folders and filter to unregistered ones
      const physicalFolders = getPhysicalFolders();
      const unregistered = physicalFolders
        .filter((folder) => !registeredFolders.has(folder))
        .map((folder) => {
          const info = getFolderInfo(folder);
          // Convert folder name to display name
          const displayName = folder
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          return {
            folderName: folder,
            displayName,
            hasIndex: info.hasIndex,
            fileCount: info.files.length,
          };
        });

      return NextResponse.json({ unregistered });
    }

    // Regular request: list sandboxes user has access to
    const pool = getPool();
    
    let sandboxes: SandboxRow[];
    
    if (user.isAdmin) {
      // Admins see all sandboxes
      const result = await pool.query(`
        SELECT 
          s.id, s.project_id, s.name, s.folder_name, s.description, s.is_public,
          s.created_by, s.created_at, s.updated_at,
          p.name AS project_name
        FROM sandboxes s
        LEFT JOIN projects p ON s.project_id = p.id
        ORDER BY s.created_at DESC
      `);
      sandboxes = result.rows;
    } else {
      // Non-admins see sandboxes for projects they own or are members of
      const result = await pool.query(`
        SELECT 
          s.id, s.project_id, s.name, s.folder_name, s.description, s.is_public,
          s.created_by, s.created_at, s.updated_at,
          p.name AS project_name
        FROM sandboxes s
        LEFT JOIN projects p ON s.project_id = p.id
        WHERE s.project_id IS NULL
           OR p.account_id = $1
           OR EXISTS (
             SELECT 1 FROM project_members pm 
             WHERE pm.project_id = p.id 
               AND lower(pm.email) = lower($2)
           )
        ORDER BY s.created_at DESC
      `, [user.accountId, user.email]);
      sandboxes = result.rows;
    }

    // Enrich with file system info
    const enrichedSandboxes = sandboxes.map((sandbox) => {
      const info = getFolderInfo(sandbox.folder_name);
      return {
        ...sandbox,
        hasIndex: info.hasIndex,
        fileCount: info.files.length,
        folderExists: info.files.length > 0 || fs.existsSync(
          path.join(SANDBOXES_DIR, sandbox.folder_name)
        ),
      };
    });

    return NextResponse.json({ sandboxes: enrichedSandboxes });
  } catch (error) {
    console.error("Error fetching sandboxes:", error);
    return NextResponse.json({ error: "Failed to fetch sandboxes" }, { status: 500 });
  }
}

// POST /api/sandboxes - Register a new sandbox (admin only)
// Body: { folderName, projectId, name?, description? }
export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const admin = await requireAdmin();

    const body = await request.json();
    const { folderName, projectId, name, description } = body;

    if (!folderName || typeof folderName !== "string") {
      return NextResponse.json({ error: "folderName is required" }, { status: 400 });
    }
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Verify folder exists
    const folderPath = path.join(SANDBOXES_DIR, folderName);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
      return NextResponse.json({ error: "Folder does not exist" }, { status: 400 });
    }

    const pool = getPool();

    // Verify project exists
    const projectCheck = await pool.query(`SELECT id FROM projects WHERE id = $1`, [projectId]);
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if folder is already registered
    const existingCheck = await pool.query(
      `SELECT id FROM sandboxes WHERE folder_name = $1`,
      [folderName]
    );
    if ((existingCheck.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: "Folder is already registered" }, { status: 400 });
    }

    // Generate display name from folder name if not provided
    const displayName = name || folderName
      .split("-")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO sandboxes (id, project_id, name, folder_name, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, projectId, displayName, folderName, description || null, admin.accountId]
    );

    return NextResponse.json({ sandbox: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error registering sandbox:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to register sandbox" }, { status: 500 });
  }
}

// PATCH /api/sandboxes - Update a sandbox (admin only)
// Body: { id, name?, projectId?, description?, isPublic? }
export async function PATCH(request: NextRequest) {
  try {
    await ensureSchema();
    await requireAdmin();

    const body = await request.json();
    const { id, name, projectId, description, isPublic } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const pool = getPool();

    // Check sandbox exists
    const sandboxCheck = await pool.query(`SELECT id FROM sandboxes WHERE id = $1`, [id]);
    if (sandboxCheck.rowCount === 0) {
      return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
    }

    // If projectId is being updated, verify it exists
    if (projectId) {
      const projectCheck = await pool.query(`SELECT id FROM projects WHERE id = $1`, [projectId]);
      if (projectCheck.rowCount === 0) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (projectId !== undefined) {
      updates.push(`project_id = $${paramIndex++}`);
      values.push(projectId);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(Boolean(isPublic));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE sandboxes SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json({ sandbox: result.rows[0] });
  } catch (error) {
    console.error("Error updating sandbox:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update sandbox" }, { status: 500 });
  }
}

// DELETE /api/sandboxes?id=xxx - Unregister a sandbox (admin only)
// Note: This only removes the DB record, not the files
export async function DELETE(request: NextRequest) {
  try {
    await ensureSchema();
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM sandboxes WHERE id = $1 RETURNING id, folder_name`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sandbox unregistered. Files remain in /public/sandboxes/${result.rows[0].folder_name}/`
    });
  } catch (error) {
    console.error("Error unregistering sandbox:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to unregister sandbox" }, { status: 500 });
  }
}
