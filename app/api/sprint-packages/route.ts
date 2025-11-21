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
    const featuredOnly = searchParams.get("featured") === "true";

    // Build WHERE clause
    const conditions: string[] = [];
    if (!includeInactive) conditions.push("sp.active = true");
    if (featuredOnly) conditions.push("sp.featured = true");
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Fetch packages with aggregated deliverable data
    const result = await pool.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.category,
        sp.tagline,
        sp.flat_fee,
        sp.flat_hours,
        sp.active,
        sp.featured,
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
              'fixedHours', d.fixed_hours,
              'fixedPrice', d.fixed_price,
              'defaultEstimatePoints', d.default_estimate_points,
              'quantity', spd.quantity,
              'notes', spd.notes,
              'sortOrder', spd.sort_order,
              'complexityScore', COALESCE(spd.complexity_score, 2.5)
            ) ORDER BY spd.sort_order ASC, d.name ASC
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) as deliverables
      FROM sprint_packages sp
      LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
      LEFT JOIN deliverables d ON spd.deliverable_id = d.id
      ${whereClause}
      GROUP BY sp.id
      ORDER BY sp.featured DESC, sp.sort_order ASC, sp.name ASC
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
 *   category?: string,
 *   tagline?: string,
 *   flatFee?: number,
 *   flatHours?: number,
 *   discountPercentage?: number,
 *   active?: boolean,
 *   featured?: boolean,
 *   sortOrder?: number,
 *   deliverables?: Array<{ deliverableId: string, quantity?: number, notes?: string, sortOrder?: number, complexityScore?: number }>
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
      category,
      tagline,
      flatFee,
      flatHours,
      discountPercentage,
      active,
      featured,
      sortOrder,
      deliverables,
    } = body as {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
      category?: unknown;
      tagline?: unknown;
      flatFee?: unknown;
      flatHours?: unknown;
      discountPercentage?: unknown;
      active?: unknown;
      featured?: unknown;
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

    // Parse optional numeric fields
    let fee: number | null = null;
    if (typeof flatFee === "number") {
      fee = flatFee;
    } else if (typeof flatFee === "string" && flatFee.trim()) {
      const parsed = Number(flatFee);
      if (!Number.isNaN(parsed)) fee = parsed;
    }

    let hours: number | null = null;
    if (typeof flatHours === "number") {
      hours = flatHours;
    } else if (typeof flatHours === "string" && flatHours.trim()) {
      const parsed = Number(flatHours);
      if (!Number.isNaN(parsed)) hours = parsed;
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
    const featuredValue = typeof featured === "boolean" ? featured : false;

    // Insert package
    await pool.query(
      `
      INSERT INTO sprint_packages (
        id, name, slug, description, category, tagline, 
        flat_fee, flat_hours,
        active, featured, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
      [
        id,
        name.trim(),
        slug.trim(),
        typeof description === "string" ? description : null,
        typeof category === "string" ? category : null,
        typeof tagline === "string" ? tagline : null,
        fee,     // NULL = dynamic pricing
        hours,   // NULL = dynamic hours
        activeValue,
        featuredValue,
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
          const notes = (d as { notes?: unknown }).notes;
          const delSortOrder = (d as { sortOrder?: unknown }).sortOrder;
          const complexityScore = (d as { complexityScore?: unknown }).complexityScore;

          if (typeof delId === "string" && delId.trim()) {
            const quantity = typeof qty === "number" ? qty : 1;
            const delOrder = typeof delSortOrder === "number" ? delSortOrder : i;
            
            // Parse complexity score (1-5, default 2.5)
            let complexity = 2.5;
            if (typeof complexityScore === "number") {
              complexity = Math.max(1.0, Math.min(5.0, complexityScore));
            } else if (typeof complexityScore === "string") {
              const parsed = parseFloat(complexityScore);
              if (!isNaN(parsed)) {
                complexity = Math.max(1.0, Math.min(5.0, parsed));
              }
            }
            
            const junctionId = crypto.randomUUID();
            await pool.query(
              `
              INSERT INTO sprint_package_deliverables (
                id, sprint_package_id, deliverable_id, quantity, notes, sort_order, complexity_score
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (sprint_package_id, deliverable_id) DO NOTHING
            `,
              [
                junctionId,
                id,
                delId,
                quantity,
                typeof notes === "string" ? notes : null,
                delOrder,
                complexity,
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

