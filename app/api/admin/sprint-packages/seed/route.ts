import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * POST /api/admin/sprint-packages/seed
 * Seeds the database with 3 example sprint packages
 * Each package includes 2-3 execution deliverables (NO workshops)
 * Workshops are generated separately by AI after sprint creation
 * Pricing is ALWAYS calculated dynamically from deliverables (base complexity 1.0)
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    // Check if packages already exist
    const existingCheck = await pool.query(
      `SELECT COUNT(*) as count FROM sprint_packages`
    );
    const existingCount = parseInt(existingCheck.rows[0].count);

    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `${existingCount} sprint packages already exist. Skipping seed.`,
        existingCount,
      });
    }

    // Fetch deliverables by name to get their IDs
    const deliverablesQuery = await pool.query(`
      SELECT id, name, fixed_price, fixed_hours 
      FROM deliverables 
      WHERE active = true
    `);
    const deliverables = deliverablesQuery.rows as Array<{
      id: string;
      name: string;
      fixed_price: number | null;
      fixed_hours: number | null;
    }>;

    // Helper to find deliverable by name
    const findDeliverable = (name: string) => {
      const found = deliverables.find((d) => d.name === name);
      if (!found) {
        throw new Error(`Deliverable not found: ${name}`);
      }
      return found;
    };

    // Define the 3 sprint packages
    const packages = [
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Brand Identity Sprint",
        slug: "brand-identity-sprint",
        description: "Perfect for startups and new ventures needing a complete brand foundation. Get a professional logo, typography system, and comprehensive style guide to build your brand consistently across all touchpoints.",
        tagline: "Complete brand foundation in 2 weeks",
        category: "Branding",
        active: true,
        featured: true,
        sort_order: 1,
        deliverables: [
          "Typography Scale + Wordmark Logo",
          "Brand Style Guide",
        ],
      },
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "MVP Launch Sprint",
        slug: "mvp-launch-sprint",
        description: "Validate your product idea with a high-converting landing page and working prototype. Perfect for founders who need to test their concept with users or pitch to investors with something tangible.",
        tagline: "Ship your MVP in 2 weeks",
        category: "Product",
        active: true,
        featured: true,
        sort_order: 2,
        deliverables: [
          "Landing Page (Marketing)",
          "Prototype - Level 1 (Basic)",
        ],
      },
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Startup Branding Sprint",
        slug: "startup-branding-sprint",
        description: "Launch-ready branding package with logo, social media presence, and investor pitch materials. Everything an early-stage startup needs to look professional and pitch with confidence.",
        tagline: "Launch-ready brand + pitch deck",
        category: "Branding",
        active: true,
        featured: true,
        sort_order: 3,
        deliverables: [
          "Typography Scale + Wordmark Logo",
          "Social Media Template Kit",
          "Pitch Deck Template (Branded)",
        ],
      },
    ];

    const createdPackages: Array<{ id: string; name: string; slug: string }> = [];

    // Create each package
    for (const pkg of packages) {
      // Collect deliverables for linking (NO price/hours storage - always dynamic!)
      const packageDeliverables: Array<{
        id: string;
        name: string;
      }> = [];

      for (const deliverableName of pkg.deliverables) {
        try {
          const del = findDeliverable(deliverableName);
          packageDeliverables.push({
            id: del.id,
            name: del.name,
          });
        } catch (error) {
          console.error(
            `[SeedPackages] Warning: ${(error as Error).message} - skipping`
          );
        }
      }

      // Insert package with NULL flat_fee and flat_hours (always calculate dynamically)
      await pool.query(
        `INSERT INTO sprint_packages 
         (id, name, slug, description, tagline, category, flat_fee, flat_hours, active, featured, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`,
        [
          pkg.id,
          pkg.name,
          pkg.slug,
          pkg.description,
          pkg.tagline,
          pkg.category,
          null, // flat_fee = NULL (always calculate)
          null, // flat_hours = NULL (always calculate)
          pkg.active,
          pkg.featured,
          pkg.sort_order,
        ]
      );

      // Link deliverables to package (with base complexity 1.0)
      for (let i = 0; i < packageDeliverables.length; i++) {
        const del = packageDeliverables[i];
        const junctionId = `pkgdel-${randomBytes(8).toString("hex")}`;
        await pool.query(
          `INSERT INTO sprint_package_deliverables 
           (id, sprint_package_id, deliverable_id, quantity, sort_order, notes, complexity_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [junctionId, pkg.id, del.id, 1, i, null, 1.0]
        );
      }

      createdPackages.push({
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdPackages.length} sprint packages`,
      count: createdPackages.length,
      packages: createdPackages,
    });
  } catch (error) {
    console.error("[SeedPackages] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

