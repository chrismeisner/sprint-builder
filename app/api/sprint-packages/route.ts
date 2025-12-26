import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * GET /api/sprint-packages
 * List all sprint packages with their deliverables
 * Query params:
 *   - includeInactive: 'true' to include inactive packages
 *   - featured: 'true' to only get featured packages
 */
export async function GET(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Build WHERE clause
    const conditions: string[] = [];
    if (!includeInactive) conditions.push("sp.active = true");
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Fetch packages with aggregated deliverable data
    const result = await pool.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.tagline,
        sp.emoji,
        sp.active,
        sp.sort_order,
        sp.created_at,
        sp.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'deliverableId', d.id,
              'name', d.name,
              'description', d.description,
              'category', d.category,
              'scope', d.scope,
              'points', d.points,
              'quantity', spd.quantity,
              'sortOrder', spd.sort_order
            ) ORDER BY spd.sort_order ASC, d.name ASC
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) as deliverables
      FROM sprint_packages sp
      LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
      LEFT JOIN deliverables d ON spd.deliverable_id = d.id
      ${whereClause}
      GROUP BY sp.id
      ORDER BY sp.sort_order ASC, sp.name ASC
    `);

    return NextResponse.json({ packages: result.rows });
  } catch (error: unknown) {
    console.error("[SprintPackagesAPI] GET error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sprint-packages
 * Create a new sprint package with deliverables
 * Body: {
 *   name: string,
 *   slug: string,
 *   description?: string,
 *   tagline?: string,
 *   active?: boolean,
 *   sortOrder?: number,
 *   deliverables?: Array<{ deliverableId: string, quantity?: number, sortOrder?: number }>
 * }
 */
export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    const body = (await request.json().catch(() => ({}))) as unknown;
    
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      name,
      slug,
      description,
      tagline,
      emoji,
      active,
      sortOrder,
      deliverables,
    } = body as {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
      tagline?: unknown;
      emoji?: unknown;
      active?: unknown;
      sortOrder?: unknown;
      deliverables?: unknown;
    };

    // Validate required fields
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    let order: number = 0;
    if (typeof sortOrder === "number") {
      order = sortOrder;
    } else if (typeof sortOrder === "string" && sortOrder.trim()) {
      const parsed = Number(sortOrder);
      if (!Number.isNaN(parsed)) order = parsed;
    }

    const id = crypto.randomUUID();
    const activeValue = typeof active === "boolean" ? active : true;
    const emojiValue =
      typeof emoji === "string" && emoji.trim().length > 0 ? emoji.trim() : null;
    // Insert package
    await pool.query(
      `
      INSERT INTO sprint_packages (
        id, name, slug, description, tagline, emoji,
        active, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
      [
        id,
        name.trim(),
        slug.trim(),
        typeof description === "string" ? description : null,
        typeof tagline === "string" ? tagline : null,
        emojiValue,
        activeValue,
        order,
      ]
    );

    // Link deliverables if provided
    if (Array.isArray(deliverables) && deliverables.length > 0) {
      for (let i = 0; i < deliverables.length; i++) {
        const d = deliverables[i];
        if (d && typeof d === "object" && "deliverableId" in d) {
          const delId = (d as { deliverableId?: unknown }).deliverableId;
          const qty = (d as { quantity?: unknown }).quantity;
          const delSortOrder = (d as { sortOrder?: unknown }).sortOrder;

          if (typeof delId === "string" && delId.trim()) {
            const quantity = typeof qty === "number" ? qty : 1;
            const delOrder = typeof delSortOrder === "number" ? delSortOrder : i;
            
            const junctionId = crypto.randomUUID();
            await pool.query(
              `
              INSERT INTO sprint_package_deliverables (
                id, sprint_package_id, deliverable_id, quantity, sort_order
              )
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (sprint_package_id, deliverable_id) DO NOTHING
            `,
              [
                junctionId,
                id,
                delId,
                quantity,
                delOrder,
              ]
            );
          }
        }
      }
    }

    return NextResponse.json({ id, slug: slug.trim() }, { status: 201 });
  } catch (error: unknown) {
    console.error("[SprintPackagesAPI] POST error:", error);
    
    // Handle unique constraint violation (duplicate slug)
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json(
        { error: "A package with this slug already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

