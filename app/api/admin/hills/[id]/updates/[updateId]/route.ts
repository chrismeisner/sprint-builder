import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type UpdateLink = { url: string; label: string };
type UpdateAttachment = { url: string; fileName: string; mimetype: string; fileSizeBytes?: number };

function sanitizeLinks(links: unknown): UpdateLink[] {
  if (!Array.isArray(links)) return [];
  return links
    .filter(
      (l): l is UpdateLink =>
        typeof l === "object" && l !== null &&
        typeof (l as UpdateLink).url === "string" &&
        typeof (l as UpdateLink).label === "string"
    )
    .map((l) => ({ url: l.url.trim(), label: l.label.trim() }))
    .filter((l) => l.url);
}

function sanitizeAttachments(items: unknown): UpdateAttachment[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter(
      (a): a is UpdateAttachment =>
        typeof a === "object" && a !== null &&
        typeof (a as UpdateAttachment).url === "string" &&
        typeof (a as UpdateAttachment).fileName === "string"
    )
    .map((a) => ({
      url: a.url,
      fileName: a.fileName,
      mimetype: typeof a.mimetype === "string" ? a.mimetype : "application/octet-stream",
      ...(typeof a.fileSizeBytes === "number" ? { fileSizeBytes: a.fileSizeBytes } : {}),
    }))
    .filter((a) => a.url);
}

// PATCH /api/admin/hills/[id]/updates/[updateId] — edit body / frame / links.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; updateId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const body = await request.json();

    const existing = await pool.query(
      `SELECT data FROM hill_events WHERE id = $1 AND hill_id = $2 AND kind = 'update'`,
      [params.updateId, params.id]
    );
    if (existing.rowCount === 0) return NextResponse.json({ error: "Update not found" }, { status: 404 });

    const sets: string[] = [];
    const values: unknown[] = [];
    let n = 1;

    if (typeof body.body === "string") {
      if (!body.body.trim()) return NextResponse.json({ error: "Update text is required" }, { status: 400 });
      sets.push(`body = $${n++}`);
      values.push(body.body.trim());
    }
    if ("frame" in body || "links" in body || "attachments" in body) {
      const prev = (existing.rows[0].data ?? {}) as {
        frame?: string | null;
        links?: UpdateLink[];
        attachments?: UpdateAttachment[];
      };
      const frame = "frame" in body
        ? (typeof body.frame === "string" && body.frame.trim() ? body.frame.trim() : null)
        : prev.frame ?? null;
      const links = "links" in body ? sanitizeLinks(body.links) : prev.links ?? [];
      const attachments = "attachments" in body ? sanitizeAttachments(body.attachments) : prev.attachments ?? [];
      sets.push(`data = $${n++}::jsonb`);
      values.push(JSON.stringify({ frame, links, attachments }));
    }

    if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    values.push(params.updateId, params.id);

    const r = await pool.query(
      `UPDATE hill_events SET ${sets.join(", ")}
        WHERE id = $${n++} AND hill_id = $${n} AND kind = 'update'
        RETURNING id, body, event_type, data, author_email, created_at`,
      values
    );
    return NextResponse.json({ update: r.rows[0] });
  } catch (error) {
    console.error("Error updating hill update:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/admin/hills/[id]/updates/[updateId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; updateId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const r = await pool.query(
      `DELETE FROM hill_events WHERE id = $1 AND hill_id = $2 AND kind = 'update'`,
      [params.updateId, params.id]
    );
    if (r.rowCount === 0) return NextResponse.json({ error: "Update not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting hill update:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 });
  }
}
