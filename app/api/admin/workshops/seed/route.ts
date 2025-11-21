import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    const workshops = [
      {
        id: crypto.randomUUID(),
        name: "Sprint Kickoff Workshop - Branding",
        description: "Collaborative kickoff session to align on brand vision, values, and creative direction for your new venture.",
        category: "Branding",
        deliverable_type: "workshop",
        fixed_hours: 2,
        fixed_price: 300,
        default_estimate_points: 3,
        scope: `**What we'll cover:**
- Brand positioning & target audience
- Visual direction & inspiration
- Key brand attributes & personality
- Success criteria & deliverable review

**Format:** 90-minute video call with screen sharing and collaborative whiteboarding

**Outcome:** Clear creative brief and aligned vision for the sprint ahead`,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Sprint Kickoff Workshop - Product",
        description: "Strategic kickoff to define your MVP's core features, user flows, and validation approach.",
        category: "Product",
        deliverable_type: "workshop",
        fixed_hours: 2.5,
        fixed_price: 400,
        default_estimate_points: 4,
        scope: `**What we'll cover:**
- User personas & pain points
- Core value proposition
- Feature prioritization (MVP vs. future)
- User journey mapping
- Technical feasibility & constraints

**Format:** 2-hour video call with collaborative Figjam/Miro board

**Outcome:** Prioritized feature set, validated user flows, and clear technical direction`,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Sprint Kickoff Workshop - Startup",
        description: "Comprehensive kickoff to align on brand, messaging, and launch strategy for your startup.",
        category: "Branding & Strategy",
        deliverable_type: "workshop",
        fixed_hours: 2.5,
        fixed_price: 400,
        default_estimate_points: 4,
        scope: `**What we'll cover:**
- Brand story & positioning
- Target audience & messaging
- Visual identity direction
- Pitch narrative & key messages
- Launch channels & timeline

**Format:** 2-hour video call with strategic exercises and brainstorming

**Outcome:** Unified brand direction, compelling pitch narrative, and go-to-market clarity`,
        active: true,
      },
    ];

    let insertedCount = 0;
    let skippedCount = 0;

    for (const workshop of workshops) {
      // Check if workshop already exists by name
      const existing = await pool.query(
        `SELECT id FROM deliverables WHERE name = $1`,
        [workshop.name]
      );

      if (existing.rows.length > 0) {
        skippedCount++;
        console.log(`Workshop already exists: ${workshop.name}`);
        continue;
      }

      // Insert the workshop
      await pool.query(
        `INSERT INTO deliverables 
          (id, name, description, category, deliverable_type, fixed_hours, fixed_price, default_estimate_points, scope, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          workshop.id,
          workshop.name,
          workshop.description,
          workshop.category,
          workshop.deliverable_type,
          workshop.fixed_hours,
          workshop.fixed_price,
          workshop.default_estimate_points,
          workshop.scope,
          workshop.active,
        ]
      );

      insertedCount++;
      console.log(`Inserted workshop: ${workshop.name}`);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${insertedCount} workshops (${skippedCount} already existed)`,
      inserted: insertedCount,
      skipped: skippedCount,
    });
  } catch (error: unknown) {
    console.error("Error seeding workshops:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

