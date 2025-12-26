import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { POINT_BASE_FEE, priceFromPoints } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

/**
 * POST /api/sprint-drafts
 * Create a sprint draft manually (without AI/Typeform)
 * 
 * Body: {
 *   title: string,
 *   sprintPackageId?: string,  // Optional: start from package
 *   deliverables?: Array<{ deliverableId: string, quantity?: number }>,
 *   status?: string,  // default: 'draft'
 *   projectId?: string,
 *   startDate?: string,
 *   dueDate?: string,
 * }
 */
export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    // Hotfix: ensure base_points column supports decimals (some DBs may still be int)
    try {
      await pool.query(
        `ALTER TABLE sprint_deliverables
         ALTER COLUMN base_points TYPE numeric(10,2)
         USING base_points::numeric(10,2)`
      );
    } catch {
      // ignore if already correct / no-op
    }
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, sprintPackageId, deliverables, customContent, status, projectId, startDate, dueDate } = body as {
      title?: unknown;
      sprintPackageId?: unknown;
      deliverables?: unknown;
      customContent?: unknown;
      status?: unknown;
      projectId?: unknown;
      startDate?: unknown;
      dueDate?: unknown;
    };

    // Validate
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const sprintStatus = typeof status === "string" && status.trim() ? status : "draft";
    const requestedProjectId = typeof projectId === "string" && projectId.trim() ? projectId.trim() : null;
    const startDateValue = typeof startDate === "string" && startDate.trim() ? startDate.trim() : null;
    const dueDateValue = typeof dueDate === "string" && dueDate.trim() ? dueDate.trim() : null;

    const ensureProjectForAccount = async (): Promise<string> => {
      if (requestedProjectId) {
        const owned = await pool.query(
          `
          SELECT DISTINCT p.id
          FROM projects p
          LEFT JOIN project_members pm
            ON pm.project_id = p.id
           AND lower(pm.email) = lower($2)
          WHERE p.id = $1
            AND (p.account_id = $3 OR pm.email IS NOT NULL)
          LIMIT 1
          `,
          [requestedProjectId, user.email, user.accountId]
        );
        if (owned.rowCount === 0) {
          throw new Error("Project not found for this account");
        }
        return requestedProjectId;
      }

      const existing = await pool.query(
        `
        SELECT DISTINCT p.id
        FROM projects p
        LEFT JOIN project_members pm
          ON pm.project_id = p.id
         AND lower(pm.email) = lower($2)
        WHERE p.account_id = $1
           OR pm.email IS NOT NULL
        ORDER BY p.created_at ASC
        LIMIT 1
        `,
        [user.accountId, user.email]
      );
      if (existing.rowCount && existing.rows[0]?.id) {
        return existing.rows[0].id as string;
      }

      const newProjectId = randomUUID();
      await pool.query(
        `INSERT INTO projects (id, account_id, name)
         VALUES ($1, $2, $3)`,
        [newProjectId, user.accountId, "Default project"]
      );
      // Add creator as member for the default project
      await pool.query(
        `
        INSERT INTO project_members (id, project_id, email, added_by_account)
        VALUES ($1, $2, lower($3), $4)
        ON CONFLICT (project_id, email) DO NOTHING
        `,
        [randomUUID(), newProjectId, user.email, user.accountId]
      );
      return newProjectId;
    };

    const projectIdValue = await ensureProjectForAccount();

    // Create a "manual" document to maintain referential integrity
    const documentId = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, content, filename, email, account_id, project_id)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6)`,
      [
        documentId,
        JSON.stringify({ source: "manual", title, created_at: new Date().toISOString() }),
        "manual-sprint",
        user.email,
        user.accountId,
        projectIdValue,
      ]
    );

    // Create sprint draft
    const sprintDraftId = randomUUID();
    const packageId = typeof sprintPackageId === "string" && sprintPackageId.trim()
      ? sprintPackageId.trim()
      : null;

    // Package snapshot (optional)
    let packageNameSnapshot: string | null = null;
    let packageDescriptionSnapshot: string | null = null;
    if (packageId) {
      const pkgRes = await pool.query(
        `SELECT name, description FROM sprint_packages WHERE id = $1`,
        [packageId]
      );
      const pkgRowCount = pkgRes.rowCount ?? 0;
      if (pkgRowCount > 0) {
        packageNameSnapshot = (pkgRes.rows[0] as { name: string | null }).name ?? null;
        packageDescriptionSnapshot = (pkgRes.rows[0] as { description: string | null }).description ?? null;
      }
    }

    // Merge custom content into draft
    const draftContent = {
      sprintTitle: title,
      source: "manual",
      ...(customContent && typeof customContent === "object" ? customContent : {}),
    };

    await pool.query(
      `INSERT INTO sprint_drafts (
         id, document_id, draft, status, title, sprint_package_id,
         project_id, start_date, due_date,
         package_name_snapshot, package_description_snapshot,
         updated_at
       )
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11, now())`,
      [
        sprintDraftId,
        documentId,
        JSON.stringify(draftContent),
        sprintStatus,
        title,
        packageId,
        projectIdValue,
        startDateValue,
        dueDateValue,
        packageNameSnapshot,
        packageDescriptionSnapshot,
      ]
    );

    let totalComplexity = 0;
    let totalPrice = POINT_BASE_FEE; // base fee
    let deliverablesCount = 0;

    // If package specified, use its deliverables
    if (packageId) {
      const pkgDelResult = await pool.query(
        `SELECT 
          spd.deliverable_id,
          spd.quantity,
          d.points,
          d.name,
          d.description,
          d.category,
          d.scope
        FROM sprint_package_deliverables spd
        JOIN deliverables d ON spd.deliverable_id = d.id
        WHERE spd.sprint_package_id = $1
        ORDER BY spd.sort_order ASC`,
        [packageId]
      );

      for (const row of pkgDelResult.rows) {
        const deliverableId = row.deliverable_id as string;
        const quantityRaw = row.quantity as number | string | null;
        const quantity = Number.isFinite(Number(quantityRaw)) ? Math.max(1, Math.round(Number(quantityRaw))) : 1;
        const basePoints = parseFloat((row.points as number | string | null)?.toString() || "0");
        const complexity = basePoints * quantity;

        totalComplexity += complexity;
        deliverablesCount += quantity;

        const junctionId = randomUUID();
        await pool.query(
          `INSERT INTO sprint_deliverables (
             id, sprint_draft_id, deliverable_id, quantity,
             deliverable_name, deliverable_description, deliverable_category, deliverable_scope, base_points
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING`,
          [
            junctionId,
            sprintDraftId,
            deliverableId,
            quantity,
            row.name ?? null,
            row.description ?? null,
            row.category ?? null,
            row.scope ?? null,
            basePoints,
          ]
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
            const quantityNumber = Number(qty);
            const quantity = Number.isFinite(quantityNumber) && quantityNumber > 0 ? Math.round(quantityNumber) : 1;

            // Fetch deliverable details
            const delRes = await pool.query(
              `SELECT id, name, description, category, scope, points
               FROM deliverables
               WHERE id = $1`,
              [deliverableId]
            );

            if (delRes.rowCount && delRes.rowCount > 0) {
              const delRow = delRes.rows[0] as {
                id: string;
                name: string | null;
                description: string | null;
                category: string | null;
                scope: string | null;
                points: number | null;
              };

              const basePoints = parseFloat((delRow.points as number | string | null)?.toString() || "0");
              const complexity = basePoints * quantity;

              totalComplexity += complexity;
              deliverablesCount += quantity;

              const junctionId = randomUUID();
              await pool.query(
                `INSERT INTO sprint_deliverables (
                   id, sprint_draft_id, deliverable_id, quantity,
                   deliverable_name, deliverable_description, deliverable_category, deliverable_scope, base_points
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING`,
                [
                  junctionId,
                  sprintDraftId,
                  deliverableId,
                  quantity,
                  delRow.name ?? null,
                  delRow.description ?? null,
                  delRow.category ?? null,
                  delRow.scope ?? null,
                  basePoints,
                ]
              );
            }
          }
        }
      }
    }

    // Final pricing via shared pricing helper
    if (deliverablesCount > 0) {
      totalPrice = priceFromPoints(totalComplexity);
    }

    // Update sprint with totals
    if (deliverablesCount > 0) {
      await pool.query(
        `UPDATE sprint_drafts
         SET total_estimate_points = $1,
             total_fixed_hours = NULL,
             total_fixed_price = $2,
             deliverable_count = $3,
             updated_at = now()
         WHERE id = $4`,
        [totalComplexity, totalPrice, deliverablesCount, sprintDraftId]
      );
    }

    return NextResponse.json(
      { 
        sprintDraftId, 
        documentId,
        totalComplexity,
        totalPrice,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[SprintDraftsAPI] POST error:", error);
    if (error instanceof Error && error.message === "Project not found for this account") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprint-drafts?id=...
 * Deletes a sprint draft and its deliverables (auth required, same account)
 */
export async function DELETE(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const sprintRes = await pool.query(
      `
      SELECT sd.id, sd.document_id, d.account_id
      FROM sprint_drafts sd
      LEFT JOIN documents d ON sd.document_id = d.id
      WHERE sd.id = $1
      `,
      [id]
    );

    if (sprintRes.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as { id: string; document_id: string | null; account_id: string | null };
    if (sprint.account_id && sprint.account_id !== user.accountId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await pool.query(`DELETE FROM sprint_deliverables WHERE sprint_draft_id = $1`, [id]);
    await pool.query(`DELETE FROM sprint_drafts WHERE id = $1`, [id]);
    if (sprint.document_id) {
      await pool.query(`DELETE FROM documents WHERE id = $1`, [sprint.document_id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[SprintDraftsAPI] DELETE error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

