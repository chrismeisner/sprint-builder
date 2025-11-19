import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

type Params = {
  params: { id: string };
};

/**
 * GET /api/sprint-packages/[id]
 * Get a single sprint package by ID or slug with its deliverables
 */
export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    // Try to find by id first, then by slug
    const result = await pool.query(
      `
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.category,
        sp.tagline,
        sp.flat_fee,
        sp.flat_hours,
        sp.discount_percentage,
        sp.active,
        sp.featured,
        sp.sort_order,
        sp.created_at,
        sp.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', spd.id,
              'deliverableId', d.id,
              'name', d.name,
              'description', d.description,
              'category', d.category,
              'scope', d.scope,
              'fixedHours', d.fixed_hours,
              'fixedPrice', d.fixed_price,
              'defaultEstimatePoints', d.default_estimate_points,
              'quantity', spd.quantity,
              'notes', spd.notes,
              'sortOrder', spd.sort_order
            ) ORDER BY spd.sort_order ASC, d.name ASC
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) as deliverables
      FROM sprint_packages sp
      LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
      LEFT JOIN deliverables d ON spd.deliverable_id = d.id
      WHERE sp.id = $1 OR sp.slug = $1
      GROUP BY sp.id
    `,
      [params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ package: result.rows[0] });
  } catch (error: unknown) {
    console.error("[SprintPackagesAPI] GET [id] error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sprint-packages/[id]
 * Update a sprint package and optionally its deliverables
 * Body: Partial package fields + optional deliverables array
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const body = (await request.json().catch(() => ({}))) as unknown;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      name,
      slug,
      description,
      category,
      tagline,
      flatFee,
      flatHours,
      discountPercentage,
      active,
      featured,
      sortOrder,
      deliverables,
    } = body as {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
      category?: unknown;
      tagline?: unknown;
      flatFee?: unknown;
      flatHours?: unknown;
      discountPercentage?: unknown;
      active?: unknown;
      featured?: unknown;
      sortOrder?: unknown;
      deliverables?: unknown;
    };

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (typeof name === "string" && name.trim()) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }
    if (typeof slug === "string" && slug.trim()) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(slug.trim());
    }
    if (typeof description === "string") {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }
    if (typeof category === "string") {
      updates.push(`category = $${paramIndex++}`);
      values.push(category || null);
    }
    if (typeof tagline === "string") {
      updates.push(`tagline = $${paramIndex++}`);
      values.push(tagline || null);
    }
    if (flatFee !== undefined) {
      let fee: number | null = null;
      if (typeof flatFee === "number") {
        fee = flatFee;
      } else if (typeof flatFee === "string" && flatFee.trim()) {
        const parsed = Number(flatFee);
        if (!Number.isNaN(parsed)) fee = parsed;
      }
      updates.push(`flat_fee = $${paramIndex++}`);
      values.push(fee);
    }
    if (flatHours !== undefined) {
      let hours: number | null = null;
      if (typeof flatHours === "number") {
        hours = flatHours;
      } else if (typeof flatHours === "string" && flatHours.trim()) {
        const parsed = Number(flatHours);
        if (!Number.isNaN(parsed)) hours = parsed;
      }
      updates.push(`flat_hours = $${paramIndex++}`);
      values.push(hours);
    }
    if (discountPercentage !== undefined) {
      let discount: number | null = null;
      if (typeof discountPercentage === "number") {
        discount = discountPercentage;
      } else if (typeof discountPercentage === "string" && discountPercentage.trim()) {
        const parsed = Number(discountPercentage);
        if (!Number.isNaN(parsed)) discount = parsed;
      }
      updates.push(`discount_percentage = $${paramIndex++}`);
      values.push(discount);
    }
    if (typeof active === "boolean") {
      updates.push(`active = $${paramIndex++}`);
      values.push(active);
    }
    if (typeof featured === "boolean") {
      updates.push(`featured = $${paramIndex++}`);
      values.push(featured);
    }
    if (sortOrder !== undefined) {
      let order: number = 0;
      if (typeof sortOrder === "number") {
        order = sortOrder;
      } else if (typeof sortOrder === "string" && sortOrder.trim()) {
        const parsed = Number(sortOrder);
        if (!Number.isNaN(parsed)) order = parsed;
      }
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(order);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = now()`);
      values.push(params.id);

      const updateQuery = `
        UPDATE sprint_packages
        SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
      `;

      const result = await pool.query(updateQuery, values);
      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }
    }

    // Update deliverables if provided (replace all)
    if (Array.isArray(deliverables)) {
      // Remove existing deliverable links
      await pool.query(
        `DELETE FROM sprint_package_deliverables WHERE sprint_package_id = $1`,
        [params.id]
      );

      // Add new deliverable links
      for (let i = 0; i < deliverables.length; i++) {
        const d = deliverables[i];
        if (d && typeof d === "object" && "deliverableId" in d) {
          const delId = (d as { deliverableId?: unknown }).deliverableId;
          const qty = (d as { quantity?: unknown }).quantity;
          const notes = (d as { notes?: unknown }).notes;
          const delSortOrder = (d as { sortOrder?: unknown }).sortOrder;

          if (typeof delId === "string" && delId.trim()) {
            const quantity = typeof qty === "number" ? qty : 1;
            const delOrder = typeof delSortOrder === "number" ? delSortOrder : i;

            const junctionId = crypto.randomUUID();
            await pool.query(
              `
              INSERT INTO sprint_package_deliverables (
                id, sprint_package_id, deliverable_id, quantity, notes, sort_order
              )
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (sprint_package_id, deliverable_id) DO NOTHING
            `,
              [
                junctionId,
                params.id,
                delId,
                quantity,
                typeof notes === "string" ? notes : null,
                delOrder,
              ]
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[SprintPackagesAPI] PATCH [id] error:", error);

    // Handle unique constraint violation (duplicate slug)
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json(
        { error: "A package with this slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprint-packages/[id]
 * Delete a sprint package (cascade deletes deliverable links)
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const result = await pool.query(
      `DELETE FROM sprint_packages WHERE id = $1`,
      [params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[SprintPackagesAPI] DELETE [id] error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

