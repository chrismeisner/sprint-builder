import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

const VALID_SUBJECTS = ["hill", "idea", "deliverable", "task", "project"];

// GET /api/admin/notes — the current admin's notes.
// Filters: ?subjectType=&subjectId= (notes filed under a subject),
//          ?inbox=true (unfiled), ?q=search, ?limit=&offset=
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const subjectType = searchParams.get("subjectType");
    const subjectId = searchParams.get("subjectId");
    const inbox = searchParams.get("inbox") === "true";
    const qRaw = (searchParams.get("q") || "").trim();
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10) || 100));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);

    const where: string[] = ["author_account_id = $1"];
    const values: unknown[] = [admin.accountId];
    let n = 2;
    if (subjectType && subjectId) {
      where.push(`subject_type = $${n++} AND subject_id = $${n++}`);
      values.push(subjectType, subjectId);
    } else if (inbox) {
      where.push(`subject_type IS NULL`);
    }
    if (qRaw) {
      where.push(`(body ILIKE $${n} OR to_tsvector('english', body) @@ plainto_tsquery('english', $${n + 1}))`);
      values.push(`%${qRaw}%`, qRaw);
      n += 2;
    }

    const pool = getPool();
    const rows = (
      await pool.query(
        `SELECT id, body, subject_type, subject_id, created_at, updated_at
           FROM notes WHERE ${where.join(" AND ")}
          ORDER BY created_at DESC
          LIMIT $${n++} OFFSET $${n}`,
        [...values, limit, offset]
      )
    ).rows;

    return NextResponse.json({ notes: rows });
  } catch (error) {
    console.error("Error listing notes:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to list notes" }, { status: 500 });
  }
}

// POST /api/admin/notes — capture a note. Body: { body, subjectType?, subjectId? }
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const text = (body.body ?? "").toString().trim();
    if (!text) return NextResponse.json({ error: "Note text is required" }, { status: 400 });

    const subjectType = VALID_SUBJECTS.includes(body.subjectType) ? body.subjectType : null;
    const subjectId = subjectType && typeof body.subjectId === "string" ? body.subjectId : null;

    const id = crypto.randomUUID();
    const pool = getPool();
    const r = await pool.query(
      `INSERT INTO notes (id, author_account_id, body, subject_type, subject_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, body, subject_type, subject_id, created_at, updated_at`,
      [id, admin.accountId, text, subjectType, subjectType ? subjectId : null]
    );
    return NextResponse.json({ note: r.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
