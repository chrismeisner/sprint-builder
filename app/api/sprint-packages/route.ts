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
        sp.pricing_mode,
        sp.flat_fee,
        sp.flat_hours,
        sp.base_rate,
        sp.package_type,
        sp.duration_weeks,
        sp.requires_package_type,
        sp.requires_package_id,
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
      pricingMode,
      packageType,
      durationWeeks,
      requiresPackageType,
      requiresPackageId,
      flatFee,
      baseRate,
      deliverables,
    } = body as {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
      tagline?: unknown;
      emoji?: unknown;
      active?: unknown;
      sortOrder?: unknown;
      pricingMode?: unknown;
      packageType?: unknown;
      durationWeeks?: unknown;
      requiresPackageType?: unknown;
      requiresPackageId?: unknown;
      flatFee?: unknown;
      baseRate?: unknown;
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
    const pricingModeValue =
      pricingMode === "flat" || pricingMode === "calculated" ? pricingMode : "calculated";
    const flatFeeNum = Number(flatFee);
    const flatFeeValue = Number.isFinite(flatFeeNum) && flatFeeNum > 0 ? flatFeeNum : null;
    if (pricingModeValue === "flat" && flatFeeValue == null) {
      return NextResponse.json({ error: "Flat fee is required in flat pricing mode" }, { status: 400 });
    }
    const baseRateNum = Number(baseRate);
    const baseRateValue = Number.isFinite(baseRateNum) && baseRateNum > 0 ? baseRateNum : null;
    const packageTypeValue =
      packageType === "expansion_cycle" ||
      packageType === "standard_sprint" ||
      packageType === "foundation" ||
      packageType === "extend"
        ? packageType
        : "standard_sprint";
    if (packageTypeValue === "expansion_cycle" && pricingModeValue !== "flat") {
      return NextResponse.json(
        { error: "Expansion cycles must use flat pricing mode" },
        { status: 400 }
      );
    }
    const durationWeeksNum = Number(durationWeeks);
    const durationWeeksValue =
      packageTypeValue === "expansion_cycle"
        ? 1
        : (Number.isFinite(durationWeeksNum) && durationWeeksNum >= 1 && durationWeeksNum <= 52
            ? Math.round(durationWeeksNum)
            : 2);
    const requiresPackageTypeValue =
      typeof requiresPackageType === "string" && requiresPackageType.trim().length > 0
        ? requiresPackageType.trim()
        : null;
    const requiresPackageIdValue =
      typeof requiresPackageId === "string" && requiresPackageId.trim().length > 0
        ? requiresPackageId.trim()
        : null;
    const emojiValue =
      typeof emoji === "string" && emoji.trim().length > 0 ? emoji.trim() : null;
    // Insert package
    await pool.query(
      `
      INSERT INTO sprint_packages (
        id, name, slug, description, tagline, emoji,
        active, sort_order, pricing_mode, package_type, duration_weeks, requires_package_type, requires_package_id, flat_fee, base_rate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
        pricingModeValue,
        packageTypeValue,
        durationWeeksValue,
        requiresPackageTypeValue,
        requiresPackageIdValue,
        flatFeeValue,
        baseRateValue,
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

