import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * POST /api/admin/sprint-packages/seed
 * Seeds/updates the default sprint packages (Foundation + Extend)
 * Packages always calculate pricing dynamically from linked deliverables
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

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

    type PackageDefinition = {
      id: string;
      name: string;
      slug: string;
      description: string;
      tagline: string;
      category: string;
      packageType: "foundation" | "extend";
      active: boolean;
      featured: boolean;
      sortOrder: number;
      deliverables: Array<{
        name: string;
        quantity?: number;
        complexity?: number;
        notes?: string | null;
      }>;
    };

    // Define Foundation + Extend Sprint Packages
    const packages: PackageDefinition[] = [
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Branding Foundations Sprint",
        slug: "branding-foundations-sprint",
        description: "Perfect for new clients starting their brand journey. Begin with our Foundation Workshop to align on goals and strategy, then we'll deliver a complete brand identity system including logo, typography, colors, and comprehensive guidelines.",
        tagline: "Your brand foundation in 2 weeks",
        category: "Branding",
        packageType: "foundation",
        active: true,
        featured: true,
        sortOrder: 1,
        deliverables: [
          { name: "Foundation Workshop (3 hours)" },
          { name: "Typography Scale + Wordmark Logo" },
          { name: "Brand Style Guide" },
        ],
      },
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Product Foundations Sprint",
        slug: "product-foundations-sprint",
        description: "Perfect for new clients launching a product or feature. Start with our Foundation Workshop to validate direction and priorities, then we'll build a high-converting landing page and interactive prototype to test with users.",
        tagline: "Validate and launch in 2 weeks",
        category: "Product",
        packageType: "foundation",
        active: true,
        featured: true,
        sortOrder: 2,
        deliverables: [
          { name: "Foundation Workshop (3 hours)" },
          { name: "Landing Page (Marketing)" },
          { name: "Prototype - Level 1 (Basic)" },
        ],
      },
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Investor Deck Extend Sprint",
        slug: "investor-deck-extend-sprint",
        description: "For returning brand clients who need an investor-ready story fast. We realign in a Mini Foundation Workshop, then ship a full deck polish plus supporting assets so you can run your fundraise with confidence.",
        tagline: "Investor story + deck in 10 working days",
        category: "Brand Extend",
        packageType: "extend",
        active: true,
        featured: false,
        sortOrder: 3,
        deliverables: [
          { name: "Mini Foundation Workshop (1 hour)" },
          { name: "Pitch Deck Template (Branded)" },
          { name: "Executive Summary One-Pager" },
          { name: "Investor Metrics + FAQ Addendum" },
        ],
      },
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Launch Landing Page Extend Sprint",
        slug: "launch-landing-page-extend-sprint",
        description: "Need a quick hype cycle or coming soon moment? This extend sprint gives you a single-scroll launch page, automated waitlist, and ready-to-post announcements so you can start collecting demand immediately.",
        tagline: "Coming soon page + hype kit",
        category: "Brand Extend",
        packageType: "extend",
        active: true,
        featured: false,
        sortOrder: 4,
        deliverables: [
          { name: "Mini Foundation Workshop (1 hour)" },
          { name: "Coming Soon Landing Page" },
          { name: "Email Waitlist Automation" },
          { name: "Launch Announcement Toolkit" },
        ],
      },
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Browser MVP Prototype Extend Sprint",
        slug: "browser-mvp-prototype-extend-sprint",
        description: "Turn a validated idea into a browser-based MVP prototype. We create interactive flows, capture implementation notes, and set you up with a test plan so you can validate the concept within days.",
        tagline: "Clickable MVP + handoff plan",
        category: "Product Extend",
        packageType: "extend",
        active: true,
        featured: false,
        sortOrder: 5,
        deliverables: [
          { name: "Mini Foundation Workshop (1 hour)" },
          { name: "Prototype - Level 2 (Interactive)" },
          { name: "Interaction Spec & Build Plan" },
          { name: "Usability Test Script & Plan" },
        ],
      },
      {
        id: `pkg-${randomBytes(8).toString("hex")}`,
        name: "Prototype Iteration Extend Sprint",
        slug: "prototype-iteration-extend-sprint",
        description: "Add depth to your existing prototype or refine a new feature based on feedback. We integrate prioritized notes, up-level the UX, and ship polished release notes so your team knows exactly what changed.",
        tagline: "Refine flows + ship the update",
        category: "Product Extend",
        packageType: "extend",
        active: true,
        featured: false,
        sortOrder: 6,
        deliverables: [
          { name: "Mini Foundation Workshop (1 hour)" },
          { name: "Prototype Feedback Integration" },
          { name: "Feature Flow Refinement" },
          { name: "Release Notes & Loom Demo" },
        ],
      },
    ];

    const createdPackages: Array<{
      id: string;
      name: string;
      slug: string;
      packageType: string;
    }> = [];

    // Create each package
    for (const pkg of packages) {
      const packageDeliverables = pkg.deliverables.map((item, index) => {
        const deliverable = findDeliverable(item.name);
        const complexity = item.complexity ?? 1.0;
        return {
          deliverableId: deliverable.id,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? null,
          sortOrder: index,
          complexityScore: Math.max(1.0, Math.min(5.0, complexity)),
        };
      });

      // Insert or update package with NULL flat fee/hours (always dynamic)
      const upsertResult = await pool.query(
        `INSERT INTO sprint_packages 
         (id, name, slug, description, tagline, category, package_type, flat_fee, flat_hours, active, featured, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           tagline = EXCLUDED.tagline,
           category = EXCLUDED.category,
           package_type = EXCLUDED.package_type,
           active = EXCLUDED.active,
           featured = EXCLUDED.featured,
           sort_order = EXCLUDED.sort_order,
           updated_at = now()
         RETURNING id`,
        [
          pkg.id,
          pkg.name,
          pkg.slug,
          pkg.description,
          pkg.tagline,
          pkg.category,
          pkg.packageType,
          null,
          null,
          pkg.active,
          pkg.featured,
          pkg.sortOrder,
        ]
      );

      const packageId = upsertResult.rows[0].id;

      // Reset deliverables for deterministic ordering
      await pool.query(
        `DELETE FROM sprint_package_deliverables WHERE sprint_package_id = $1`,
        [packageId]
      );

      for (const del of packageDeliverables) {
        const junctionId = `pkgdel-${randomBytes(8).toString("hex")}`;
        await pool.query(
          `INSERT INTO sprint_package_deliverables 
           (id, sprint_package_id, deliverable_id, quantity, sort_order, notes, complexity_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            junctionId,
            packageId,
            del.deliverableId,
            del.quantity,
            del.sortOrder,
            del.notes,
            del.complexityScore,
          ]
        );
      }

      createdPackages.push({
        id: packageId,
        name: pkg.name,
        slug: pkg.slug,
        packageType: pkg.packageType,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Upserted ${createdPackages.length} sprint packages`,
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

