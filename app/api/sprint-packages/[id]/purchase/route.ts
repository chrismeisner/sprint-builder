import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes } from "crypto";

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

    // Calculate totals with complexity adjustments
    let totalHours = 0;
    let totalPrice = 0;
    let totalPoints = 0;

    const deliverablesList: Array<{
      deliverableId: string;
      name: string;
      reason: string;
    }> = [];

    pkg.deliverables.forEach((d) => {
      const baseHours = d.fixedHours ?? 0;
      const basePrice = d.fixedPrice ?? 0;
      const points = d.defaultEstimatePoints ?? 0;
      const qty = d.quantity ?? 1;
      const complexityMultiplier = (d.complexityScore ?? 2.5) / 2.5;

      totalHours += baseHours * complexityMultiplier * qty;
      totalPrice += basePrice * complexityMultiplier * qty;
      totalPoints += points * qty;

      deliverablesList.push({
        deliverableId: d.deliverableId,
        name: d.name,
        reason: `Included in ${pkg.name} package`,
      });
    });

    // Dynamic pricing: use flat_fee if set, otherwise calculate from deliverables
    const finalPrice = pkg.flat_fee ?? totalPrice;
    const finalHours = pkg.flat_hours ?? totalHours;

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
      `INSERT INTO documents (id, content, filename, email, account_id, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [
        documentId,
        JSON.stringify(documentContent),
        `package-${pkg.slug}`,
        user.email,
        user.accountId,
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
          "Wednesday: First concepts shared",
          "Friday: Direction locked in",
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
          "Monday: Implementation begins",
          "Wednesday: Final revisions",
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
        { day: 1, dayOfWeek: "Monday", focus: "Kickoff & Alignment", tasks: ["Workshop with client for discovery and alignment"] },
        { day: 2, dayOfWeek: "Tuesday", focus: "Exploration", tasks: ["Studio creates direction options to choose from"] },
        { day: 3, dayOfWeek: "Wednesday", focus: "First Review", tasks: ["Studio presents direction solutions for review"] },
        { day: 4, dayOfWeek: "Thursday", focus: "Feedback & Refinement", tasks: ["Collect feedback from client", "Refine directions based on input"] },
        { day: 5, dayOfWeek: "Friday", focus: "Direction Lock", tasks: ["Solution direction locked", "Share locked direction with client"] },
        { day: 6, dayOfWeek: "Monday", focus: "Deliverables Alignment", tasks: ["Revisit deliverables from Day 1", "Map agreed solution direction to deliverables", "Align on the downhill execution path"] },
        { day: 7, dayOfWeek: "Tuesday", focus: "Build & Execution", tasks: ["Studio heads down crafting solution"] },
        { day: 8, dayOfWeek: "Wednesday", focus: "Progress Review", tasks: ["Studio shares progress with client", "All deliverables outlined", "Answer questions and clarify needs"] },
        { day: 9, dayOfWeek: "Thursday", focus: "Final Execution", tasks: ["Heads down refining assets and deliverables"] },
        { day: 10, dayOfWeek: "Friday", focus: "Delivery", tasks: ["Solution and assets delivered", "Demo to client", "Handoff completed"] },
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

    await pool.query(
      `INSERT INTO sprint_drafts 
       (id, document_id, sprint_package_id, draft, status, title, deliverable_count, 
        total_estimate_points, total_fixed_hours, total_fixed_price, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())`,
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
      ]
    );

    console.log("[PackagePurchase] Created sprint draft", { sprintDraftId, packageId: params.id, packageSlug: pkg.slug });

    // Link deliverables to sprint with complexity scores
    for (const del of pkg.deliverables) {
      const junctionId = `sd-${randomBytes(8).toString("hex")}`;
      // Use complexity from package, default to 1.0 for standard
      const complexity = del.complexityScore ?? 1.0;
      
      const adjustedHours = (del.fixedHours ?? 0) * complexity * del.quantity;
      const adjustedPrice = (del.fixedPrice ?? 0) * complexity * del.quantity;
      const adjustedPoints = Math.round((del.defaultEstimatePoints ?? 0) * complexity * del.quantity);
      
      await pool.query(
        `INSERT INTO sprint_deliverables 
         (id, sprint_draft_id, deliverable_id, quantity, complexity_score, custom_hours, custom_price, custom_estimate_points, custom_scope)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          junctionId,
          sprintDraftId,
          del.deliverableId,
          del.quantity,
          complexity,
          adjustedHours,
          adjustedPrice,
          adjustedPoints,
          del.scope, // Copy scope from deliverable
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

