import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

// GET - List all links for a sprint
export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify sprint exists and user has access
    const sprintRes = await pool.query(
      `SELECT sd.id, sd.project_id, d.account_id
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
      project_id: string | null; 
      account_id: string | null 
    };

    // Check access: owner, admin, or project member
    const isOwner = sprint.account_id === user.accountId;
    const isAdmin = user.isAdmin;
    
    let isProjectMember = false;
    if (sprint.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [sprint.project_id, user.email]
      );
      isProjectMember = (memberRes.rowCount ?? 0) > 0;
    }

    if (!isOwner && !isAdmin && !isProjectMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Ensure sort_order column exists
    await pool.query(`
      ALTER TABLE sprint_links ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);

    // Fetch links (order by sort_order, then by created_at for links without explicit order)
    const linksRes = await pool.query(
      `SELECT 
        id, name, link_type, url, file_url, file_name, 
        file_size_bytes, mimetype, description, created_at, sort_order
       FROM sprint_links
       WHERE sprint_id = $1
       ORDER BY sort_order ASC, created_at DESC`,
      [params.id]
    );

    const links = linksRes.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      linkType: row.link_type as "url" | "file",
      url: row.url as string | null,
      fileUrl: row.file_url as string | null,
      fileName: row.file_name as string | null,
      fileSizeBytes: row.file_size_bytes ? Number(row.file_size_bytes) : null,
      mimetype: row.mimetype as string | null,
      description: row.description as string | null,
      createdAt: row.created_at as string,
    }));

    return NextResponse.json({ links });
  } catch (err) {
    console.error("[SprintLinks GET]", err);
    return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
  }
}

// POST - Create a new link
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Only admins can add links for now
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Verify sprint exists
    const sprintRes = await pool.query(
      `SELECT id FROM sprint_drafts WHERE id = $1`,
      [params.id]
    );

    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, linkType, url, description } = body as {
      name?: string;
      linkType?: string;
      url?: string;
      description?: string;
    };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (linkType !== "url" && linkType !== "file") {
      return NextResponse.json({ error: "Invalid link type" }, { status: 400 });
    }

    if (linkType === "url" && (!url || typeof url !== "string" || !url.trim())) {
      return NextResponse.json({ error: "URL is required for URL links" }, { status: 400 });
    }

    const linkId = randomUUID();

    await pool.query(
      `INSERT INTO sprint_links (id, sprint_id, name, link_type, url, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        linkId,
        params.id,
        name.trim(),
        linkType,
        linkType === "url" ? url?.trim() : null,
        description?.trim() || null,
        user.accountId,
      ]
    );

    return NextResponse.json({
      success: true,
      link: {
        id: linkId,
        name: name.trim(),
        linkType,
        url: linkType === "url" ? url?.trim() : null,
        description: description?.trim() || null,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[SprintLinks POST]", err);
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }
}

// PATCH - Reorder links
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Verify sprint exists
    const sprintRes = await pool.query(
      `SELECT id FROM sprint_drafts WHERE id = $1`,
      [params.id]
    );

    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { linkIds } = body as { linkIds?: string[] };

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      return NextResponse.json({ error: "linkIds array is required" }, { status: 400 });
    }

    // Ensure sort_order column exists (add if not)
    await pool.query(`
      ALTER TABLE sprint_links ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0
    `);

    // Update sort_order for each link based on position in array
    for (let i = 0; i < linkIds.length; i++) {
      await pool.query(
        `UPDATE sprint_links SET sort_order = $1 WHERE id = $2 AND sprint_id = $3`,
        [i, linkIds[i], params.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SprintLinks PATCH]", err);
    return NextResponse.json({ error: "Failed to reorder links" }, { status: 500 });
  }
}

// DELETE - Remove a link
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
    }

    // Verify link belongs to this sprint
    const linkRes = await pool.query(
      `SELECT id, file_url FROM sprint_links WHERE id = $1 AND sprint_id = $2`,
      [linkId, params.id]
    );

    if (linkRes.rowCount === 0) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // TODO: If it's a file, delete from storage as well
    // const link = linkRes.rows[0];
    // if (link.file_url) { ... delete from GCS ... }

    await pool.query(`DELETE FROM sprint_links WHERE id = $1`, [linkId]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SprintLinks DELETE]", err);
    return NextResponse.json({ error: "Failed to delete link" }, { status: 500 });
  }
}
