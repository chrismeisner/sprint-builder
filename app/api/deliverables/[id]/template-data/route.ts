import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string };
};

/**
 * PATCH /api/deliverables/[id]/template-data
 * 
 * Update a deliverable's template data (default structure for this deliverable type)
 * Admin only.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!currentUser.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { templateData } = body;

    // templateData can be null (to clear), or an object
    if (templateData !== null && typeof templateData !== "object") {
      return NextResponse.json({ error: "templateData must be an object or null" }, { status: 400 });
    }

    const updateResult = await pool.query(
      `UPDATE deliverables 
       SET template_data = $1::jsonb, updated_at = NOW()
       WHERE id = $2
       RETURNING id, template_data, name, slug`,
      [templateData ? JSON.stringify(templateData) : null, params.id]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      deliverable: {
        id: updateResult.rows[0].id,
        templateData: updateResult.rows[0].template_data,
        name: updateResult.rows[0].name,
        slug: updateResult.rows[0].slug,
      },
    });
  } catch (error: unknown) {
    console.error("Error updating deliverable template data:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deliverables/[id]/template-data
 * 
 * Get a deliverable's template data
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const result = await pool.query(
      `SELECT id, name, slug, template_data
       FROM deliverables
       WHERE id = $1 OR slug = $1
       LIMIT 1`,
      [params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      name: row.name,
      slug: row.slug,
      templateData: row.template_data,
    });
  } catch (error: unknown) {
    console.error("Error fetching deliverable template data:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

