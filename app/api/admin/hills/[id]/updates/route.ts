import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

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

// GET /api/admin/hills/[id]/updates — progress updates posted on a hill.
// Daily-updates-style, stored in hill_events (kind='update'). Newest first.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const r = await pool.query(
      `SELECT e.id, e.body, e.event_type, e.data, e.author_email, e.created_at,
              a.name AS author_name
         FROM hill_events e
         LEFT JOIN accounts a ON a.id = e.author_account_id
        WHERE e.hill_id = $1 AND e.kind = 'update'
        ORDER BY e.created_at DESC`,
      [params.id]
    );
    return NextResponse.json({ updates: r.rows });
  } catch (error) {
    console.error("Error listing hill updates:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to list updates" }, { status: 500 });
  }
}

// POST /api/admin/hills/[id]/updates — post a progress update.
// Body: { body (required), frame?, links?: [{url,label}] }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const body = await request.json();
    const text = (body.body ?? "").toString().trim();
    if (!text) return NextResponse.json({ error: "Update text is required" }, { status: 400 });
    const frame = typeof body.frame === "string" && body.frame.trim() ? body.frame.trim() : null;
    const links = sanitizeLinks(body.links);
    const attachments = sanitizeAttachments(body.attachments);

    const hill = await pool.query(`SELECT id FROM hills WHERE id = $1`, [params.id]);
    if (hill.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });

    const id = crypto.randomUUID();
    const r = await pool.query(
      `INSERT INTO hill_events
         (id, hill_id, subject_type, subject_id, kind, event_type, body, author_account_id, author_email, data)
       VALUES ($1, $2, 'hill', $2, 'update', 'daily_update', $3, $4, $5, $6::jsonb)
       RETURNING id, body, event_type, data, author_email, created_at`,
      [id, params.id, text, admin.accountId, admin.email, JSON.stringify({ frame, links, attachments })]
    );
    return NextResponse.json(
      { update: { ...r.rows[0], author_name: admin.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating hill update:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
