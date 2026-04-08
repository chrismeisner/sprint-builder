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
        sp.tagline,
        sp.emoji,
        sp.pricing_mode,
        sp.package_type,
        sp.duration_weeks,
        sp.requires_package_type,
        sp.requires_package_id,
        sp.base_rate,
        sp.flat_fee,
        sp.flat_hours,
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
              'scope', d.scope,
              'fixedHours', d.fixed_hours,
              'fixedPrice', d.fixed_price,
              'defaultEstimatePoints', COALESCE(d.default_estimate_points, d.points),
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
      tagline,
      emoji,
      pricingMode,
      packageType,
      durationWeeks,
      requiresPackageType,
      requiresPackageId,
      flatFee,
      flatHours,
      baseRate,
      active,
      featured,
      sortOrder,
      deliverables,
    } = body as {
      name?: unknown;
      slug?: unknown;
      description?: unknown;
      tagline?: unknown;
      emoji?: unknown;
      pricingMode?: unknown;
      packageType?: unknown;
      durationWeeks?: unknown;
      requiresPackageType?: unknown;
      requiresPackageId?: unknown;
      flatFee?: unknown;
      flatHours?: unknown;
      baseRate?: unknown;
      active?: unknown;
      featured?: unknown;
      sortOrder?: unknown;
      deliverables?: unknown;
    };
    const existingPackageRes = await pool.query(
      `SELECT pricing_mode, package_type FROM sprint_packages WHERE id = $1`,
      [params.id]
    );
    if (existingPackageRes.rowCount === 0) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    const existingPricingMode = existingPackageRes.rows[0]?.pricing_mode as string | null;
    const existingPackageType = existingPackageRes.rows[0]?.package_type as string | null;

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
    if (typeof tagline === "string") {
      updates.push(`tagline = $${paramIndex++}`);
      values.push(tagline || null);
    }
    if (typeof emoji === "string") {
      updates.push(`emoji = $${paramIndex++}`);
      values.push(emoji.trim() || null);
    }
    if (packageType !== undefined) {
      const pkgType =
        packageType === "expansion_cycle" ||
        packageType === "standard_sprint" ||
        packageType === "foundation" ||
        packageType === "extend"
          ? packageType
          : null;
      if (!pkgType) {
        return NextResponse.json(
          { error: "packageType must be one of: standard_sprint, expansion_cycle, foundation, extend" },
          { status: 400 }
        );
      }
      updates.push(`package_type = $${paramIndex++}`);
      values.push(pkgType);
      if (pkgType === "expansion_cycle" && durationWeeks === undefined) {
        updates.push(`duration_weeks = $${paramIndex++}`);
        values.push(1);
      }
    }
    if (durationWeeks !== undefined) {
      const parsed = Number(durationWeeks);
      let weeks = Number.isFinite(parsed) && parsed >= 1 && parsed <= 52 ? Math.round(parsed) : null;
      if (weeks == null) {
        return NextResponse.json(
          { error: "durationWeeks must be a number between 1 and 52" },
          { status: 400 }
        );
      }
      if (packageType === "expansion_cycle") weeks = 1;
      updates.push(`duration_weeks = $${paramIndex++}`);
      values.push(weeks);
    }
    if (requiresPackageType !== undefined) {
      const reqType =
        typeof requiresPackageType === "string" && requiresPackageType.trim().length > 0
          ? requiresPackageType.trim()
          : null;
      updates.push(`requires_package_type = $${paramIndex++}`);
      values.push(reqType);
    }
    if (requiresPackageId !== undefined) {
      const reqId =
        typeof requiresPackageId === "string" && requiresPackageId.trim().length > 0
          ? requiresPackageId.trim()
          : null;
      updates.push(`requires_package_id = $${paramIndex++}`);
      values.push(reqId);
    }
    const parsedFlatFee =
      typeof flatFee === "number"
        ? flatFee
        : typeof flatFee === "string" && flatFee.trim()
          ? Number(flatFee)
          : null;
    const normalizedFlatFee =
      parsedFlatFee != null && Number.isFinite(parsedFlatFee) && parsedFlatFee > 0
        ? parsedFlatFee
        : null;
    if (pricingMode !== undefined) {
      const mode =
        pricingMode === "flat" || pricingMode === "calculated" ? pricingMode : null;
      if (!mode) {
        return NextResponse.json(
          { error: "pricingMode must be 'calculated' or 'flat'" },
          { status: 400 }
        );
      }
      if (mode === "flat") {
        if (flatFee !== undefined && normalizedFlatFee == null) {
          return NextResponse.json(
            { error: "Flat fee must be a positive number in flat pricing mode" },
            { status: 400 }
          );
        }
        if (flatFee === undefined) {
          const existingFeeRes = await pool.query(
            `SELECT flat_fee FROM sprint_packages WHERE id = $1`,
            [params.id]
          );
          const existingFee = Number(existingFeeRes.rows[0]?.flat_fee);
          if (!Number.isFinite(existingFee) || existingFee <= 0) {
            return NextResponse.json(
              { error: "Flat fee is required when switching to flat pricing mode" },
              { status: 400 }
            );
          }
        }
      }
      updates.push(`pricing_mode = $${paramIndex++}`);
      values.push(mode);
    }
    const nextPackageType =
      packageType === "expansion_cycle" ||
      packageType === "standard_sprint" ||
      packageType === "foundation" ||
      packageType === "extend"
        ? packageType
        : packageType === undefined
          ? existingPackageType
          : null;
    const nextPricingMode =
      pricingMode === "flat" || pricingMode === "calculated"
        ? pricingMode
        : pricingMode === undefined
          ? existingPricingMode
          : null;
    if (nextPackageType === "expansion_cycle" && nextPricingMode !== "flat") {
      return NextResponse.json(
        { error: "Expansion cycles must use flat pricing mode" },
        { status: 400 }
      );
    }
    if (flatFee !== undefined) {
      updates.push(`flat_fee = $${paramIndex++}`);
      values.push(normalizedFlatFee);
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
    if (baseRate !== undefined) {
      let rate: number | null = null;
      if (typeof baseRate === "number" && Number.isFinite(baseRate) && baseRate > 0) {
        rate = baseRate;
      } else if (typeof baseRate === "string" && baseRate.trim()) {
        const parsed = Number(baseRate);
        if (Number.isFinite(parsed) && parsed > 0) rate = parsed;
      }
      updates.push(`base_rate = $${paramIndex++}`);
      values.push(rate);
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
          const delSortOrder = (d as { sortOrder?: unknown }).sortOrder;

          if (typeof delId === "string" && delId.trim()) {
            const quantity = typeof qty === "number" ? qty : 1;
            const delOrder = typeof delSortOrder === "number" ? delSortOrder : i;

            const junctionId = crypto.randomUUID();
            await pool.query(
              `
              INSERT INTO sprint_package_deliverables (
                id, sprint_package_id, deliverable_id, quantity, sort_order
              )
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (sprint_package_id, deliverable_id) DO NOTHING
            `,
              [
                junctionId,
                params.id,
                delId,
                quantity,
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

