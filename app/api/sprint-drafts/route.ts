import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * POST /api/sprint-drafts
 * Create a sprint draft manually (without AI/Typeform)
 * 
 * Body: {
 *   title: string,
 *   sprintPackageId?: string,  // Optional: start from package
 *   deliverables?: Array<{ deliverableId: string, quantity?: number }>,
 *   status?: string,  // default: 'draft'
 * }
 */
export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    
    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, sprintPackageId, deliverables, customContent, status } = body as {
      title?: unknown;
      sprintPackageId?: unknown;
      deliverables?: unknown;
      customContent?: unknown;
      status?: unknown;
    };

    // Validate
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const sprintStatus = typeof status === "string" && status.trim() ? status : "draft";

    // Create a "manual" document to maintain referential integrity
    const documentId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO documents (id, content, filename)
       VALUES ($1, $2::jsonb, $3)`,
      [
        documentId,
        JSON.stringify({ source: "manual", title, created_at: new Date().toISOString() }),
        "manual-sprint",
      ]
    );

    // Create sprint draft
    const sprintDraftId = crypto.randomUUID();
    const packageId = typeof sprintPackageId === "string" && sprintPackageId.trim() 
      ? sprintPackageId.trim() 
      : null;

    // Merge custom content into draft
    const draftContent = {
      sprintTitle: title,
      source: "manual",
      ...(customContent && typeof customContent === "object" ? customContent : {}),
    };

    await pool.query(
      `INSERT INTO sprint_drafts (id, document_id, draft, status, title, sprint_package_id, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, now())`,
      [
        sprintDraftId,
        documentId,
        JSON.stringify(draftContent),
        sprintStatus,
        title,
        packageId,
      ]
    );

    let totalPoints = 0;
    let totalHours = 0;
    let totalPrice = 0;
    let deliverablesCount = 0;

    // If package specified, use its deliverables
    if (packageId) {
      const pkgDelResult = await pool.query(
        `SELECT 
          spd.deliverable_id,
          spd.quantity,
          d.default_estimate_points,
          d.fixed_hours,
          d.fixed_price
        FROM sprint_package_deliverables spd
        JOIN deliverables d ON spd.deliverable_id = d.id
        WHERE spd.sprint_package_id = $1
        ORDER BY spd.sort_order ASC`,
        [packageId]
      );

      for (const row of pkgDelResult.rows) {
        const deliverableId = row.deliverable_id;
        const quantity = row.quantity ?? 1;
        const points = (row.default_estimate_points ?? 0) * quantity;
        const hours = (row.fixed_hours ?? 0) * quantity;
        const price = (row.fixed_price ?? 0) * quantity;

        totalPoints += points;
        totalHours += hours;
        totalPrice += price;
        deliverablesCount += quantity;

        const junctionId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO sprint_deliverables (id, sprint_draft_id, deliverable_id, quantity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING`,
          [junctionId, sprintDraftId, deliverableId, quantity]
        );
      }
    }
    // Otherwise use provided deliverables
    else if (Array.isArray(deliverables) && deliverables.length > 0) {
      for (const d of deliverables) {
        if (d && typeof d === "object" && "deliverableId" in d) {
          const deliverableId = (d as { deliverableId?: unknown }).deliverableId;
          const qty = (d as { quantity?: unknown }).quantity;
          
          if (typeof deliverableId === "string" && deliverableId.trim()) {
            const quantity = typeof qty === "number" && qty > 0 ? qty : 1;

            // Fetch deliverable details
            const delRes = await pool.query(
              `SELECT default_estimate_points, fixed_hours, fixed_price
               FROM deliverables
               WHERE id = $1`,
              [deliverableId]
            );

            if (delRes.rowCount && delRes.rowCount > 0) {
              const delRow = delRes.rows[0] as {
                default_estimate_points: number | null;
                fixed_hours: number | null;
                fixed_price: number | null;
              };

              const points = (delRow.default_estimate_points ?? 0) * quantity;
              const hours = (delRow.fixed_hours ?? 0) * quantity;
              const price = (delRow.fixed_price ?? 0) * quantity;

              totalPoints += points;
              totalHours += hours;
              totalPrice += price;
              deliverablesCount += quantity;

              const junctionId = crypto.randomUUID();
              await pool.query(
                `INSERT INTO sprint_deliverables (id, sprint_draft_id, deliverable_id, quantity)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING`,
                [junctionId, sprintDraftId, deliverableId, quantity]
              );
            }
          }
        }
      }
    }

    // Update sprint with totals
    if (deliverablesCount > 0) {
      await pool.query(
        `UPDATE sprint_drafts
         SET total_estimate_points = $1,
             total_fixed_hours = $2,
             total_fixed_price = $3,
             deliverable_count = $4,
             updated_at = now()
         WHERE id = $5`,
        [totalPoints, totalHours, totalPrice, deliverablesCount, sprintDraftId]
      );
    }

    return NextResponse.json(
      { 
        sprintDraftId, 
        documentId,
        totalPoints,
        totalHours,
        totalPrice,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[SprintDraftsAPI] POST error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

