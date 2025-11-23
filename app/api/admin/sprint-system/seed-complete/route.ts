import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * Complete seed script for the modular sprint system
 * 
 * Creates:
 * 1. ONE universal Brand Sprint Workshop (3h)
 * 2. Foundation Branding Sprint deliverables
 * 3. Foundation Product Sprint deliverables
 * 4. Two foundation packages (Branding + Product) WITH workshop
 * 5. Follow-on sprint packages WITHOUT workshop
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    const results = {
      workshop: null as any,
      brandingDeliverables: [] as any[],
      productDeliverables: [] as any[],
      foundationPackages: [] as any[],
      followOnPackages: [] as any[],
    };

    // ============================================
    // 1. UNIVERSAL BRAND SPRINT WORKSHOP
    // ============================================
    
    const workshopId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO deliverables (
        id, name, description, scope, category, deliverable_type,
        default_estimate_points, fixed_hours, fixed_price, active,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        scope = EXCLUDED.scope,
        updated_at = now()`,
      [
        workshopId,
        "Brand Sprint Workshop (3 hours)",
        "Universal strategic foundation based on Google Ventures Brand Sprint. Required for all new clients. One-time session that creates the source of truth for all future work.",
        `• Vision & long-term direction
• What/How/Why (purpose, value, differentiation)
• Top audiences & ICP definition
• Core values alignment
• Personality & tone exploration
• Competitive landscape mapping
• Founder alignment & strategic clarity
• Creates universal foundation for both brand and product work`,
        "Workshop",
        "workshop",
        5, // story points
        3.0, // hours
        600, // price
        true,
      ]
    );

    results.workshop = {
      id: workshopId,
      name: "Brand Sprint Workshop (3 hours)",
      hours: 3,
      price: 600,
      points: 5,
    };

    // ============================================
    // 2. BRANDING EXECUTION DELIVERABLES
    // ============================================

    const brandingDeliverables = [
      {
        id: crypto.randomUUID(),
        name: "Wordmark Logo Direction",
        description: "Professional wordmark logo with multiple directions and refinement",
        scope: `• 3 initial wordmark concepts
• Exploration of typography and letterform
• 2 rounds of refinement on selected direction
• Final logo files (SVG, PNG, EPS)
• Black, white, and color variations
• Usage guidelines (minimum size, clear space)`,
        category: "Branding",
        points: 8,
        hours: 8.0,
        price: 1200,
      },
      {
        id: crypto.randomUUID(),
        name: "Visual Moodboards (2-3 boards)",
        description: "Curated visual direction boards exploring different aesthetic approaches",
        scope: `• 2-3 distinct visual direction boards
• Photography and imagery style exploration
• Typography and font pairing examples
• Color palette inspiration per board
• Texture and pattern references
• Competitive analysis integration
• Presentation-ready format for alignment`,
        category: "Branding",
        points: 5,
        hours: 6.0,
        price: 900,
      },
      {
        id: crypto.randomUUID(),
        name: "Brand Personality & Tone Guide",
        description: "Clear articulation of brand voice, personality, and communication style",
        scope: `• Brand personality definition (3-5 key traits)
• Voice and tone guidelines
• Do's and Don'ts for communication
• Example messaging in different contexts
• Brand adjectives and descriptors
• Writing style guide basics`,
        category: "Branding",
        points: 5,
        hours: 5.0,
        price: 750,
      },
      {
        id: crypto.randomUUID(),
        name: "Visual Language Starter Kit",
        description: "Foundational visual system including colors, typography, and basic elements",
        scope: `• Primary color palette (2-3 colors)
• Secondary/accent colors (2-3 colors)
• Typography scale and hierarchy
• Font pairing recommendations
• Basic graphic elements and shapes
• Photography/imagery style direction
• Usage guidelines and examples`,
        category: "Branding",
        points: 8,
        hours: 8.0,
        price: 1200,
      },
      {
        id: crypto.randomUUID(),
        name: "Brand Narrative & Messaging Pillars",
        description: "Core messaging framework with key narratives and positioning statements",
        scope: `• Brand positioning statement
• Core messaging pillars (3-5 key messages)
• Elevator pitch variations
• Value proposition articulation
• Target audience messaging
• Differentiation narrative
• Key talking points document`,
        category: "Branding",
        points: 8,
        hours: 7.0,
        price: 1050,
      },
    ];

    // Insert branding deliverables
    for (const del of brandingDeliverables) {
      await pool.query(
        `INSERT INTO deliverables (
          id, name, description, scope, category, deliverable_type,
          default_estimate_points, fixed_hours, fixed_price, active,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'standard', $6, $7, $8, true, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          scope = EXCLUDED.scope,
          updated_at = now()`,
        [del.id, del.name, del.description, del.scope, del.category, del.points, del.hours, del.price]
      );

      results.brandingDeliverables.push({
        id: del.id,
        name: del.name,
        hours: del.hours,
        price: del.price,
        points: del.points,
      });
    }

    // ============================================
    // 3. PRODUCT EXECUTION DELIVERABLES
    // ============================================

    const productDeliverables = [
      {
        id: crypto.randomUUID(),
        name: "ICP & Proto-Personas",
        description: "Ideal Customer Profile definition with detailed proto-personas for primary users",
        scope: `• ICP definition (demographic, psychographic, behavioral)
• 2-3 proto-personas with details
• User goals, pain points, and motivations
• Jobs-to-be-done mapping
• User context and scenarios
• Persona cards (presentation format)`,
        category: "Product",
        points: 8,
        hours: 8.0,
        price: 1200,
      },
      {
        id: crypto.randomUUID(),
        name: "User Journey Map",
        description: "Comprehensive mapping of user experience across key touchpoints and phases",
        scope: `• End-to-end user journey visualization
• Key phases and stages identified
• Touchpoints and interactions mapped
• Pain points and opportunities highlighted
• Emotional arc and experience quality
• Moments of truth identified
• Journey map document (visual format)`,
        category: "Product",
        points: 8,
        hours: 8.0,
        price: 1200,
      },
      {
        id: crypto.randomUUID(),
        name: "Core Product Principles",
        description: "Foundational product principles that guide design and development decisions",
        scope: `• 5-7 core product principles
• Rationale for each principle
• Example applications of principles
• Decision-making framework
• Trade-off guidance
• Product values alignment
• Principles document for team reference`,
        category: "Product",
        points: 5,
        hours: 5.0,
        price: 750,
      },
      {
        id: crypto.randomUUID(),
        name: "Feature Hierarchy & Roadmap",
        description: "Prioritized feature list with MVP scope and phased roadmap",
        scope: `• Complete feature inventory
• MoSCoW prioritization (Must/Should/Could/Won't)
• MVP feature set definition
• Phase 1, 2, 3 roadmap
• Feature dependencies mapped
• Effort estimates (T-shirt sizing)
• Roadmap visualization`,
        category: "Product",
        points: 8,
        hours: 8.0,
        price: 1200,
      },
      {
        id: crypto.randomUUID(),
        name: "Early Navigation & UX Flows",
        description: "Core navigation structure and primary user flows for key actions",
        scope: `• Information architecture (IA) structure
• Primary navigation design
• 3-5 key user flows mapped
• Screen states and transitions
• Input/output identification
• Flow diagrams (visual format)
• Navigation patterns and conventions`,
        category: "Product",
        points: 10,
        hours: 10.0,
        price: 1500,
      },
    ];

    // Insert product deliverables
    for (const del of productDeliverables) {
      await pool.query(
        `INSERT INTO deliverables (
          id, name, description, scope, category, deliverable_type,
          default_estimate_points, fixed_hours, fixed_price, active,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'standard', $6, $7, $8, true, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          scope = EXCLUDED.scope,
          updated_at = now()`,
        [del.id, del.name, del.description, del.scope, del.category, del.points, del.hours, del.price]
      );

      results.productDeliverables.push({
        id: del.id,
        name: del.name,
        hours: del.hours,
        price: del.price,
        points: del.points,
      });
    }

    // ============================================
    // 4. FOUNDATION PACKAGES (WITH WORKSHOP)
    // ============================================

    // Foundation Branding Sprint
    const foundationBrandingId = crypto.randomUUID();
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
        foundationBrandingId,
        "Foundation Branding Sprint",
        "foundation-branding",
        "Complete foundation for early-stage founders establishing their brand identity. Includes the required 3-hour Brand Sprint Workshop PLUS core branding deliverables. This is your first sprint - perfect for translating strategy into visual and verbal brand expression.",
        "Branding",
        "Workshop + Brand Identity (Your First Sprint)",
        null, // dynamic pricing
        null, // dynamic hours
        true,
        true, // featured
        1, // sort order (show first)
      ]
    );

    // Get actual package ID (in case of conflict)
    const foundationBrandingResult = await pool.query(
      `SELECT id FROM sprint_packages WHERE slug = 'foundation-branding'`
    );
    const actualFoundationBrandingId = foundationBrandingResult.rows[0].id;

    // Delete existing deliverables for this package
    await pool.query(
      `DELETE FROM sprint_package_deliverables WHERE sprint_package_id = $1`,
      [actualFoundationBrandingId]
    );

    // Link deliverables (workshop + 4 branding deliverables)
    const foundationBrandingLinks = [
      { deliverableId: workshopId, sortOrder: 0 }, // Workshop first!
      { deliverableId: brandingDeliverables[0].id, sortOrder: 1 }, // Wordmark
      { deliverableId: brandingDeliverables[1].id, sortOrder: 2 }, // Moodboards
      { deliverableId: brandingDeliverables[2].id, sortOrder: 3 }, // Personality & Tone
      { deliverableId: brandingDeliverables[4].id, sortOrder: 4 }, // Messaging Pillars
    ];

    for (const link of foundationBrandingLinks) {
      await pool.query(
        `INSERT INTO sprint_package_deliverables (
          id, sprint_package_id, deliverable_id, quantity, complexity_score, sort_order, created_at
        ) VALUES ($1, $2, $3, 1, 1.0, $4, now())`,
        [crypto.randomUUID(), actualFoundationBrandingId, link.deliverableId, link.sortOrder]
      );
    }

    // Calculate totals for foundation branding
    const foundationBrandingTotals = await pool.query(
      `SELECT 
        SUM(d.fixed_price * spd.quantity * spd.complexity_score) as total_price,
        SUM(d.fixed_hours * spd.quantity * spd.complexity_score) as total_hours,
        SUM(d.default_estimate_points) as total_points
       FROM sprint_package_deliverables spd
       JOIN deliverables d ON spd.deliverable_id = d.id
       WHERE spd.sprint_package_id = $1`,
      [actualFoundationBrandingId]
    );

    results.foundationPackages.push({
      id: actualFoundationBrandingId,
      name: "Foundation Branding Sprint",
      slug: "foundation-branding",
      totalPrice: parseFloat(foundationBrandingTotals.rows[0].total_price),
      totalHours: parseFloat(foundationBrandingTotals.rows[0].total_hours),
      totalPoints: parseInt(foundationBrandingTotals.rows[0].total_points),
      includesWorkshop: true,
    });

    // Foundation Product Sprint
    const foundationProductId = crypto.randomUUID();
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
        foundationProductId,
        "Foundation Product Sprint",
        "foundation-product",
        "Complete foundation for early-stage founders building their product. Includes the required 3-hour Brand Sprint Workshop PLUS core product deliverables. This is your first sprint - perfect for translating strategy into product clarity and UX structure.",
        "Product",
        "Workshop + Product Foundation (Your First Sprint)",
        null, // dynamic pricing
        null, // dynamic hours
        true,
        true, // featured
        2, // sort order (show second)
      ]
    );

    // Get actual package ID (in case of conflict)
    const foundationProductResult = await pool.query(
      `SELECT id FROM sprint_packages WHERE slug = 'foundation-product'`
    );
    const actualFoundationProductId = foundationProductResult.rows[0].id;

    // Delete existing deliverables for this package
    await pool.query(
      `DELETE FROM sprint_package_deliverables WHERE sprint_package_id = $1`,
      [actualFoundationProductId]
    );

    // Link deliverables (workshop + 5 product deliverables)
    const foundationProductLinks = [
      { deliverableId: workshopId, sortOrder: 0 }, // Workshop first!
      { deliverableId: productDeliverables[0].id, sortOrder: 1 }, // ICP & Personas
      { deliverableId: productDeliverables[1].id, sortOrder: 2 }, // Journey Map
      { deliverableId: productDeliverables[2].id, sortOrder: 3 }, // Product Principles
      { deliverableId: productDeliverables[3].id, sortOrder: 4 }, // Feature Hierarchy
      { deliverableId: productDeliverables[4].id, sortOrder: 5 }, // UX Flows
    ];

    for (const link of foundationProductLinks) {
      await pool.query(
        `INSERT INTO sprint_package_deliverables (
          id, sprint_package_id, deliverable_id, quantity, complexity_score, sort_order, created_at
        ) VALUES ($1, $2, $3, 1, 1.0, $4, now())`,
        [crypto.randomUUID(), actualFoundationProductId, link.deliverableId, link.sortOrder]
      );
    }

    // Calculate totals for foundation product
    const foundationProductTotals = await pool.query(
      `SELECT 
        SUM(d.fixed_price * spd.quantity * spd.complexity_score) as total_price,
        SUM(d.fixed_hours * spd.quantity * spd.complexity_score) as total_hours,
        SUM(d.default_estimate_points) as total_points
       FROM sprint_package_deliverables spd
       JOIN deliverables d ON spd.deliverable_id = d.id
       WHERE spd.sprint_package_id = $1`,
      [actualFoundationProductId]
    );

    results.foundationPackages.push({
      id: actualFoundationProductId,
      name: "Foundation Product Sprint",
      slug: "foundation-product",
      totalPrice: parseFloat(foundationProductTotals.rows[0].total_price),
      totalHours: parseFloat(foundationProductTotals.rows[0].total_hours),
      totalPoints: parseInt(foundationProductTotals.rows[0].total_points),
      includesWorkshop: true,
    });

    // ============================================
    // 5. FOLLOW-ON PACKAGES (NO WORKSHOP)
    // ============================================

    // Branding Refinement Sprint (no workshop)
    const brandingRefinementId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO sprint_packages (
        id, name, slug, description, category, tagline,
        flat_fee, flat_hours, active, featured, sort_order,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = now()
      RETURNING id`,
      [
        brandingRefinementId,
        "Branding Refinement Sprint",
        "branding-refinement",
        "Expand and refine your brand identity with additional visual and messaging elements. Requires completed Foundation sprint. NO workshop needed - references your original Brand Sprint Workshop.",
        "Branding",
        "Expand Your Brand (Follow-On Sprint)",
        null,
        null,
        true,
        false, // not featured
        10, // lower sort order
      ]
    );

    const brandingRefinementResult = await pool.query(
      `SELECT id FROM sprint_packages WHERE slug = 'branding-refinement'`
    );
    const actualBrandingRefinementId = brandingRefinementResult.rows[0].id;

    await pool.query(
      `DELETE FROM sprint_package_deliverables WHERE sprint_package_id = $1`,
      [actualBrandingRefinementId]
    );

    // Add Visual Language Starter Kit + Brand Narrative (NO workshop)
    const brandingRefinementLinks = [
      { deliverableId: brandingDeliverables[3].id, sortOrder: 0 }, // Visual Language
      { deliverableId: brandingDeliverables[4].id, sortOrder: 1 }, // Messaging Pillars
    ];

    for (const link of brandingRefinementLinks) {
      await pool.query(
        `INSERT INTO sprint_package_deliverables (
          id, sprint_package_id, deliverable_id, quantity, complexity_score, sort_order, created_at
        ) VALUES ($1, $2, $3, 1, 1.0, $4, now())`,
        [crypto.randomUUID(), actualBrandingRefinementId, link.deliverableId, link.sortOrder]
      );
    }

    const brandingRefinementTotals = await pool.query(
      `SELECT 
        SUM(d.fixed_price * spd.quantity * spd.complexity_score) as total_price,
        SUM(d.fixed_hours * spd.quantity * spd.complexity_score) as total_hours,
        SUM(d.default_estimate_points) as total_points
       FROM sprint_package_deliverables spd
       JOIN deliverables d ON spd.deliverable_id = d.id
       WHERE spd.sprint_package_id = $1`,
      [actualBrandingRefinementId]
    );

    results.followOnPackages.push({
      id: actualBrandingRefinementId,
      name: "Branding Refinement Sprint",
      slug: "branding-refinement",
      totalPrice: parseFloat(brandingRefinementTotals.rows[0].total_price),
      totalHours: parseFloat(brandingRefinementTotals.rows[0].total_hours),
      totalPoints: parseInt(brandingRefinementTotals.rows[0].total_points),
      includesWorkshop: false,
    });

    // Product UX Refinement Sprint (no workshop)
    const productRefinementId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO sprint_packages (
        id, name, slug, description, category, tagline,
        flat_fee, flat_hours, active, featured, sort_order,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = now()
      RETURNING id`,
      [
        productRefinementId,
        "Product UX Refinement Sprint",
        "product-ux-refinement",
        "Deepen your product foundation with additional UX work and feature definition. Requires completed Foundation sprint. NO workshop needed - references your original Brand Sprint Workshop.",
        "Product",
        "Refine Your Product (Follow-On Sprint)",
        null,
        null,
        true,
        false, // not featured
        11, // lower sort order
      ]
    );

    const productRefinementResult = await pool.query(
      `SELECT id FROM sprint_packages WHERE slug = 'product-ux-refinement'`
    );
    const actualProductRefinementId = productRefinementResult.rows[0].id;

    await pool.query(
      `DELETE FROM sprint_package_deliverables WHERE sprint_package_id = $1`,
      [actualProductRefinementId]
    );

    // Add User Journey + UX Flows (NO workshop)
    const productRefinementLinks = [
      { deliverableId: productDeliverables[1].id, sortOrder: 0 }, // Journey Map
      { deliverableId: productDeliverables[4].id, sortOrder: 1 }, // UX Flows
    ];

    for (const link of productRefinementLinks) {
      await pool.query(
        `INSERT INTO sprint_package_deliverables (
          id, sprint_package_id, deliverable_id, quantity, complexity_score, sort_order, created_at
        ) VALUES ($1, $2, $3, 1, 1.0, $4, now())`,
        [crypto.randomUUID(), actualProductRefinementId, link.deliverableId, link.sortOrder]
      );
    }

    const productRefinementTotals = await pool.query(
      `SELECT 
        SUM(d.fixed_price * spd.quantity * spd.complexity_score) as total_price,
        SUM(d.fixed_hours * spd.quantity * spd.complexity_score) as total_hours,
        SUM(d.default_estimate_points) as total_points
       FROM sprint_package_deliverables spd
       JOIN deliverables d ON spd.deliverable_id = d.id
       WHERE spd.sprint_package_id = $1`,
      [actualProductRefinementId]
    );

    results.followOnPackages.push({
      id: actualProductRefinementId,
      name: "Product UX Refinement Sprint",
      slug: "product-ux-refinement",
      totalPrice: parseFloat(productRefinementTotals.rows[0].total_price),
      totalHours: parseFloat(productRefinementTotals.rows[0].total_hours),
      totalPoints: parseInt(productRefinementTotals.rows[0].total_points),
      includesWorkshop: false,
    });

    return NextResponse.json({
      success: true,
      message: "Complete sprint system seeded successfully",
      summary: {
        workshop: "✅ Brand Sprint Workshop (3h) - $600",
        brandingDeliverables: `✅ ${results.brandingDeliverables.length} branding deliverables`,
        productDeliverables: `✅ ${results.productDeliverables.length} product deliverables`,
        foundationPackages: `✅ 2 foundation packages (WITH workshop)`,
        followOnPackages: `✅ 2 follow-on packages (NO workshop)`,
      },
      results,
    });
  } catch (error: unknown) {
    console.error("Error seeding complete sprint system:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}


