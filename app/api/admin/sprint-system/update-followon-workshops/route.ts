import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * Update follow-on sprint packages to include JTBD Alignment Sessions
 * 
 * Follow-on sprints SHOULD have a workshop, but a shorter one:
 * - 60-90 minute JTBD/problem framing session
 * - NOT the full 3-hour Brand Sprint Workshop
 * - Happens after discovery call as Monday kickoff
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    // Create JTBD Alignment Session deliverable
    const jtbdSessionId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO deliverables (
        id, name, description, scope, category, deliverable_type,
        default_estimate_points, fixed_hours, fixed_price, active,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
      ON CONFLICT (id) DO NOTHING`,
      [
        jtbdSessionId,
        "JTBD Alignment Session (60-90 min)",
        "Focused kickoff workshop for follow-on sprints using Jobs-to-be-Done framework. Clarifies the real problem, desired outcome, constraints, and success criteria for this sprint.",
        `• Identify the struggling moment (what's not working)
• Define desired outcome (what progress client needs)
• Clarify constraints (time, budget, technical limitations)
• Establish success criteria (how we'll know sprint succeeded)
• Frame the real problem underlying deliverable requests
• Align on sprint goals and approach
• Extract true intent beyond surface-level asks
• Uses JTBD, Problem Framing, or Outcome/Obstacles framework`,
        "Workshop",
        "workshop",
        3, // story points
        1.5, // 90 minutes
        300, // ~$200/hour
        true,
      ]
    );

    // Check if JTBD session was created
    const jtbdCheck = await pool.query(
      `SELECT id, name FROM deliverables WHERE name LIKE 'JTBD Alignment Session%' LIMIT 1`
    );

    if (jtbdCheck.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create JTBD Alignment Session deliverable",
        },
        { status: 500 }
      );
    }

    const actualJtbdId = jtbdCheck.rows[0].id;

    // Update follow-on packages to include JTBD session
    const followOnPackages = [
      "branding-refinement",
      "product-ux-refinement",
    ];

    const updates = [];

    for (const slug of followOnPackages) {
      // Get package ID
      const pkgResult = await pool.query(
        `SELECT id, name FROM sprint_packages WHERE slug = $1`,
        [slug]
      );

      if (pkgResult.rowCount === 0) {
        console.warn(`Package not found: ${slug}`);
        continue;
      }

      const packageId = pkgResult.rows[0].id;
      const packageName = pkgResult.rows[0].name;

      // Check if JTBD session already linked
      const existingLink = await pool.query(
        `SELECT id FROM sprint_package_deliverables 
         WHERE sprint_package_id = $1 AND deliverable_id = $2`,
        [packageId, actualJtbdId]
      );

      if (existingLink.rowCount === 0) {
        // Add JTBD session as FIRST deliverable (sort_order = -1)
        await pool.query(
          `INSERT INTO sprint_package_deliverables (
            id, sprint_package_id, deliverable_id, quantity, complexity_score, sort_order, created_at
          ) VALUES ($1, $2, $3, 1, 1.0, -1, now())`,
          [crypto.randomUUID(), packageId, actualJtbdId]
        );

        updates.push({
          package: packageName,
          slug,
          action: "Added JTBD Alignment Session",
        });
      } else {
        updates.push({
          package: packageName,
          slug,
          action: "Already has JTBD session",
        });
      }
    }

    // Recalculate totals for updated packages
    const recalculated = [];
    for (const slug of followOnPackages) {
      const totalsResult = await pool.query(
        `SELECT 
          sp.name,
          sp.slug,
          SUM(d.fixed_price * spd.quantity * spd.complexity_score) as total_price,
          SUM(COALESCE(d.default_estimate_points, d.points, 0) * 15 * spd.quantity * spd.complexity_score) as total_hours,
          SUM(d.default_estimate_points) as total_points
         FROM sprint_packages sp
         JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
         JOIN deliverables d ON spd.deliverable_id = d.id
         WHERE sp.slug = $1
         GROUP BY sp.id`,
        [slug]
      );

      const totalsRow = totalsResult.rows[0];
      if ((totalsResult.rowCount ?? 0) > 0 && totalsRow) {
        recalculated.push({
          name: totalsRow.name,
          slug: totalsRow.slug,
          totalPrice: totalsRow.total_price ? parseFloat(totalsRow.total_price) : 0,
          totalHours: totalsRow.total_hours ? parseFloat(totalsRow.total_hours) : 0,
          totalPoints: totalsRow.total_points
            ? parseInt(totalsRow.total_points, 10)
            : 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Follow-on packages updated with JTBD Alignment Sessions",
      jtbdSession: {
        id: actualJtbdId,
        name: "JTBD Alignment Session (60-90 min)",
        hours: 1.5,
        price: 300,
        points: 3,
      },
      updates,
      recalculatedPackages: recalculated,
    });
  } catch (error: unknown) {
    console.error("Error updating follow-on workshops:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}


