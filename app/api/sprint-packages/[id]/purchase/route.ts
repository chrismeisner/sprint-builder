import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "crypto";
import { calculatePricingFromDeliverables, hoursFromPoints } from "@/lib/pricing";

async function ensureProjectForAccount(pool: ReturnType<typeof getPool>, accountId: string) {
  const existing = await pool.query(
    `SELECT id FROM projects WHERE account_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [accountId]
  );
  if (existing.rowCount && existing.rows[0]?.id) {
    return existing.rows[0].id as string;
  }

  const projectId = `proj-${randomBytes(8).toString("hex")}`;
  const name = "Default project";
  await pool.query(
    `INSERT INTO projects (id, account_id, name) VALUES ($1, $2, $3)`,
    [projectId, accountId, name]
  );
  return projectId;
}

type Params = {
  params: { id: string };
};

/**
 * POST /api/sprint-packages/[id]/purchase
 * Creates a sprint draft for a logged-in user from a sprint package
 * Bypasses Typeform intake by creating a minimal document record
 * Accepts either package ID or slug as the parameter
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to continue." },
        { status: 401 }
      );
    }

    const pool = getPool();
    const projectId = await ensureProjectForAccount(pool, user.accountId);

    // Fetch the sprint package with its deliverables
    const pkgResult = await pool.query(
      `
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.tagline,
        sp.category,
        sp.flat_fee,
        sp.flat_hours,
        COALESCE(
          json_agg(
            json_build_object(
              'deliverableId', d.id,
              'name', d.name,
              'description', d.description,
              'scope', d.scope,
              'fixedHours', d.fixed_hours,
              'fixedPrice', d.fixed_price,
              'defaultEstimatePoints', d.default_estimate_points,
              'category', d.category,
              'quantity', spd.quantity,
              'complexityScore', COALESCE(spd.complexity_score, 2.5)
            ) ORDER BY spd.sort_order ASC, d.name ASC
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) as deliverables
      FROM sprint_packages sp
      LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
      LEFT JOIN deliverables d ON spd.deliverable_id = d.id AND d.active = true
      WHERE (sp.id = $1 OR sp.slug = $1) AND sp.active = true
      GROUP BY sp.id
    `,
      [params.id]
    );

    if (pkgResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Package not found or is not available" },
        { status: 404 }
      );
    }

    const pkg = pkgResult.rows[0] as {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      tagline: string | null;
      category: string | null;
      flat_fee: number | null;
      flat_hours: number | null;
      deliverables: Array<{
        deliverableId: string;
        name: string;
        description: string | null;
        scope: string | null;
        fixedHours: number | null;
        fixedPrice: number | null;
        defaultEstimatePoints: number | null;
        category: string | null;
        quantity: number;
        complexityScore: number;
      }>;
    };

    // Calculate totals with complexity adjustments (points-based only)
    const { price: totalPrice, hours: totalHours, points: totalPoints } = calculatePricingFromDeliverables(
      pkg.deliverables.map((d) => ({
        defaultEstimatePoints: d.defaultEstimatePoints,
        quantity: d.quantity,
        complexityScore: d.complexityScore ? (d.complexityScore / 2.5) * 1.0 : 1.0, // normalize using existing 2.5 default baseline
      }))
    );

    const deliverablesList: Array<{
      deliverableId: string;
      name: string;
      reason: string;
    }> = [];

    pkg.deliverables.forEach((d) => {
      deliverablesList.push({
        deliverableId: d.deliverableId,
        name: d.name,
        reason: `Included in ${pkg.name} package`,
      });
    });

    const finalPrice = totalPrice;
    const finalHours = totalHours;

    // Create a minimal document record (package-based, not from Typeform)
    const documentId = `doc-${randomBytes(12).toString("hex")}`;
    const documentContent = {
      source: "package_selection",
      packageId: pkg.id,
      packageSlug: pkg.slug,
      packageName: pkg.name,
      accountId: user.accountId,
      email: user.email,
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO documents (id, content, filename, email, account_id, project_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())`,
      [
        documentId,
        JSON.stringify(documentContent),
        `package-${pkg.slug}`,
        user.email,
        user.accountId,
        projectId,
      ]
    );

    console.log("[PackagePurchase] Created document", { documentId, packageId: params.id, packageSlug: pkg.slug });

    // Create sprint draft from package
    const sprintDraftId = `sprint-${randomBytes(12).toString("hex")}`;
    const sprintDraft = {
      sprintTitle: pkg.name,
      sprintPackageId: pkg.id,
      approach: pkg.description || `Complete ${pkg.name} in a 2-week sprint`,
      deliverables: deliverablesList,
      goals: [
        `Complete all deliverables in ${pkg.name}`,
        `Deliver high-quality results within 2 weeks`,
      ],
      week1: {
        overview: "Week 1 focuses on alignment, exploration, and direction setting",
        goals: [
          "Kickoff workshop and alignment",
          "Initial exploration and concepts",
          "Feedback incorporation and direction lock",
        ],
        deliverables: deliverablesList.slice(0, Math.ceil(deliverablesList.length / 2)),
        milestones: [
          "Monday: Sprint kickoff workshop",
          "Thursday: Ingredient Review - direction shaped together",
          "Friday: Direction locked - async outline shared",
        ],
      },
      week2: {
        overview: "Week 2 focuses on execution, refinement, and final delivery",
        goals: [
          "Execute on locked direction",
          "Refine and polish deliverables",
          "Prepare final handoff",
        ],
        deliverables: deliverablesList.slice(Math.ceil(deliverablesList.length / 2)),
        milestones: [
          "Monday: Direction check, then build begins",
          "Wednesday: Live work-in-progress review",
          "Friday: Delivery and handoff",
        ],
      },
      backlog: pkg.deliverables.map((d, index) => ({
        id: `TASK-${index + 1}`,
        title: d.name,
        description: d.description || d.scope || `Complete ${d.name} deliverable`,
        status: "todo" as const,
        points: d.defaultEstimatePoints ?? 3,
        owner: "team",
        acceptance: `${d.name} completed and meets quality standards`,
      })),
      timeline: [
        {
          day: 1,
          dayOfWeek: "Monday",
          focus: "Kickoff workshop",
          items: [
            "3-hour Brand/Product workshop (or 60-90 min JTBD session for follow-on sprints)",
            "Align on goals, guardrails, success criteria, and decision makers",
            "Capture notes, assign follow-ups, and confirm portal access",
          ],
        },
        {
          day: 2,
          dayOfWeek: "Tuesday",
          focus: "Research + divergence (studio heads down)",
          items: [
            "Audit existing assets, references, and market inputs",
            "Sketch initial directions while staying async-only for focus time",
            "Prompt client for async comments if anything needs clarification",
          ],
        },
        {
          day: 3,
          dayOfWeek: "Wednesday",
          focus: "Work-in-progress share (ingredient/solution buckets)",
          items: [
            "Send Loom or Figma walkthrough showing "ingredient/solution" buckets with grouped variations",
            "Collect inline comments (and optional live sync) to steer what continues into Ingredient Review",
          ],
        },
        {
          day: 4,
          dayOfWeek: "Thursday",
          focus: "Ingredient Review",
          items: [
            "Review grouped solutions and categorized ingredients together",
            "Decide which to keep, refine, discard, or combine",
            "Shape raw materials into one clear direction",
          ],
        },
        {
          day: 5,
          dayOfWeek: "Friday",
          focus: "Direction locked (async outline)",
          items: [
            "Studio documents the downhill execution plan and deliverable checklist",
            "Confirm who gives feedback in Week 2 and what they need to review",
            "Optional sync to walk through the final direction before build",
          ],
        },
        {
          day: 6,
          dayOfWeek: "Monday",
          focus: "Direction check + build kickoff",
          items: [
            "Quick sync to review the locked direction and answer any last questions",
            "Confirm everyone is aligned before going downhill—no directional changes after today",
            "Break the plan into build tickets and begin confident execution",
          ],
        },
        {
          day: 7,
          dayOfWeek: "Tuesday",
          focus: "Deep build day (optional sync share)",
          items: [
            "Heads-down production across all deliverables",
            "Async updates in sprint portal plus optional sync if client wants another peek",
          ],
        },
        {
          day: 8,
          dayOfWeek: "Wednesday",
          focus: "Work-in-progress review (client input)",
          items: [
            "Live or Loom review to see it all coming together—early testing of the build",
            "Validate progress, annotate, and request tweaks before polish",
            "Not complete yet, but the shape is clear",
          ],
        },
        {
          day: 9,
          dayOfWeek: "Thursday",
          focus: "Polish + stress test (studio heads down)",
          items: [
            "Apply Wednesday feedback, QA flows, prep exports/source files",
            "Rehearse demos and walkthrough scripts",
          ],
        },
        {
          day: 10,
          dayOfWeek: "Friday",
          focus: "Delivery + handoff (optional sync)",
          items: [
            "Deliver final files, Loom walkthrough, and documentation",
            "Optional live demo or office hours for final Q&A",
            "Provide next-sprint recommendations and close the loop",
          ],
        },
      ],
      assumptions: [
        "All deliverables follow standard scope and complexity",
        "Client will be available for workshop and feedback sessions",
        "Timeline is 10 working days over 2 weeks (Monday-Friday)",
      ],
      risks: [
        "Delays if feedback not received promptly",
        "Scope changes may require timeline adjustment",
      ],
      notes: [
        `This sprint was created from the ${pkg.name} package`,
        "Package includes pre-defined deliverables with fixed pricing",
        "Customizations can be discussed during kickoff workshop",
      ],
    };

    const startDate = new Date().toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO sprint_drafts 
       (id, document_id, sprint_package_id, draft, status, title, deliverable_count, 
        total_estimate_points, total_fixed_hours, total_fixed_price, project_id, weeks, start_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())`,
      [
        sprintDraftId,
        documentId,
        pkg.id,
        JSON.stringify(sprintDraft),
        "draft",
        pkg.name,
        deliverablesList.length,
        totalPoints,
        finalHours,
        finalPrice,
        projectId,
        2,
        startDate,
      ]
    );

    console.log("[PackagePurchase] Created sprint draft", { sprintDraftId, packageId: params.id, packageSlug: pkg.slug });

    // Link deliverables to sprint with complexity scores
    for (const del of pkg.deliverables) {
      const junctionId = `sd-${randomBytes(8).toString("hex")}`;
      const complexity = del.complexityScore ?? 1.0;

      const basePoints = del.defaultEstimatePoints ?? 0;
      const adjustedHours = hoursFromPoints(basePoints * complexity * del.quantity);
      const adjustedPoints = Math.round(basePoints * complexity * del.quantity);

      await pool.query(
        `INSERT INTO sprint_deliverables 
         (id, sprint_draft_id, deliverable_id, quantity, complexity_score, custom_hours, custom_estimate_points, custom_scope, deliverable_name, deliverable_description, deliverable_category, deliverable_scope, base_points)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          junctionId,
          sprintDraftId,
          del.deliverableId,
          del.quantity,
          complexity,
          adjustedHours,
          adjustedPoints,
          del.scope,
          del.name,
          del.description,
          del.category ?? null,
          del.scope,
          del.defaultEstimatePoints ?? null,
        ]
      );
    }

    console.log("[PackagePurchase] Linked deliverables", { count: pkg.deliverables.length });

    return NextResponse.json(
      {
        success: true,
        sprintDraftId,
        documentId,
        message: "Sprint created successfully from package",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PackagePurchase] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create sprint",
      },
      { status: 500 }
    );
  }
}

