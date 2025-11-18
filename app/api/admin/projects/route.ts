import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

// GET all projects (admin view)
export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, title, slug, description, year, involvement_type, project_scale, industry,
              outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
              published, featured, sort_order, created_at, updated_at
       FROM past_projects
       ORDER BY sort_order ASC, created_at DESC`
    );
    return NextResponse.json({ projects: result.rows });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

// POST create new project
export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = (await request.json()) as {
      title: string;
      slug: string;
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

    if (!body.title || !body.slug) {
      return NextResponse.json(
        { error: "title and slug are required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const pool = getPool();
    
    await pool.query(
      `INSERT INTO past_projects (
        id, title, slug, description, story, year, involvement_type, project_scale, industry,
        outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
        published, featured, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        id,
        body.title,
        body.slug,
        body.description || null,
        body.story || null,
        body.year || null,
        body.involvement_type || null,
        body.project_scale || null,
        body.industry || null,
        body.outcomes ? JSON.stringify(body.outcomes) : null,
        body.thumbnail_url || null,
        body.images ? JSON.stringify(body.images) : null,
        body.project_url || null,
        body.related_deliverable_ids ? JSON.stringify(body.related_deliverable_ids) : null,
        body.published ?? false,
        body.featured ?? false,
        body.sort_order ?? 0,
      ]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

