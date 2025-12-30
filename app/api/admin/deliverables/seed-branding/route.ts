import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * Seed branding deliverables for boilerplate branding sprint
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    const deliverables = [
      {
        id: crypto.randomUUID(),
        name: "Wordmark Logo",
        description: "Professional logo design with multiple concepts and revisions",
        scope: `• 3 initial logo concepts
• 2 rounds of revisions on selected concept
• Final logo files in multiple formats (SVG, PNG, EPS)
• Black, white, and color variations
• Usage guidelines for minimum size and clear space`,
        category: "Branding",
        deliverable_type: "standard",
        default_estimate_points: 8,
        fixed_hours: 8.0,
        fixed_price: 1200,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Color Palette (Primary + Secondary)",
        description: "Complete color system with primary and secondary colors for brand consistency",
        scope: `• 2-3 primary brand colors
• 3-4 secondary/accent colors
• Color values in all formats (Hex, RGB, CMYK, Pantone)
• Light and dark mode variations
• Color usage guidelines and accessibility notes`,
        category: "Branding",
        deliverable_type: "standard",
        default_estimate_points: 5,
        fixed_hours: 4.0,
        fixed_price: 600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Brand Moodboard",
        description: "Visual direction board capturing the brand aesthetic, style, and inspiration",
        scope: `• Curated collection of visual inspiration
• Typography and font pairing references
• Photography and imagery style examples
• Color palette inspiration
• Competitive landscape analysis
• Presentation-ready format for stakeholder alignment`,
        category: "Branding",
        deliverable_type: "standard",
        default_estimate_points: 3,
        fixed_hours: 3.0,
        fixed_price: 450,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Typography Scale",
        description: "Complete typographic system with font selections and hierarchy",
        scope: `• Primary and secondary font selections
• Font pairing recommendations
• 6-weight typography scale (H1-H6, body, caption)
• Line height and spacing guidelines
• Web font integration instructions
• License information and usage rights`,
        category: "Branding",
        deliverable_type: "standard",
        default_estimate_points: 5,
        fixed_hours: 4.0,
        fixed_price: 600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Brand Style Guide (Basic)",
        description: "Foundational brand guidelines document covering logo, colors, and typography usage",
        scope: `• Logo usage guidelines (do's and don'ts)
• Color palette with usage rules
• Typography system and hierarchy
• Basic brand application examples
• File formats and technical specifications
• PDF format, 8-12 pages`,
        category: "Branding",
        deliverable_type: "standard",
        default_estimate_points: 8,
        fixed_hours: 6.0,
        fixed_price: 900,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Brand Positioning Statement",
        description: "Clear articulation of brand positioning, target audience, and value proposition",
        scope: `• Target audience definition
• Brand positioning statement
• Key brand attributes (3-5)
• Value proposition and differentiators
• Brand personality and voice description
• 1-page summary document`,
        category: "Branding",
        deliverable_type: "standard",
        default_estimate_points: 5,
        fixed_hours: 4.0,
        fixed_price: 600,
        active: true,
      },
    ];

    // Insert deliverables
    for (const deliverable of deliverables) {
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
          category = EXCLUDED.category,
          deliverable_type = EXCLUDED.deliverable_type,
          default_estimate_points = EXCLUDED.default_estimate_points,
          fixed_hours = EXCLUDED.fixed_hours,
          fixed_price = EXCLUDED.fixed_price,
          active = EXCLUDED.active,
          updated_at = now()`,
        [
          deliverable.id,
          deliverable.name,
          deliverable.description,
          deliverable.scope,
          deliverable.category,
          deliverable.deliverable_type,
          deliverable.default_estimate_points,
          deliverable.fixed_hours,
          deliverable.fixed_price,
          deliverable.active,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Branding deliverables seeded successfully",
      count: deliverables.length,
      deliverables: deliverables.map((d) => ({
        name: d.name,
        hours: d.fixed_hours,
        price: d.fixed_price,
        points: d.default_estimate_points,
      })),
    });
  } catch (error: unknown) {
    console.error("Error seeding branding deliverables:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}





































