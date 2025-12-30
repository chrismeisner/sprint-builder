import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

const ALLOWED_CATEGORIES = ["Branding", "Product"];

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
    const { name, description, category, points, scope, format, active, tags } = body as {
      name?: unknown;
      description?: unknown;
      category?: unknown;
      points?: unknown;
      scope?: unknown;
      format?: unknown;
      active?: unknown;
      tags?: unknown;
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    const normalizeTags = (value: unknown): string[] | null => {
      if (value === undefined) return null;
      if (!Array.isArray(value)) return [];
      const cleaned = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((v) => v.length > 0);
      return Array.from(new Set(cleaned));
    };
    const tagNames = normalizeTags(tags);

    if (typeof name === "string") {
      fields.push(`name = $${fields.length + 1}`);
      values.push(name.trim());
    }
    if (typeof description === "string") {
      fields.push(`description = $${fields.length + 1}`);
      values.push(description);
    }
    if (typeof category === "string") {
      const normalized = category.trim();
      if (normalized && !ALLOWED_CATEGORIES.includes(normalized)) {
        return NextResponse.json({ error: "Category must be Branding or Product" }, { status: 400 });
      }
      fields.push(`category = $${fields.length + 1}`);
      values.push(normalized || null);
    }
    if (typeof scope === "string" || scope === null) {
      fields.push(`scope = $${fields.length + 1}`);
      values.push(scope);
    }
    if (typeof format === "string" || format === null) {
      fields.push(`format = $${fields.length + 1}`);
      values.push(format);
    }
    if (typeof active === "boolean") {
      fields.push(`active = $${fields.length + 1}`);
      values.push(active);
    }
    if (points !== undefined) {
      let pointsValue: number | null = null;
      if (typeof points === "number") {
        pointsValue = points;
      } else if (typeof points === "string" && points.trim()) {
        const parsed = Number(points);
        if (!Number.isNaN(parsed)) pointsValue = parsed;
      }
      if (pointsValue != null) {
        pointsValue = Math.round(pointsValue * 10) / 10;
      }
      fields.push(`points = $${fields.length + 1}`);
      values.push(pointsValue);
    }

    if (fields.length === 0 && tagNames === null) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const setParts = fields.length > 0 ? [...fields, "updated_at = now()"] : ["updated_at = now()"];
    const setClause = setParts.join(", ");

    await pool.query("BEGIN");

    if (setClause.length > 0) {
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
        await pool.query("ROLLBACK");
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    if (tagNames !== null) {
      if (tagNames.length === 0) {
        await pool.query(`DELETE FROM deliverable_tag_links WHERE deliverable_id = $1`, [params.id]);
      } else {
        const tagIds: string[] = [];
        for (const tagName of tagNames) {
          const tagRes = await pool.query(
            `
              INSERT INTO deliverable_tags (id, name)
              VALUES ($1, $2)
              ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
              RETURNING id
            `,
            [crypto.randomUUID(), tagName]
          );
          tagIds.push(tagRes.rows[0].id as string);
        }

        // Remove links not in the new set
        await pool.query(
          `
            DELETE FROM deliverable_tag_links
            WHERE deliverable_id = $1
            AND tag_id NOT IN (SELECT unnest($2::text[]))
          `,
          [params.id, tagIds]
        );

        // Add any missing links
        for (const tagId of tagIds) {
          await pool.query(
            `
              INSERT INTO deliverable_tag_links (deliverable_id, tag_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `,
            [params.id, tagId]
          );
        }
      }
    }

    await pool.query("COMMIT");

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    try {
      const pool = getPool();
      await pool.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
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


