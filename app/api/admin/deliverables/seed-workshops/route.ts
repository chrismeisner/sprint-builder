import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * Seed workshop deliverables
 * Workshops are now "off the shelf" catalog items with fixed pricing
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    const workshops = [
      {
        id: crypto.randomUUID(),
        name: "Foundation Workshop (3 hours)",
        description: "Essential kickoff workshop for all new client engagements. Establishes strategic groundwork, aligns on goals, and sets direction for the sprint—whether brand or product focused.",
        scope: `• Align on goals and define the core problem
• Clarify target audience and key use cases
• Define constraints (timeline, budget, resources)
• Establish sprint direction and priorities
• Set clear expectations and success criteria
• Provide strategic groundwork for execution phase`,
        category: "Workshop",
        deliverable_type: "workshop",
        default_estimate_points: 5,
        fixed_hours: 3.0,
        fixed_price: 600, // $200/hour
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Mini Foundation Workshop (1 hour)",
        description: "Streamlined workshop for returning clients starting iteration or expansion sprints. Quickly realigns on goals and confirms deliverables without full discovery.",
        scope: `• Confirm the current problem or opportunity
• Lock in deliverables and complexity points
• Define sprint success criteria
• Update sprint brief with latest context
• Quick alignment for recurring clients`,
        category: "Workshop",
        deliverable_type: "workshop",
        default_estimate_points: 2,
        fixed_hours: 1.0,
        fixed_price: 200,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Branding Workshop (3 hours)",
        description: "Strategic kickoff workshop for branding projects to align on vision, positioning, and visual direction",
        scope: `• Brand positioning and target audience definition
• Visual direction exploration and inspiration gathering
• Key brand attributes and personality exercises
• Competitive landscape review
• Mood boarding and aesthetic alignment
• Success criteria and deliverable review`,
        category: "Workshop",
        deliverable_type: "workshop",
        default_estimate_points: 5,
        fixed_hours: 3.0,
        fixed_price: 600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Product Strategy Workshop (3 hours)",
        description: "Deep-dive workshop for product development to validate user needs, prioritize features, and align on MVP scope",
        scope: `• User personas and pain points analysis
• Core value proposition definition
• Feature prioritization (Must-have vs Nice-to-have)
• User journey mapping and flow validation
• Technical feasibility discussion
• Success metrics and KPI definition`,
        category: "Workshop",
        deliverable_type: "workshop",
        default_estimate_points: 5,
        fixed_hours: 3.0,
        fixed_price: 600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Design Sprint Kickoff (2 hours)",
        description: "Focused kickoff session for design-intensive projects to establish creative direction and design principles",
        scope: `• Design goals and constraints review
• Visual inspiration and reference gathering
• Design principles definition
• Component and pattern strategy
• Interaction model alignment
• Design system discussion (if applicable)`,
        category: "Workshop",
        deliverable_type: "workshop",
        default_estimate_points: 3,
        fixed_hours: 2.0,
        fixed_price: 400,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Content Strategy Workshop (2.5 hours)",
        description: "Workshop for content-heavy projects to align on messaging, tone, and content architecture",
        scope: `• Content audit and gap analysis
• Voice and tone definition
• Messaging hierarchy and key messages
• Content types and formats planning
• Content governance and workflow
• SEO and distribution strategy`,
        category: "Workshop",
        deliverable_type: "workshop",
        default_estimate_points: 4,
        fixed_hours: 2.5,
        fixed_price: 500,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Technical Architecture Workshop (3 hours)",
        description: "Technical planning workshop for development projects to align on architecture, stack, and implementation approach",
        scope: `• Technical requirements review
• Architecture and stack selection
• Data model and API design discussion
• Integration points and dependencies
• Performance and scalability considerations
• Security and compliance requirements`,
        category: "Workshop",
        deliverable_type: "workshop",
        default_estimate_points: 5,
        fixed_hours: 3.0,
        fixed_price: 600,
        active: true,
      },
    ];

    // Insert workshops
    for (const workshop of workshops) {
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
          workshop.id,
          workshop.name,
          workshop.description,
          workshop.scope,
          workshop.category,
          workshop.deliverable_type,
          workshop.default_estimate_points,
          workshop.fixed_hours,
          workshop.fixed_price,
          workshop.active,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Workshop deliverables seeded successfully",
      count: workshops.length,
      workshops: workshops.map((w) => ({
        name: w.name,
        hours: w.fixed_hours,
        price: w.fixed_price,
        points: w.default_estimate_points,
      })),
    });
  } catch (error: unknown) {
    console.error("Error seeding workshop deliverables:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
