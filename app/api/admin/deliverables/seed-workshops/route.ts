import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * POST /api/admin/deliverables/seed-workshops
 * Seeds the database with workshop deliverables
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    const workshops = [
      {
        id: `workshop-${randomBytes(8).toString("hex")}`,
        name: "Sprint Kickoff Workshop - Strategy",
        description: "Best for strategic planning sprints focused on business goals, roadmaps, and go-to-market strategies",
        scope: `• 90-minute virtual workshop (Monday 9am kickoff)
• Goals alignment session with stakeholders
• Strategic objectives prioritization
• Success metrics definition
• Risk assessment and mitigation planning
• Sprint backlog review and prioritization
• Q&A and next steps alignment`,
        category: "Workshop",
        default_estimate_points: 3,
        fixed_hours: 4,
        fixed_price: 800,
        active: true,
      },
      {
        id: `workshop-${randomBytes(8).toString("hex")}`,
        name: "Sprint Kickoff Workshop - Product",
        description: "Best for product development sprints focused on features, user experience, and technical planning",
        scope: `• 90-minute virtual workshop (Monday 9am kickoff)
• Product vision and goals alignment
• User stories and acceptance criteria review
• Feature prioritization exercise
• Technical requirements discussion
• Sprint backlog refinement
• Team capacity and timeline confirmation`,
        category: "Workshop",
        default_estimate_points: 3,
        fixed_hours: 4,
        fixed_price: 800,
        active: true,
      },
      {
        id: `workshop-${randomBytes(8).toString("hex")}`,
        name: "Sprint Kickoff Workshop - Design",
        description: "Best for design-focused sprints including UI/UX, branding, and visual design work",
        scope: `• 90-minute virtual workshop (Monday 9am kickoff)
• Design vision and brand alignment
• Style direction and aesthetic goals
• Design principles workshop
• User experience objectives review
• Design critique guidelines establishment
• Design backlog prioritization`,
        category: "Workshop",
        default_estimate_points: 3,
        fixed_hours: 4,
        fixed_price: 800,
        active: true,
      },
      {
        id: `workshop-${randomBytes(8).toString("hex")}`,
        name: "Sprint Kickoff Workshop - Branding",
        description: "Best for branding sprints focused on brand identity, messaging, and positioning",
        scope: `• 90-minute virtual workshop (Monday 9am kickoff)
• Brand positioning and messaging alignment
• Target audience and persona review
• Brand personality and values definition
• Visual identity direction discussion
• Competitive landscape review
• Brand deliverables prioritization`,
        category: "Workshop",
        default_estimate_points: 3,
        fixed_hours: 4,
        fixed_price: 800,
        active: true,
      },
      {
        id: `workshop-${randomBytes(8).toString("hex")}`,
        name: "Sprint Kickoff Workshop - Startup",
        description: "Best for startup-focused sprints covering MVP development, launch planning, and early-stage needs",
        scope: `• 90-minute virtual workshop (Monday 9am kickoff)
• MVP scope and goals alignment
• Market validation approach
• Launch strategy and timeline
• Resource and budget planning
• Success metrics for MVP
• Startup sprint backlog review`,
        category: "Workshop",
        default_estimate_points: 3,
        fixed_hours: 4,
        fixed_price: 800,
        active: true,
      },
      {
        id: `workshop-${randomBytes(8).toString("hex")}`,
        name: "Sprint Kickoff Workshop - Marketing",
        description: "Best for marketing-focused sprints including campaigns, content strategy, and growth initiatives",
        scope: `• 90-minute virtual workshop (Monday 9am kickoff)
• Marketing goals and KPIs alignment
• Campaign strategy and messaging
• Channel selection and prioritization
• Content calendar planning
• Budget allocation review
• Marketing sprint deliverables prioritization`,
        category: "Workshop",
        default_estimate_points: 3,
        fixed_hours: 4,
        fixed_price: 800,
        active: true,
      },
    ];

    // Check if workshops already exist
    const existingCheck = await pool.query(
      `SELECT COUNT(*) as count FROM deliverables WHERE category = 'Workshop'`
    );
    const existingCount = parseInt(existingCheck.rows[0].count);

    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `${existingCount} workshop deliverables already exist. Skipping seed.`,
        existingCount,
      });
    }

    // Insert all workshops
    const insertPromises = workshops.map((workshop) =>
      pool.query(
        `INSERT INTO deliverables 
         (id, name, description, scope, category, default_estimate_points, fixed_hours, fixed_price, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
        [
          workshop.id,
          workshop.name,
          workshop.description,
          workshop.scope,
          workshop.category,
          workshop.default_estimate_points,
          workshop.fixed_hours,
          workshop.fixed_price,
          workshop.active,
        ]
      )
    );

    await Promise.all(insertPromises);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${workshops.length} workshop deliverables`,
      count: workshops.length,
      workshops: workshops.map((w) => ({ id: w.id, name: w.name })),
    });
  } catch (error) {
    console.error("[SeedWorkshops] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

