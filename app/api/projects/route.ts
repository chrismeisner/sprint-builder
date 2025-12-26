import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { priceFromPoints } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";
import { randomBytes, randomUUID } from "crypto";

type ProjectRow = {
  id: string;
  name: string;
  created_at: string | Date;
  updated_at: string | Date;
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT DISTINCT
        p.id,
        p.name,
        p.created_at,
        p.updated_at,
        p.account_id,
        (p.account_id = $1) AS is_owner
      FROM projects p
      LEFT JOIN project_members pm
        ON pm.project_id = p.id
       AND lower(pm.email) = lower($2)
      WHERE p.account_id = $1
         OR pm.email IS NOT NULL
      ORDER BY p.created_at DESC
      `,
      [user.accountId, user.email]
    );

    return NextResponse.json({
      projects: result.rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        createdAt: new Date((row as ProjectRow).created_at).toISOString(),
        updatedAt: new Date((row as ProjectRow).updated_at).toISOString(),
        accountId: (row as ProjectRow & { account_id?: string }).account_id ?? null,
        isOwner: Boolean((row as { is_owner?: boolean }).is_owner),
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name } = body as { name?: unknown };

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    await ensureSchema();
    const pool = getPool();
    const id = randomUUID();

    const result = await pool.query(
      `INSERT INTO projects (id, account_id, name)
       VALUES ($1, $2, $3)
       RETURNING id, name, created_at, updated_at`,
      [id, user.accountId, name.trim()]
    );

    const row = result.rows[0] as ProjectRow;

    // Ensure creator is added as a project member (by email)
    try {
      await pool.query(
        `
        INSERT INTO project_members (id, project_id, email, added_by_account)
        VALUES ($1, $2, lower($3), $4)
        ON CONFLICT (project_id, email) DO NOTHING
        `,
        [randomUUID(), row.id, user.email, user.accountId]
      );
    } catch (memberErr) {
      console.error("[ProjectsAPI] failed to add creator as member:", memberErr);
    }

    // Auto-create a Foundation sprint draft for this project (best effort)
    try {
      const pkgResult = await pool.query(
        `
        SELECT sp.id, sp.name, sp.slug
        FROM sprint_packages sp
        WHERE sp.slug = 'foundation' AND sp.active = true
        LIMIT 1
        `
      );

      const pkgRowCount = pkgResult.rowCount ?? 0;
      if (pkgRowCount > 0) {
        const pkg = pkgResult.rows[0] as { id: string; name: string; slug: string };

        // Fetch deliverables for the package (with complexity)
        const delRes = await pool.query(
          `
          SELECT 
            spd.deliverable_id,
            spd.quantity,
            COALESCE(spd.complexity_score, 1.0) as complexity_score,
            d.name,
            d.description,
            d.category,
            d.scope,
            COALESCE(d.points, 0) as points
          FROM sprint_package_deliverables spd
          JOIN deliverables d ON spd.deliverable_id = d.id
          WHERE spd.sprint_package_id = $1
          ORDER BY spd.sort_order ASC
          `,
          [pkg.id]
        );

        const deliverables = delRes.rows as Array<{
          deliverable_id: string;
          quantity: number | null;
          complexity_score: number;
          name: string | null;
          description: string | null;
          category: string | null;
          scope: string | null;
          points: number;
        }>;

        // Create a minimal document record
        const documentId = `doc-${randomBytes(12).toString("hex")}`;
        await pool.query(
          `INSERT INTO documents (id, content, filename, email, account_id, project_id, created_at)
           VALUES ($1, $2::jsonb, $3, $4, $5, $6, now())`,
          [
            documentId,
            JSON.stringify({ source: "auto-project-foundation", projectId: id, packageSlug: pkg.slug }),
            `auto-${pkg.slug}`,
            user.email,
            user.accountId,
            id,
          ]
        );

        // Calculate totals
        let totalPoints = 0;
        let deliverableCount = 0;

        const sprintDraftId = `sprint-${randomBytes(12).toString("hex")}`;

        // Insert sprint_draft
        await pool.query(
          `INSERT INTO sprint_drafts (
             id, document_id, draft, status, title, sprint_package_id, project_id,
             deliverable_count, total_estimate_points, total_fixed_hours, total_fixed_price, updated_at
           )
           VALUES ($1, $2, $3::jsonb, 'draft', $4, $5, $6, 0, 0, 0, 0, now())`,
          [
            sprintDraftId,
            documentId,
            JSON.stringify({ source: "auto-project-foundation", sprintTitle: pkg.name }),
            pkg.name,
            pkg.id,
            id,
          ]
        );

        // Insert deliverables into sprint_deliverables
        for (const d of deliverables) {
          const qty = d.quantity ?? 1;
          const complexity = d.complexity_score ?? 1.0;
          const basePoints = Number(d.points ?? 0);
          const adjustedPoints = basePoints * complexity * qty;
          totalPoints += adjustedPoints;
          deliverableCount += qty;

          await pool.query(
            `INSERT INTO sprint_deliverables (
               id, sprint_draft_id, deliverable_id, quantity,
               deliverable_name, deliverable_description, deliverable_category, deliverable_scope,
               base_points, custom_estimate_points, custom_hours, complexity_score
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              `sd-${randomBytes(8).toString("hex")}`,
              sprintDraftId,
              d.deliverable_id,
              qty,
              d.name,
              d.description,
              d.category,
              d.scope,
              basePoints,
              adjustedPoints,
              adjustedPoints * 10,
              complexity,
            ]
          );
        }

        // Update totals on sprint_draft
        const totalHours = totalPoints * 10;
        const totalPrice = priceFromPoints(totalPoints);
        await pool.query(
          `UPDATE sprint_drafts
           SET deliverable_count = $1,
               total_estimate_points = $2,
               total_fixed_hours = $3,
               total_fixed_price = $4,
               updated_at = now()
           WHERE id = $5`,
          [deliverableCount, totalPoints, totalHours, totalPrice, sprintDraftId]
        );
      }
    } catch (autoErr) {
      console.error("[ProjectsAPI] auto-foundation sprint failed:", autoErr);
      // Do not fail project creation; proceed
    }

    return NextResponse.json(
      {
        project: {
          id: row.id,
          name: row.name,
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to create project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects?id=projectId
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    await ensureSchema();
    const pool = getPool();

    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 AND account_id = $2`,
      [id, user.accountId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to delete project" },
      { status: 500 }
    );
  }
}
