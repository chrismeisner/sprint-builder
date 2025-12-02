import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * Seed the "Boilerplate Branding Sprint" package
 * This is the foundational branding sprint that all clients go through
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    // First, get the workshop and deliverable IDs
    const workshopResult = await pool.query(
      `SELECT id FROM deliverables 
       WHERE name = 'Branding Workshop (3 hours)' 
       AND deliverable_type = 'workshop' 
       AND active = true 
       LIMIT 1`
    );

    if (workshopResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Branding workshop not found. Please seed workshops first using POST /api/admin/deliverables/seed-workshops",
        },
        { status: 400 }
      );
    }

    const workshopId = workshopResult.rows[0].id;

    // Get the branding deliverables
    const deliverablesResult = await pool.query(
      `SELECT id, name, fixed_hours, fixed_price 
       FROM deliverables 
       WHERE name IN ('Wordmark Logo', 'Color Palette (Primary + Secondary)', 'Brand Moodboard')
       AND deliverable_type = 'standard'
       AND active = true`
    );

    if (deliverablesResult.rowCount !== 3) {
      return NextResponse.json(
        {
          success: false,
          error: `Expected 3 branding deliverables, found ${deliverablesResult.rowCount}. Please seed branding deliverables first using POST /api/admin/deliverables/seed-branding`,
        },
        { status: 400 }
      );
    }

    const deliverables = deliverablesResult.rows;
    const wordmarkId = deliverables.find((d: { name: string }) => d.name === "Wordmark Logo")?.id;
    const colorsId = deliverables.find((d: { name: string }) => d.name === "Color Palette (Primary + Secondary)")?.id;
    const moodboardId = deliverables.find((d: { name: string }) => d.name === "Brand Moodboard")?.id;

    // Create the package
    const packageId = crypto.randomUUID();
    const slug = "boilerplate-branding";

    await pool.query(
      `INSERT INTO sprint_packages (
        id, name, slug, description, category, tagline,
        flat_fee, flat_hours, active, featured, sort_order,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        tagline = EXCLUDED.tagline,
        flat_fee = EXCLUDED.flat_fee,
        flat_hours = EXCLUDED.flat_hours,
        active = EXCLUDED.active,
        featured = EXCLUDED.featured,
        sort_order = EXCLUDED.sort_order,
        updated_at = now()
      RETURNING id`,
      [
        packageId,
        "Boilerplate Branding Sprint",
        slug,
        "Essential foundational branding for all new clients. This 2-week sprint establishes your core brand identity with a strategic workshop, professional wordmark logo, complete color system, and visual direction moodboard. Perfect for startups and businesses launching their brand.",
        "Branding",
        "Foundation branding essentials for all new clients",
        null, // flat_fee = NULL (dynamic pricing)
        null, // flat_hours = NULL (dynamic hours)
        true, // active
        true, // featured (make it the default)
        0, // sort_order (show first)
      ]
    );

    // Get the actual package ID (in case of conflict/update)
    const pkgResult = await pool.query(
      `SELECT id FROM sprint_packages WHERE slug = $1`,
      [slug]
    );
    const actualPackageId = pkgResult.rows[0].id;

    // Delete existing deliverables for this package (in case of re-seed)
    await pool.query(
      `DELETE FROM sprint_package_deliverables WHERE sprint_package_id = $1`,
      [actualPackageId]
    );

    // Link deliverables to package (in order: workshop, wordmark, colors, moodboard)
    const packageDeliverables = [
      { deliverableId: workshopId, sortOrder: 0 },
      { deliverableId: wordmarkId, sortOrder: 1 },
      { deliverableId: colorsId, sortOrder: 2 },
      { deliverableId: moodboardId, sortOrder: 3 },
    ];

    for (const item of packageDeliverables) {
      await pool.query(
        `INSERT INTO sprint_package_deliverables (
          id, sprint_package_id, deliverable_id, quantity, complexity_score, sort_order, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, now())`,
        [
          crypto.randomUUID(),
          actualPackageId,
          item.deliverableId,
          1, // quantity
          1.0, // base complexity
          item.sortOrder,
        ]
      );
    }

    // Calculate totals
    const totalsResult = await pool.query(
      `SELECT 
        SUM(d.fixed_price * spd.quantity * spd.complexity_score) as total_price,
        SUM(d.fixed_hours * spd.quantity * spd.complexity_score) as total_hours,
        SUM(d.default_estimate_points) as total_points
       FROM sprint_package_deliverables spd
       JOIN deliverables d ON spd.deliverable_id = d.id
       WHERE spd.sprint_package_id = $1`,
      [actualPackageId]
    );

    const totals = totalsResult.rows[0];

    return NextResponse.json({
      success: true,
      message: "Boilerplate Branding Sprint package created successfully",
      package: {
        id: actualPackageId,
        name: "Boilerplate Branding Sprint",
        slug: slug,
        totalPrice: parseFloat(totals.total_price),
        totalHours: parseFloat(totals.total_hours),
        totalPoints: parseInt(totals.total_points),
        featured: true,
      },
      deliverables: [
        { name: "Branding Workshop (3 hours)", hours: 3, price: 600 },
        { name: "Wordmark Logo", hours: 8, price: 1200 },
        { name: "Color Palette", hours: 4, price: 600 },
        { name: "Brand Moodboard", hours: 3, price: 450 },
      ],
    });
  } catch (error: unknown) {
    console.error("Error seeding boilerplate branding package:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}













