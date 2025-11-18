import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

type Params = {
  params: { id: string };
};

// GET single project
export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, title, slug, description, story, year, involvement_type, project_scale, industry,
              outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
              published, featured, sort_order, created_at, updated_at
       FROM past_projects
       WHERE id = $1`,
      [params.id]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: result.rows[0] });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH update project
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      description?: string;
      story?: string;
      year?: number;
      involvement_type?: string;
      project_scale?: string;
      industry?: string;
      outcomes?: unknown;
      thumbnail_url?: string;
      images?: unknown;
      project_url?: string;
      related_deliverable_ids?: unknown;
      published?: boolean;
      featured?: boolean;
      sort_order?: number;
    };

    const pool = getPool();
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(body.title);
    }
    if (body.slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(body.slug);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(body.description || null);
    }
    if (body.story !== undefined) {
      updates.push(`story = $${paramCount++}`);
      values.push(body.story || null);
    }
    if (body.year !== undefined) {
      updates.push(`year = $${paramCount++}`);
      values.push(body.year || null);
    }
    if (body.involvement_type !== undefined) {
      updates.push(`involvement_type = $${paramCount++}`);
      values.push(body.involvement_type || null);
    }
    if (body.project_scale !== undefined) {
      updates.push(`project_scale = $${paramCount++}`);
      values.push(body.project_scale || null);
    }
    if (body.industry !== undefined) {
      updates.push(`industry = $${paramCount++}`);
      values.push(body.industry || null);
    }
    if (body.outcomes !== undefined) {
      updates.push(`outcomes = $${paramCount++}::jsonb`);
      values.push(body.outcomes ? JSON.stringify(body.outcomes) : null);
    }
    if (body.thumbnail_url !== undefined) {
      updates.push(`thumbnail_url = $${paramCount++}`);
      values.push(body.thumbnail_url || null);
    }
    if (body.images !== undefined) {
      updates.push(`images = $${paramCount++}::jsonb`);
      values.push(body.images ? JSON.stringify(body.images) : null);
    }
    if (body.project_url !== undefined) {
      updates.push(`project_url = $${paramCount++}`);
      values.push(body.project_url || null);
    }
    if (body.related_deliverable_ids !== undefined) {
      updates.push(`related_deliverable_ids = $${paramCount++}::jsonb`);
      values.push(body.related_deliverable_ids ? JSON.stringify(body.related_deliverable_ids) : null);
    }
    if (body.published !== undefined) {
      updates.push(`published = $${paramCount++}`);
      values.push(body.published);
    }
    if (body.featured !== undefined) {
      updates.push(`featured = $${paramCount++}`);
      values.push(body.featured);
    }
    if (body.sort_order !== undefined) {
      updates.push(`sort_order = $${paramCount++}`);
      values.push(body.sort_order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date().toISOString());
    values.push(params.id);

    const result = await pool.query(
      `UPDATE past_projects SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: params.id });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE project
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM past_projects WHERE id = $1 RETURNING id`,
      [params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

