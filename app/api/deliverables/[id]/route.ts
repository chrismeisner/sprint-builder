import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { name, description, category, defaultEstimatePoints, fixedHours, fixedPrice, scope, active } = body as {
      name?: unknown;
      description?: unknown;
      category?: unknown;
      defaultEstimatePoints?: unknown;
      fixedHours?: unknown;
      fixedPrice?: unknown;
      scope?: unknown;
      active?: unknown;
    };

    const fields: string[] = [];
    const values: unknown[] = [];

    if (typeof name === "string") {
      fields.push(`name = $${fields.length + 1}`);
      values.push(name.trim());
    }
    if (typeof description === "string") {
      fields.push(`description = $${fields.length + 1}`);
      values.push(description);
    }
    if (typeof category === "string") {
      fields.push(`category = $${fields.length + 1}`);
      values.push(category);
    }
    if (typeof scope === "string" || scope === null) {
      fields.push(`scope = $${fields.length + 1}`);
      values.push(scope);
    }
    if (typeof active === "boolean") {
      fields.push(`active = $${fields.length + 1}`);
      values.push(active);
    }
    if (defaultEstimatePoints !== undefined) {
      let estimate: number | null = null;
      if (typeof defaultEstimatePoints === "number") {
        estimate = defaultEstimatePoints;
      } else if (typeof defaultEstimatePoints === "string" && defaultEstimatePoints.trim()) {
        const parsed = Number(defaultEstimatePoints);
        if (!Number.isNaN(parsed)) estimate = parsed;
      }
      fields.push(`default_estimate_points = $${fields.length + 1}`);
      values.push(estimate);
    }
    if (fixedHours !== undefined) {
      let hours: number | null = null;
      if (typeof fixedHours === "number") {
        hours = fixedHours;
      } else if (typeof fixedHours === "string" && fixedHours.trim()) {
        const parsed = Number(fixedHours);
        if (!Number.isNaN(parsed)) hours = parsed;
      }
      fields.push(`fixed_hours = $${fields.length + 1}`);
      values.push(hours);
    }
    if (fixedPrice !== undefined) {
      let price: number | null = null;
      if (typeof fixedPrice === "number") {
        price = fixedPrice;
      } else if (typeof fixedPrice === "string" && fixedPrice.trim()) {
        const parsed = Number(fixedPrice);
        if (!Number.isNaN(parsed)) price = parsed;
      }
      fields.push(`fixed_price = $${fields.length + 1}`);
      values.push(price);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push(`updated_at = now()`);
    const setClause = fields.join(", ");

    const result = await pool.query(
      `
        UPDATE deliverables
        SET ${setClause}
        WHERE id = $${values.length + 1}
        RETURNING id
      `,
      [...values, params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM deliverables WHERE id = $1`,
      [params.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


